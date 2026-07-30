"use client";

import { address } from "@solana/kit";
import { useCallback, useEffect, useState } from "react";

import {
  DECIMAL_SEPARATOR,
  splitLamports,
  truncateAddress,
} from "@/lib/format";
import { rpc } from "@/lib/rpc";
import { useSelectedAccount } from "@/lib/wallet-context";

const POLL_INTERVAL_MS = 15_000;

function CopyAddressButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
        } catch {
          // Clipboard bloqueado: o endereço segue visível na tela.
        }
      }}
      className="font-mono text-xs text-muted underline decoration-rule underline-offset-4 transition-colors hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      {copied ? "endereço copiado" : `${truncateAddress(value, 6)} · copiar`}
    </button>
  );
}

/**
 * Montado com `key` no endereço, então trocar de conta remonta e o estado
 * nasce limpo — sem efeito de reset.
 */
function BalanceReadout({ walletAddress }: { walletAddress: string }) {
  const [lamports, setLamports] = useState<bigint | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchBalance = useCallback(
    async (abortSignal: AbortSignal) => {
      try {
        const { value } = await rpc
          .getBalance(address(walletAddress))
          .send({ abortSignal });
        if (abortSignal.aborted) return;
        setLamports(value);
        setFailed(false);
      } catch {
        if (abortSignal.aborted) return;
        setFailed(true);
      }
    },
    [walletAddress],
  );

  useEffect(() => {
    const controller = new AbortController();
    // `fetchBalance` é async e só chama setState depois do `await`, nunca de
    // forma síncrona — a regra não enxerga através da fronteira async.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchBalance(controller.signal);
    const id = setInterval(
      () => void fetchBalance(controller.signal),
      POLL_INTERVAL_MS,
    );
    return () => {
      controller.abort();
      clearInterval(id);
    };
  }, [fetchBalance]);

  if (failed && lamports === null) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-sm text-rose">
          O RPC da devnet não respondeu.
        </p>
        <button
          type="button"
          onClick={() => void fetchBalance(new AbortController().signal)}
          className="border border-rule px-3.5 py-2 font-mono text-xs uppercase tracking-widest text-text transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const parts = lamports === null ? null : splitLamports(lamports);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <p className="font-mono leading-none tracking-tight">
          {parts ? (
            <>
              <span className="text-[clamp(3rem,13vw,6.5rem)] font-bold tabular-nums text-gold">
                {parts.whole}
              </span>
              <span className="text-[clamp(1.25rem,5vw,2.5rem)] font-bold tabular-nums text-gold/45">
                {DECIMAL_SEPARATOR}
                {parts.fraction}
              </span>
            </>
          ) : (
            <span className="text-[clamp(3rem,13vw,6.5rem)] font-bold tabular-nums text-muted/40">
              —
            </span>
          )}
        </p>
        <div className="flex flex-col items-start gap-1 pb-2">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-muted">
            SOL · devnet
          </span>
          <CopyAddressButton value={walletAddress} />
        </div>
      </div>
      <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-muted">
        {failed
          ? "sem resposta do RPC — mostrando o último saldo lido"
          : lamports === null
            ? "lendo a conta…"
            : `atualiza a cada ${POLL_INTERVAL_MS / 1000}s`}
      </p>
    </div>
  );
}

export function BalanceCard() {
  const { account } = useSelectedAccount();

  if (!account) {
    return (
      <p className="text-sm text-muted">
        O saldo aparece quando a carteira conecta.
      </p>
    );
  }

  return <BalanceReadout key={account.address} walletAddress={account.address} />;
}
