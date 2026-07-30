const LAMPORTS_PER_SOL = 1_000_000_000n;

/**
 * Vírgula, não ponto: a parte inteira é agrupada em pt-BR, onde o ponto já é
 * separador de milhar. Usar ponto aqui faria 1234,033190984 SOL virar
 * "1.234.033190984", com o mesmo caractere em dois papéis.
 */
export const DECIMAL_SEPARATOR = ",";

/**
 * Separa lamports nas duas metades que o painel mostra lado a lado: a parte
 * inteira em SOL e os 9 dígitos fracionários. Feito com bigint para não perder
 * precisão — um saldo grande em `number` já estouraria a mantissa.
 */
export function splitLamports(lamports: bigint): {
  whole: string;
  fraction: string;
} {
  const whole = lamports / LAMPORTS_PER_SOL;
  const fraction = lamports % LAMPORTS_PER_SOL;
  return {
    whole: whole.toLocaleString("pt-BR"),
    fraction: fraction.toString().padStart(9, "0"),
  };
}

/** `7xKXtg2C…W1gAsU` — encurta o endereço mantendo as pontas reconhecíveis. */
export function truncateAddress(address: string, edge = 4): string {
  if (address.length <= edge * 2 + 1) return address;
  return `${address.slice(0, edge)}…${address.slice(-edge)}`;
}

/** Milissegundos → `MM:SS.d`, ou `H:MM:SS.d` depois de uma hora de run. */
export function formatRunTime(elapsedMs: number): string {
  const totalTenths = Math.max(0, Math.floor(elapsedMs / 100));
  const tenths = totalTenths % 10;
  const totalSeconds = Math.floor(totalTenths / 10);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const base = `${pad(minutes)}:${pad(seconds)}.${tenths}`;
  return hours > 0 ? `${hours}:${base}` : base;
}
