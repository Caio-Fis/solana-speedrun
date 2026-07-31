import type { Page } from "@playwright/test";

export const ENDERECO = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

/**
 * Registra uma carteira Wallet Standard falsa antes do app carregar. Um browser
 * headless não tem extensão, e o app não conhece carteira nenhuma pelo nome —
 * ele só enxerga o protocolo, que é exatamente o que este mock implementa.
 */
export async function instalarCarteiraFalsa(page: Page, endereco = ENDERECO) {
  await page.addInitScript((address) => {
    const ICON =
      "data:image/svg+xml;base64," +
      btoa(
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><rect width="24" height="24" fill="#E8B84B"/></svg>',
      );
    const account = {
      address,
      publicKey: new Uint8Array(32),
      chains: ["solana:devnet"],
      features: [],
      label: "Conta de teste",
    };
    const listeners: ((change: unknown) => void)[] = [];
    const wallet = {
      version: "1.0.0",
      name: "Carteira Falsa",
      icon: ICON,
      chains: ["solana:devnet"],
      accounts: [] as unknown[],
      features: {
        "standard:connect": {
          version: "1.0.0",
          connect: async () => {
            wallet.accounts = [account];
            listeners.forEach((l) => l({ accounts: wallet.accounts }));
            return { accounts: wallet.accounts };
          },
        },
        "standard:disconnect": {
          version: "1.0.0",
          disconnect: async () => {
            wallet.accounts = [];
            listeners.forEach((l) => l({ accounts: wallet.accounts }));
          },
        },
        "standard:events": {
          version: "1.0.0",
          on: (event: string, listener: (change: unknown) => void) => {
            if (event !== "change") return () => {};
            listeners.push(listener);
            return () => listeners.splice(listeners.indexOf(listener), 1);
          },
        },
      },
    };
    const register = (api: { register: (w: unknown) => void }) =>
      api.register(wallet);
    window.addEventListener("wallet-standard:app-ready", (event) =>
      register((event as CustomEvent).detail),
    );
    window.dispatchEvent(
      new CustomEvent("wallet-standard:register-wallet", { detail: register }),
    );
  }, endereco);
}

/**
 * Responde `getBalance` com um valor fixo. Sem isto o teste dependeria do saldo
 * de uma conta real na devnet, que pode mudar, e do RPC público estar de pé.
 */
export async function fixarSaldo(page: Page, lamports: bigint) {
  await page.route("**/api.devnet.solana.com/**", async (route) => {
    const body = route.request().postDataJSON() as { id: unknown; method: string };
    if (body?.method !== "getBalance") return route.continue();
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: body.id,
        result: { context: { slot: 1 }, value: Number(lamports) },
      }),
    });
  });
}

/** Faz o RPC falhar, para exercitar o estado de erro do saldo. */
export async function derrubarRpc(page: Page) {
  await page.route("**/api.devnet.solana.com/**", (route) => route.abort());
}
