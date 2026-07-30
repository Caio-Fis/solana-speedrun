"use client";

import { isSolanaChain } from "@solana/wallet-standard-chains";
import type { UiWallet } from "@wallet-standard/react";
import {
  uiWalletAccountsAreSame,
  useDisconnect,
  useWallets,
} from "@wallet-standard/react";
import { useEffect, useMemo } from "react";

import { useIsHydrated } from "@/hooks/useIsHydrated";
import { truncateAddress } from "@/lib/format";
import { useSelectedAccount } from "@/lib/wallet-context";

import { WalletOption } from "./WalletOption";

const StandardConnect = "standard:connect";
const StandardDisconnect = "standard:disconnect";

// `UiWallet.features` é uma lista de identificadores, não um objeto de features:
// `"standard:connect" in wallet.features` compilaria e seria sempre falso.
function supports(
  wallet: UiWallet,
  feature: `${string}:${string}`,
): boolean {
  return wallet.features.includes(feature);
}

function supportsSolanaConnect(wallet: UiWallet): boolean {
  return wallet.chains.some(isSolanaChain) && supports(wallet, StandardConnect);
}

/**
 * `useDisconnect` estoura se a carteira não expõe `standard:disconnect`, então
 * este componente só é renderizado depois que a feature foi confirmada.
 */
function DisconnectButton({ wallet }: { wallet: UiWallet }) {
  const [isDisconnecting, disconnect] = useDisconnect(wallet);
  const { setAccount } = useSelectedAccount();

  async function handleDisconnect() {
    try {
      await disconnect();
    } finally {
      setAccount(null);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDisconnect}
      disabled={isDisconnecting}
      className="border border-rule px-3.5 py-2 font-mono text-xs uppercase tracking-widest text-muted transition-colors hover:border-rose hover:text-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-progress disabled:opacity-60"
    >
      {isDisconnecting ? "desconectando…" : "desconectar"}
    </button>
  );
}

export function WalletBar() {
  const wallets = useWallets();
  const { account, setAccount } = useSelectedAccount();
  // As carteiras só se registram no browser; renderizar a lista antes da
  // hidratação divergiria do HTML do servidor.
  const isHydrated = useIsHydrated();

  const solanaWallets = useMemo(
    () => wallets.filter(supportsSolanaConnect),
    [wallets],
  );

  const activeWallet = useMemo(
    () =>
      account
        ? solanaWallets.find((wallet) =>
            wallet.accounts.some((candidate) =>
              uiWalletAccountsAreSame(candidate, account),
            ),
          )
        : undefined,
    [solanaWallets, account],
  );

  // A carteira pode revogar a autorização por fora (trocar de conta, sair pela
  // extensão). Se a conta escolhida sumiu, a tela volta ao estado desconectado.
  useEffect(() => {
    if (account && !activeWallet) setAccount(null);
  }, [account, activeWallet, setAccount]);

  // Carteira já autorizada nesta aba: adota a conta sem pedir clique de novo.
  useEffect(() => {
    if (account) return;
    for (const wallet of solanaWallets) {
      const authorized = wallet.accounts.find((candidate) =>
        candidate.chains.some(isSolanaChain),
      );
      if (authorized) {
        setAccount(authorized);
        return;
      }
    }
  }, [account, solanaWallets, setAccount]);

  if (!isHydrated) {
    return <p className="text-sm text-muted">procurando carteiras…</p>;
  }

  if (account && activeWallet) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeWallet.icon} alt="" aria-hidden className="size-5" />
          <div>
            <p className="font-mono text-sm text-text">
              {truncateAddress(account.address)}
            </p>
            <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-muted">
              {activeWallet.name}
            </p>
          </div>
        </div>
        {supports(activeWallet, StandardDisconnect) ? (
          <DisconnectButton wallet={activeWallet} />
        ) : null}
      </div>
    );
  }

  if (solanaWallets.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted">
          Nenhuma carteira Solana detectada neste navegador.
        </p>
        <a
          href="https://phantom.app/download"
          target="_blank"
          rel="noreferrer"
          className="w-fit border-b border-gold/40 font-mono text-xs uppercase tracking-widest text-gold transition-colors hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Instalar a Phantom
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      {solanaWallets.map((wallet) => (
        <WalletOption key={`${wallet.name}-${wallet.version}`} wallet={wallet} />
      ))}
    </div>
  );
}
