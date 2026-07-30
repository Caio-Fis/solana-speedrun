import { createSolanaRpc, devnet } from "@solana/kit";

/**
 * Endpoint padrão embutido para que o deploy funcione sem configurar env.
 * Sobrescreva com NEXT_PUBLIC_SOLANA_RPC para usar um RPC dedicado
 * (o público da devnet tem rate limit).
 */
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";

export const rpc = createSolanaRpc(devnet(RPC_URL));
