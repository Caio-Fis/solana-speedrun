"use client";

import { useSyncExternalStore } from "react";

const RUN_START_KEY = "solana-speedrun:run-start";

let runStart: number | null = null;

/** Fixado na primeira leitura para manter a referência estável entre renders. */
function getRunStart(): number {
  if (runStart !== null) return runStart;
  try {
    const stored = sessionStorage.getItem(RUN_START_KEY);
    const parsed = stored ? Number(stored) : Number.NaN;
    if (Number.isFinite(parsed)) {
      runStart = parsed;
    } else {
      runStart = Date.now();
      sessionStorage.setItem(RUN_START_KEY, String(runStart));
    }
  } catch {
    runStart = Date.now();
  }
  return runStart;
}

/** O instante inicial nunca muda durante a sessão, então não há o que assinar. */
function subscribeToRunStart(): () => void {
  return () => {};
}

let tick: number | null = null;

function subscribeToTick(onChange: () => void): () => void {
  tick = Date.now();
  onChange();
  const id = setInterval(() => {
    tick = Date.now();
    onChange();
  }, 100);
  return () => clearInterval(id);
}

const getTick = () => tick;
const getServerTick = () => null;
const getServerRunStart = () => null;

/**
 * O relógio da run. Começa no primeiro carregamento da aba e sobrevive a
 * reloads porque o instante inicial fica no sessionStorage — o mesmo escopo das
 * mensagens. Fechou a aba, a run zera.
 *
 * Devolve `null` no servidor e durante a hidratação, para o HTML bater.
 */
export function useRunClock(): {
  startedAt: number | null;
  elapsedMs: number | null;
} {
  const startedAt = useSyncExternalStore(
    subscribeToRunStart,
    getRunStart,
    getServerRunStart,
  );
  const now = useSyncExternalStore(subscribeToTick, getTick, getServerTick);

  return {
    startedAt,
    elapsedMs: startedAt !== null && now !== null ? now - startedAt : null,
  };
}
