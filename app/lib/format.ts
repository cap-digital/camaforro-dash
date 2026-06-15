// Formatação consistente (K, M, R$) usada em todo o dashboard

export function toNumber(v: unknown): number {
  if (typeof v === "number") return isFinite(v) ? v : 0;
  if (typeof v === "string") {
    const t = v.trim().replace(/\./g, "").replace(",", ".");
    const n = parseFloat(t);
    return isFinite(n) ? n : 0;
  }
  return 0;
}

/** Abrevia números grandes: 1234 -> 1,2K | 1200000 -> 1,2M */
export function formatNumber(v: number, decimals = 1): string {
  if (!isFinite(v) || v === 0) return "0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1_000_000) return sign + stripZero((abs / 1_000_000).toFixed(decimals)) + "M";
  if (abs >= 1_000) return sign + stripZero((abs / 1_000).toFixed(decimals)) + "K";
  return sign + formatInt(abs);
}

/** Número inteiro completo com separador de milhar pt-BR */
export function formatInt(v: number): string {
  return Math.round(v).toLocaleString("pt-BR");
}

/** Moeda em Real */
export function formatCurrency(v: number, compact = false): string {
  if (compact && Math.abs(v) >= 1000) return "R$ " + formatNumber(v);
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Percentual com 2 casas (recebe valor já em %, ex: 4.87) */
export function formatPercent(v: number, decimals = 2): string {
  if (!isFinite(v)) return "0%";
  return stripZero(v.toFixed(decimals)) + "%";
}

/** Valor zero vira hífen para tabelas */
export function dashIfZero(v: number, formatter: (n: number) => string): string {
  if (!v) return "-";
  return formatter(v);
}

function stripZero(s: string): string {
  // remove ,0 / .0 desnecessários e converte ponto decimal para vírgula pt-BR
  return s.replace(/\.?0+$/, "").replace(".", ",");
}

/** Formata número com 2 casas decimais pt-BR (para tooltips) */
export function formatDecimal(v: number, decimals = 2): string {
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
