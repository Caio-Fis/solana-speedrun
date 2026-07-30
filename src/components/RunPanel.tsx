"use client";

import { useRunClock } from "@/hooks/useRunClock";
import { useSessionMessages } from "@/hooks/useSessionMessages";
import { formatRunTime } from "@/lib/format";
import { SelectedAccountProvider } from "@/lib/wallet-context";

import { BalanceCard } from "./BalanceCard";
import { MessageBoard } from "./MessageBoard";
import { SplitRow } from "./SplitRow";
import { WalletBar } from "./WalletBar";

function RunClock({ elapsedMs }: { elapsedMs: number | null }) {
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      {/* Reescrito 10x por segundo; narrar cada tique seria ruído. */}
      <span
        aria-hidden
        className="font-mono text-2xl font-bold leading-none tabular-nums text-gold sm:text-3xl"
      >
        {elapsedMs === null ? "--:--.-" : formatRunTime(elapsedMs)}
      </span>
      <span className="font-mono text-[0.6875rem] uppercase tracking-[0.3em] text-muted">
        tempo de run
      </span>
    </div>
  );
}

function Log({ startedAt }: { startedAt: number | null }) {
  const { messages } = useSessionMessages();
  return (
    <SplitRow
      index="03"
      label="log"
      meta={messages.length === 1 ? "1 entrada" : `${messages.length} entradas`}
    >
      <MessageBoard startedAt={startedAt} />
    </SplitRow>
  );
}

export function RunPanel() {
  const { startedAt, elapsedMs } = useRunClock();

  return (
    <SelectedAccountProvider>
      <div className="mx-auto w-full max-w-4xl border-x border-rule sm:border-y">
        <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-5 px-5 pb-7 pt-8 sm:px-8 sm:pt-12">
          <div>
            <h1 className="text-3xl font-extrabold uppercase leading-[0.95] tracking-[-0.03em] sm:text-5xl">
              Solana
              <br />
              Speedrun
            </h1>
            <p className="mt-3 max-w-sm text-sm text-muted">
              Conecte a carteira, leia o saldo na devnet e grave mensagens no log
              da run. Nada sai desta aba.
            </p>
          </div>
          <RunClock elapsedMs={elapsedMs} />
        </header>

        <SplitRow index="01" label="carteira">
          <WalletBar />
        </SplitRow>

        <SplitRow index="02" label="saldo">
          <BalanceCard />
        </SplitRow>

        <Log startedAt={startedAt} />

        <footer className="border-t border-rule px-5 py-5 sm:px-8">
          <p className="font-mono text-[0.6875rem] uppercase tracking-widest text-muted">
            devnet · mensagens só nesta sessão
          </p>
        </footer>
      </div>
    </SelectedAccountProvider>
  );
}
