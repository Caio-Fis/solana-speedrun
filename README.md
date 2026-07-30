# Solana Speedrun

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

## Deploy no Vercel

1. <https://vercel.com/new> → importe este repositório
2. Aceite os padrões — o Vercel detecta Next.js sozinho
3. Deploy

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
