import { describe, expect, it } from "vitest";

import {
  DECIMAL_SEPARATOR,
  formatRunTime,
  splitLamports,
  truncateAddress,
} from "./format";

describe("splitLamports", () => {
  it("zera as duas metades numa conta vazia", () => {
    expect(splitLamports(0n)).toEqual({ whole: "0", fraction: "000000000" });
  });

  it("preenche a fração com zeros à esquerda", () => {
    // 1 lamport é 0,000000001 SOL — sem o padding viraria 0,1.
    expect(splitLamports(1n)).toEqual({ whole: "0", fraction: "000000001" });
    expect(splitLamports(42n)).toEqual({ whole: "0", fraction: "000000042" });
  });

  it("separa 1 SOL exato sem sobra", () => {
    expect(splitLamports(1_000_000_000n)).toEqual({
      whole: "1",
      fraction: "000000000",
    });
  });

  it("bate com o saldo real lido da devnet", () => {
    expect(splitLamports(274_033_190_984n)).toEqual({
      whole: "274",
      fraction: "033190984",
    });
  });

  it("agrupa milhares no padrão pt-BR", () => {
    expect(splitLamports(1_234_033_190_984n).whole).toBe("1.234");
  });

  it("não perde precisão além do que um number aguentaria", () => {
    // 2^53 lamports estoura a mantissa de um double; com bigint o último
    // dígito tem de sobreviver.
    const alemDoSafeInteger = 9_007_199_254_740_993n;
    expect(splitLamports(alemDoSafeInteger)).toEqual({
      whole: "9.007.199",
      fraction: "254740993",
    });
  });

  it("usa vírgula como decimal, já que o ponto agrupa milhar", () => {
    const { whole, fraction } = splitLamports(1_234_033_190_984n);
    // O ponto em ambos os papéis daria "1.234.033190984".
    expect(`${whole}${DECIMAL_SEPARATOR}${fraction}`).toBe("1.234,033190984");
  });
});

describe("truncateAddress", () => {
  it("mantém as pontas reconhecíveis", () => {
    expect(truncateAddress("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM")).toBe(
      "9WzD…AWWM",
    );
  });

  it("respeita o tamanho de ponta pedido", () => {
    expect(
      truncateAddress("9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", 6),
    ).toBe("9WzDXw…YtAWWM");
  });

  it("devolve intacto o que já é curto demais para encurtar", () => {
    expect(truncateAddress("abc")).toBe("abc");
    expect(truncateAddress("abcdefghi")).toBe("abcdefghi");
  });

  it("encurta assim que há caractere de sobra", () => {
    expect(truncateAddress("abcdefghij")).toBe("abcd…ghij");
  });
});

describe("formatRunTime", () => {
  it("começa zerado", () => {
    expect(formatRunTime(0)).toBe("00:00.0");
  });

  it("mostra décimos", () => {
    expect(formatRunTime(1_500)).toBe("00:01.5");
  });

  it("trunca para baixo, como um cronômetro de run", () => {
    expect(formatRunTime(1_999)).toBe("00:01.9");
  });

  it("vira o minuto", () => {
    expect(formatRunTime(59_900)).toBe("00:59.9");
    expect(formatRunTime(60_000)).toBe("01:00.0");
  });

  it("só mostra hora depois que ela existe", () => {
    expect(formatRunTime(3_599_900)).toBe("59:59.9");
    expect(formatRunTime(3_600_000)).toBe("1:00:00.0");
    expect(formatRunTime(3_661_500)).toBe("1:01:01.5");
  });

  it("não passa de duas casas nos minutos dentro de uma hora", () => {
    expect(formatRunTime(36_000_000)).toBe("10:00:00.0");
  });

  it("trata relógio negativo como zero", () => {
    // Acontece se o horário do sistema andar para trás no meio da run.
    expect(formatRunTime(-5_000)).toBe("00:00.0");
  });
});
