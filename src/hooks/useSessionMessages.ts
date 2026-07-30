"use client";

import { useCallback, useSyncExternalStore } from "react";

const MESSAGES_KEY = "solana-speedrun:messages";

export const MAX_MESSAGE_LENGTH = 180;

export type Message = {
  id: string;
  text: string;
  author: string;
  ts: number;
};

const EMPTY: readonly Message[] = [];

/**
 * Store de módulo: uma única instância por aba. Qualquer componente que chame
 * `useSessionMessages` lê e escreve o mesmo log, sem precisar de contexto.
 */
let cache: readonly Message[] | null = null;
const listeners = new Set<() => void>();

function isMessage(value: unknown): value is Message {
  if (typeof value !== "object" || value === null) return false;
  const m = value as Record<string, unknown>;
  return (
    typeof m.id === "string" &&
    typeof m.text === "string" &&
    typeof m.author === "string" &&
    typeof m.ts === "number"
  );
}

function readFromSession(): readonly Message[] {
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isMessage) : EMPTY;
  } catch {
    // sessionStorage corrompido ou bloqueado: a run começa com o log limpo.
    return EMPTY;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Precisa devolver a mesma referência entre renders, daí o cache. */
function getSnapshot(): readonly Message[] {
  cache ??= readFromSession();
  return cache;
}

/** No servidor e na hidratação o log é vazio; o real entra logo depois. */
function getServerSnapshot(): readonly Message[] {
  return EMPTY;
}

function write(next: readonly Message[]): void {
  cache = next;
  try {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(next));
  } catch {
    // Sem espaço ou storage bloqueado: o log segue só em memória.
  }
  for (const listener of listeners) listener();
}

/**
 * Mensagens da sessão: sobrevivem a um reload da aba e somem quando a aba
 * fecha. Sem banco, sem servidor.
 */
export function useSessionMessages() {
  const messages = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addMessage = useCallback((text: string, author: string) => {
    const trimmed = text.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!trimmed) return;
    write([
      ...getSnapshot(),
      { id: crypto.randomUUID(), text: trimmed, author, ts: Date.now() },
    ]);
  }, []);

  const clearMessages = useCallback(() => write(EMPTY), []);

  return { messages, addMessage, clearMessages };
}
