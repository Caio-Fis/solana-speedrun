"use client";

import { useSyncExternalStore } from "react";

const noop = () => () => {};
const alwaysTrue = () => true;
const alwaysFalse = () => false;

/**
 * `false` no servidor e durante a hidratação, `true` depois. Usado para adiar
 * a leitura de coisas que só existem no browser — como o registro de carteiras
 * do Wallet Standard — sem divergir do HTML do servidor.
 */
export function useIsHydrated(): boolean {
  return useSyncExternalStore(noop, alwaysTrue, alwaysFalse);
}
