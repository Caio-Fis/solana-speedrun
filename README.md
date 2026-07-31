# Solana Speedrun

**No ar: <https://solana-speedrun.vercel.app>**

App web onde você conecta uma carteira Solana, lê o saldo na **devnet** e grava
mensagens num log. Sem banco de dados: as mensagens vivem no `sessionStorage` da
aba e somem quando ela fecha.

A interface é um painel de splits de speedrun. O relógio começa no primeiro
carregamento da aba e carimba cada mensagem — o que torna visível o escopo do
armazenamento, em vez de algo que precise ser explicado.

## Stack

- **Next.js 16** (App Router) + React 19 + Tailwind v4
- **[@solana/kit](https://github.com/anza-xyz/kit)** para o RPC — sem `@solana/web3.js`
- **[Wallet Standard](https://github.com/wallet-standard/wallet-standard)**
  (`@wallet-standard/react`) para a conexão, sem modal de terceiros

Qualquer carteira que implemente o Wallet Standard e anuncie uma chain
`solana:*` aparece na lista — Phantom, Solflare, Backpack. Não há código
específico de carteira.

## Rodando local

```bash
npm install
npm run dev
```

Abra <http://localhost:3000>.

O RPC padrão é `https://api.devnet.solana.com`, então não precisa configurar
nada. Para usar um RPC dedicado, copie `.env.example` para `.env.local` e ajuste
`NEXT_PUBLIC_SOLANA_RPC`.

### Colocando SOL na carteira

O app lê a **devnet**, então sua carteira de mainnet vai aparecer zerada. Mude a
rede para devnet na carteira (na Phantom: Configurações → Rede de
desenvolvimento) e peça SOL de teste:

```bash
solana airdrop 2 <SEU_ENDEREÇO> --url devnet
```

Sem a CLI da Solana, use o faucet web: <https://faucet.solana.com>.

## Testes

```bash
npm test           # roda uma vez
npm run test:watch # fica observando
```

Vitest sobre jsdom, 38 testes cobrindo a lógica pura e os dois hooks de estado:

- **`src/lib/format.ts`** — aritmética de lamports em bigint (precisão além do
  `Number.MAX_SAFE_INTEGER`, padding da fração, agrupamento pt-BR) e o
  formatador do relógio (virada de minuto e hora, truncamento, tempo negativo)
- **`src/hooks/useSessionMessages.ts`** — roundtrip do `sessionStorage`, JSON
  corrompido, entradas malformadas, storage bloqueado, trim e limite de
  caracteres, e a sincronia entre dois consumidores do store
- **`src/hooks/useRunClock.ts`** — o início da run sobrevive ao reload, valor
  corrompido recomeça a contagem, e o intervalo é limpo ao desmontar

Não há teste de componente nem E2E versionado. O caminho conectado foi validado
manualmente com uma carteira mock via Wallet Standard contra o RPC real da
devnet, mas esses scripts não estão no repositório.

## Deploy no Vercel

O projeto está publicado em <https://solana-speedrun.vercel.app> e o repositório
está conectado: **todo push na `main` publica em produção automaticamente.**

Para publicar sem passar pelo git:

```bash
npx vercel deploy --prod
```

Nenhuma variável de ambiente é obrigatória: o endpoint da devnet vem embutido
como padrão. Se for usar um RPC dedicado, adicione `NEXT_PUBLIC_SOLANA_RPC` nas
configurações do projeto.

## Estrutura

```
src/
├── app/                  layout, página e tema
├── components/
│   ├── RunPanel.tsx      compõe o painel e o relógio da run
│   ├── WalletBar.tsx     lista as carteiras, conecta e desconecta
│   ├── WalletOption.tsx  um por carteira (os hooks do Wallet Standard são por carteira)
│   ├── BalanceCard.tsx   leitura do saldo com polling e tratamento de erro
│   └── MessageBoard.tsx  o log da sessão
├── hooks/                relógio da run, mensagens da sessão, guard de hidratação
└── lib/                  cliente RPC, formatação, conta selecionada
```

### Duas armadilhas que valem saber

`useConnect`/`useDisconnect` do `@wallet-standard/react` leem a feature da
carteira no corpo do hook e **lançam exceção** se ela não existir. Por isso cada
carteira tem seu próprio componente, e a feature é checada antes de renderizar.

`UiWallet.features` é uma **lista de identificadores**, não um objeto. Escrever
`"standard:connect" in wallet.features` compila e é sempre falso — o correto é
`wallet.features.includes(...)`.
