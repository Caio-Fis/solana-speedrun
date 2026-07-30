"use client";

import { useState } from "react";

import {
  MAX_MESSAGE_LENGTH,
  useSessionMessages,
} from "@/hooks/useSessionMessages";
import { formatRunTime, truncateAddress } from "@/lib/format";
import { useSelectedAccount } from "@/lib/wallet-context";

export function MessageBoard({ startedAt }: { startedAt: number | null }) {
  const { messages, addMessage, clearMessages } = useSessionMessages();
  const { account } = useSelectedAccount();
  const [draft, setDraft] = useState("");

  const isConnected = account !== null;
  const canSubmit = isConnected && draft.trim().length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!account || !canSubmit) return;
    addMessage(draft, account.address);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-6">
      {messages.length > 0 ? (
        <ol className="flex flex-col">
          {messages.map((message) => (
            <li
              key={message.id}
              className="flex flex-col gap-1 border-b border-rule/60 py-3 sm:flex-row sm:gap-6 sm:py-2.5"
            >
              <span className="shrink-0 font-mono text-xs tabular-nums text-gold/70 sm:w-24 sm:pt-0.5">
                {startedAt === null
                  ? "--:--.-"
                  : formatRunTime(message.ts - startedAt)}
              </span>
              <span className="shrink-0 font-mono text-xs text-muted sm:w-28 sm:pt-0.5">
                {truncateAddress(message.author)}
              </span>
              <span className="min-w-0 break-words text-sm text-text">
                {message.text}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-muted">
          {isConnected
            ? "O log está vazio. Grave a primeira entrada."
            : "O log está vazio. Conecte a carteira para gravar a primeira entrada."}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label htmlFor="message" className="sr-only">
            Mensagem
          </label>
          <input
            id="message"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={!isConnected}
            placeholder={
              isConnected ? "escreva algo…" : "conecte a carteira para gravar"
            }
            className="min-w-0 flex-1 border border-rule bg-panel px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-gold focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSubmit}
            className="shrink-0 border border-gold bg-gold px-6 py-3 font-mono text-xs font-bold uppercase tracking-widest text-ink transition-colors hover:bg-transparent hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-muted/60"
          >
            Gravar
          </button>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="font-mono text-[0.6875rem] text-muted">
            {draft.length}/{MAX_MESSAGE_LENGTH}
          </span>
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={clearMessages}
              className="font-mono text-[0.6875rem] uppercase tracking-widest text-muted transition-colors hover:text-rose focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              Limpar log
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}
