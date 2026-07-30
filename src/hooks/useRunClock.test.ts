import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const RUN_START_KEY = "solana-speedrun:run-start";
const INICIO = new Date("2026-07-30T12:00:00Z").getTime();

/** O instante inicial é fixado em nível de módulo — cada teste precisa do seu. */
async function importarFresco() {
  vi.resetModules();
  return import("./useRunClock");
}

beforeEach(() => {
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(INICIO);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useRunClock", () => {
  it("marca o início da run e grava na sessão", async () => {
    const { useRunClock } = await importarFresco();
    const { result } = renderHook(() => useRunClock());

    expect(result.current.startedAt).toBe(INICIO);
    expect(sessionStorage.getItem(RUN_START_KEY)).toBe(String(INICIO));
  });

  it("reaproveita o início gravado, então o reload não zera a run", async () => {
    const trintaSegundosAtras = INICIO - 30_000;
    sessionStorage.setItem(RUN_START_KEY, String(trintaSegundosAtras));

    const { useRunClock } = await importarFresco();
    const { result } = renderHook(() => useRunClock());

    expect(result.current.startedAt).toBe(trintaSegundosAtras);
    expect(result.current.elapsedMs).toBe(30_000);
  });

  it("recomeça se o valor gravado não for um número", async () => {
    sessionStorage.setItem(RUN_START_KEY, "ontem de manhã");

    const { useRunClock } = await importarFresco();
    const { result } = renderHook(() => useRunClock());

    expect(result.current.startedAt).toBe(INICIO);
    expect(result.current.elapsedMs).toBe(0);
  });

  it("avança conforme o tempo passa", async () => {
    const { useRunClock } = await importarFresco();
    const { result } = renderHook(() => useRunClock());

    expect(result.current.elapsedMs).toBe(0);

    // `advanceTimersByTime` já move o relógio do sistema mockado.
    act(() => vi.advanceTimersByTime(2_500));

    expect(result.current.elapsedMs).toBe(2_500);
  });

  it("para de tiquetaquear depois de desmontar", async () => {
    const { useRunClock } = await importarFresco();
    const { result, unmount } = renderHook(() => useRunClock());

    act(() => vi.advanceTimersByTime(1_000));
    const antes = result.current.elapsedMs;
    expect(antes).toBe(1_000);

    unmount();
    act(() => vi.advanceTimersByTime(8_000));

    expect(result.current.elapsedMs).toBe(antes);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ainda cronometra se a sessão estiver bloqueada", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("SecurityError");
    });

    const { useRunClock } = await importarFresco();
    const { result } = renderHook(() => useRunClock());

    expect(result.current.startedAt).toBe(INICIO);
    expect(result.current.elapsedMs).toBe(0);
  });
});
