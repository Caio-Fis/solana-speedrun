import { expect, test } from "@playwright/test";

import {
  derrubarRpc,
  ENDERECO,
  fixarSaldo,
  instalarCarteiraFalsa,
} from "./fixtures";

/** Falha o teste se o app logar erro ou estourar exceção no browser. */
function vigiarConsole(page: import("@playwright/test").Page) {
  const erros: string[] = [];
  page.on("pageerror", (e) => erros.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") erros.push(`console: ${m.text()}`);
  });
  return erros;
}

test.describe("sem carteira instalada", () => {
  test("convida a instalar em vez de mostrar uma lista vazia", async ({ page }) => {
    const erros = vigiarConsole(page);
    await page.goto("/");

    await expect(
      page.getByText("Nenhuma carteira Solana detectada neste navegador."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Instalar a Phantom" })).toBeVisible();
    expect(erros).toEqual([]);
  });

  test("mantém o formulário travado", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("#message")).toBeDisabled();
    await expect(page.locator("#message")).toHaveAttribute(
      "placeholder",
      "conecte a carteira para gravar",
    );
    await expect(page.getByRole("button", { name: "Gravar" })).toBeDisabled();
  });

  test("o relógio da run anda", async ({ page }) => {
    await page.goto("/");
    const relogio = page.getByText("tempo de run").locator("..");

    const antes = await relogio.innerText();
    await page.waitForTimeout(1200);
    expect(await relogio.innerText()).not.toBe(antes);
  });
});

test.describe("carteira conectada", () => {
  test.beforeEach(async ({ page }) => {
    await instalarCarteiraFalsa(page);
  });

  test("lista a carteira e conecta", async ({ page }) => {
    // Regressão: `"standard:connect" in wallet.features` compilava limpo e era
    // sempre falso, porque `features` é uma lista. A tela ficava sem carteira.
    const erros = vigiarConsole(page);
    await fixarSaldo(page, 274_033_190_984n);
    await page.goto("/");

    await page.getByRole("button", { name: "Carteira Falsa" }).click();

    await expect(page.getByText("9WzD…AWWM")).toBeVisible();
    await expect(page.getByRole("button", { name: "desconectar" })).toBeVisible();
    expect(erros).toEqual([]);
  });

  test("mostra o saldo separando SOL dos lamports", async ({ page }) => {
    await fixarSaldo(page, 274_033_190_984n);
    await page.goto("/");
    await page.getByRole("button", { name: "Carteira Falsa" }).click();

    const saldo = page.locator("section").nth(1).locator("p.font-mono").first();
    await expect(saldo).toContainText("274");
    await expect(saldo).toContainText("033190984");
  });

  test("usa vírgula como decimal quando o milhar já usa ponto", async ({ page }) => {
    // 1234,033190984 SOL com ponto nos dois papéis sairia "1.234.033190984".
    await fixarSaldo(page, 1_234_033_190_984n);
    await page.goto("/");
    await page.getByRole("button", { name: "Carteira Falsa" }).click();

    const saldo = page.locator("section").nth(1).locator("p.font-mono").first();
    await expect(saldo).toHaveText(/1\.234,033190984/);
  });

  test("mostra conta vazia sem quebrar", async ({ page }) => {
    await fixarSaldo(page, 0n);
    await page.goto("/");
    await page.getByRole("button", { name: "Carteira Falsa" }).click();

    const saldo = page.locator("section").nth(1).locator("p.font-mono").first();
    await expect(saldo).toHaveText(/0,000000000/);
  });

  test("oferece nova tentativa quando o RPC não responde", async ({ page }) => {
    await derrubarRpc(page);
    await page.goto("/");
    await page.getByRole("button", { name: "Carteira Falsa" }).click();

    await expect(page.getByText("O RPC da devnet não respondeu.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Tentar de novo" })).toBeVisible();
  });

  test("grava mensagens no log com autor e tempo de run", async ({ page }) => {
    await fixarSaldo(page, 274_033_190_984n);
    await page.goto("/");
    await page.getByRole("button", { name: "Carteira Falsa" }).click();

    await page.locator("#message").fill("primeira entrada");
    await page.getByRole("button", { name: "Gravar" }).click();

    const entrada = page.locator("ol li").first();
    await expect(entrada).toContainText("primeira entrada");
    await expect(entrada).toContainText("9WzD…AWWM");
    await expect(entrada).toContainText(/\d\d:\d\d\.\d/);
    await expect(page.getByText("1 entrada")).toBeVisible();
    await expect(page.locator("#message")).toHaveValue("");
  });

  test("mensagens e relógio sobrevivem ao reload da aba", async ({ page }) => {
    await fixarSaldo(page, 274_033_190_984n);
    await page.goto("/");
    await page.getByRole("button", { name: "Carteira Falsa" }).click();
    await page.locator("#message").fill("sobrevive ao reload");
    await page.getByRole("button", { name: "Gravar" }).click();
    await expect(page.getByText("sobrevive ao reload")).toBeVisible();

    const relogio = page.getByText("tempo de run").locator("..");
    const antes = await relogio.innerText();
    await page.reload();

    await expect(page.getByText("sobrevive ao reload")).toBeVisible();
    expect(await relogio.innerText()).not.toBe(antes);
  });

  test("desconectar trava o formulário mas preserva o log", async ({ page }) => {
    await fixarSaldo(page, 274_033_190_984n);
    await page.goto("/");
    await page.getByRole("button", { name: "Carteira Falsa" }).click();
    await page.locator("#message").fill("fica no log");
    await page.getByRole("button", { name: "Gravar" }).click();

    await page.getByRole("button", { name: "desconectar" }).click();

    await expect(page.locator("#message")).toBeDisabled();
    await expect(
      page.getByText("O saldo aparece quando a carteira conecta."),
    ).toBeVisible();
    await expect(page.getByText("fica no log")).toBeVisible();
  });

  test("limpar log esvazia as entradas", async ({ page }) => {
    await fixarSaldo(page, 274_033_190_984n);
    await page.goto("/");
    await page.getByRole("button", { name: "Carteira Falsa" }).click();
    await page.locator("#message").fill("some daqui");
    await page.getByRole("button", { name: "Gravar" }).click();

    await page.getByRole("button", { name: "Limpar log" }).click();

    await expect(page.getByText("some daqui")).toBeHidden();
    await expect(page.getByText("O log está vazio. Grave a primeira entrada.")).toBeVisible();
  });

  test("copia o endereço para a área de transferência", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await fixarSaldo(page, 274_033_190_984n);
    await page.goto("/");
    await page.getByRole("button", { name: "Carteira Falsa" }).click();

    await page.getByRole("button", { name: /copiar/ }).click();

    await expect(page.getByRole("button", { name: "endereço copiado" })).toBeVisible();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(ENDERECO);
  });
});

test("não gera scroll horizontal no mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await instalarCarteiraFalsa(page);
  await fixarSaldo(page, 1_234_033_190_984n);
  await page.goto("/");
  await page.getByRole("button", { name: "Carteira Falsa" }).click();

  const estoura = await page.evaluate(
    () =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(estoura).toBe(false);
});
