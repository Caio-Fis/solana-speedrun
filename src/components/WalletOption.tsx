"use client";

import { isSolanaChain } from "@solana/wallet-standard-chains";
import type { UiWallet } from "@wallet-standard/react";
import { useConnect } from "@wallet-standard/react";
import { useState } from "react";

import { useSelectedAccount } from "@/lib/wallet-context";

/**
 * Um componente por carteira: `useConnect` lê a feature `standard:connect` da
 * carteira no corpo do hook, então não dá para chamá-lo em laço. Quem renderiza
 * já garantiu que a carteira expõe essa feature.
 */
export function WalletOption({ wallet }: { wallet: UiWallet }) {
  const [isConnecting, connect] = useConnect(wallet);
  const { setAccount } = useSelectedAccount();
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    setError(null);
    try {
      const accounts = await connect();
      const solanaAccount =
        accounts.find((account) => account.chains.some(isSolanaChain)) ?? accounts[0];
      if (!solanaAccount) {
        setError("A carteira conectou sem liberar nenhuma conta.");
        return;
      }
      setAccount(solanaAccount);
    } catch {
      setError("Conexão recusada na carteira.");
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 sm:items-end">
      <button
        type="button"
        onClick={handleConnect}
        disabled={isConnecting}
        className="group flex items-center gap-2.5 border border-rule bg-panel px-3.5 py-2 font-mono text-xs uppercase tracking-widest text-text transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-progress disabled:opacity-60"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={wallet.icon} alt="" aria-hidden className="size-4" />
        {isConnecting ? "conectando…" : wallet.name}
      </button>
      {error ? (
        <p role="alert" className="font-mono text-[0.6875rem] text-rose">
          {error}
        </p>
      ) : null}
    </div>
  );
}
