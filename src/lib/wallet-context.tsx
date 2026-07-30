"use client";

import type { UiWalletAccount } from "@wallet-standard/react";
import { createContext, useContext, useMemo, useState } from "react";

type SelectedAccountContext = {
  account: UiWalletAccount | null;
  setAccount: (account: UiWalletAccount | null) => void;
};

const Context = createContext<SelectedAccountContext | null>(null);

export function SelectedAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [account, setAccount] = useState<UiWalletAccount | null>(null);
  const value = useMemo(() => ({ account, setAccount }), [account]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useSelectedAccount(): SelectedAccountContext {
  const context = useContext(Context);
  if (!context) {
    throw new Error(
      "useSelectedAccount precisa estar dentro de <SelectedAccountProvider>",
    );
  }
  return context;
}
