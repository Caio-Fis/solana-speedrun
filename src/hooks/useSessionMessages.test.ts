import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const MESSAGES_KEY = "solana-speedrun:messages";
const AUTOR = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";

/**
 * O store vive em nível de módulo (uma instância por aba), então cada teste
 * precisa de um módulo recém-importado — senão o cache vaza entre eles.
 */
async function importarFresco() {
  vi.resetModules();
  return import("./useSessionMessages");
}

function lerDoStorage(): unknown {
  return JSON.parse(sessionStorage.getItem(MESSAGES_KEY) ?? "null");
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useSessionMessages", () => {
  it("começa vazio quando não há nada na sessão", async () => {
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());
    expect(result.current.messages).toEqual([]);
  });

  it("recupera as mensagens gravadas na sessão", async () => {
    sessionStorage.setItem(
      MESSAGES_KEY,
      JSON.stringify([{ id: "a", text: "oi", author: AUTOR, ts: 1 }]),
    );
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());
    expect(result.current.messages).toEqual([
      { id: "a", text: "oi", author: AUTOR, ts: 1 },
    ]);
  });

  it("descarta entradas malformadas e mantém as boas", async () => {
    sessionStorage.setItem(
      MESSAGES_KEY,
      JSON.stringify([
        { id: "a", text: "válida", author: AUTOR, ts: 1 },
        { id: "b", text: "sem autor", ts: 2 },
        { texto: "chave errada" },
        null,
        "string solta",
        { id: "c", text: "ts como string", author: AUTOR, ts: "2" },
      ]),
    );
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].text).toBe("válida");
  });

  it("começa limpo se o JSON da sessão estiver corrompido", async () => {
    sessionStorage.setItem(MESSAGES_KEY, "{isto não é json");
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());
    expect(result.current.messages).toEqual([]);
  });

  it("começa limpo se o valor gravado não for uma lista", async () => {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify({ nada: "disso" }));
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());
    expect(result.current.messages).toEqual([]);
  });

  it("grava a mensagem e persiste na sessão", async () => {
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());

    act(() => result.current.addMessage("primeira entrada", AUTOR));

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({
      text: "primeira entrada",
      author: AUTOR,
    });
    expect(lerDoStorage()).toHaveLength(1);
  });

  it("mantém a ordem cronológica", async () => {
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());

    act(() => result.current.addMessage("primeira", AUTOR));
    act(() => result.current.addMessage("segunda", AUTOR));

    expect(result.current.messages.map((m) => m.text)).toEqual([
      "primeira",
      "segunda",
    ]);
  });

  it("tira espaço das pontas", async () => {
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());

    act(() => result.current.addMessage("   com espaço   ", AUTOR));

    expect(result.current.messages[0].text).toBe("com espaço");
  });

  it("ignora mensagem que é só espaço em branco", async () => {
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());

    act(() => result.current.addMessage("      ", AUTOR));
    act(() => result.current.addMessage("\n\t ", AUTOR));

    expect(result.current.messages).toEqual([]);
    expect(sessionStorage.getItem(MESSAGES_KEY)).toBeNull();
  });

  it("corta no limite de caracteres", async () => {
    const { useSessionMessages, MAX_MESSAGE_LENGTH } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());

    act(() => result.current.addMessage("a".repeat(MAX_MESSAGE_LENGTH + 50), AUTOR));

    expect(result.current.messages[0].text).toHaveLength(MAX_MESSAGE_LENGTH);
  });

  it("esvazia o log e reflete isso na sessão", async () => {
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());

    act(() => result.current.addMessage("some daqui", AUTOR));
    act(() => result.current.clearMessages());

    expect(result.current.messages).toEqual([]);
    expect(lerDoStorage()).toEqual([]);
  });

  it("mantém dois consumidores em sincronia", async () => {
    // Regressão: com o estado dentro do hook, o contador do cabeçalho e o
    // formulário viravam dois logs independentes.
    const { useSessionMessages } = await importarFresco();
    const cabecalho = renderHook(() => useSessionMessages());
    const formulario = renderHook(() => useSessionMessages());

    act(() => formulario.result.current.addMessage("entrada", AUTOR));

    expect(cabecalho.result.current.messages).toHaveLength(1);
    expect(cabecalho.result.current.messages[0].text).toBe("entrada");
  });

  it("segue funcionando em memória se a sessão recusar a escrita", async () => {
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("QuotaExceededError");
    });

    act(() => result.current.addMessage("sem espaço no storage", AUTOR));

    expect(result.current.messages).toHaveLength(1);
  });

  it("dá um id distinto para cada mensagem", async () => {
    const { useSessionMessages } = await importarFresco();
    const { result } = renderHook(() => useSessionMessages());

    act(() => result.current.addMessage("uma", AUTOR));
    act(() => result.current.addMessage("outra", AUTOR));

    const [a, b] = result.current.messages;
    expect(a.id).not.toBe(b.id);
  });
});
