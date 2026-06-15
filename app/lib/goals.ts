import { MetricKey, Platform } from "./types";

export interface Goal {
  plataforma: Platform;
  estrategia: string;
  investimento: number; // valor contratado (R$)
  metricKey: MetricKey; // métrica de entrega contratada
  metricLabel: string;
  metricGoal: number; // meta da métrica de entrega
}

// Plano de Mídia — Camaforró 2026
export const GOALS: Goal[] = [
  // Meta
  {
    plataforma: "Meta",
    estrategia: "Engajamento",
    investimento: 3500,
    metricKey: "engajamento",
    metricLabel: "Engajamento",
    metricGoal: 3500,
  },
  {
    plataforma: "Meta",
    estrategia: "Alcance",
    investimento: 8000,
    metricKey: "impressoes",
    metricLabel: "Impressões",
    metricGoal: 1000000,
  },
  {
    plataforma: "Meta",
    estrategia: "Visualização",
    investimento: 6500,
    metricKey: "visualizacoes",
    metricLabel: "Visualizações",
    metricGoal: 43333,
  },
  // Google
  {
    plataforma: "Google",
    estrategia: "Tráfego",
    investimento: 5500,
    metricKey: "cliques",
    metricLabel: "Cliques",
    metricGoal: 1571,
  },
  {
    plataforma: "Google",
    estrategia: "Visualização Shorts",
    investimento: 6000,
    metricKey: "visualizacoes",
    metricLabel: "Visualizações",
    metricGoal: 33333,
  },
  {
    plataforma: "Google",
    estrategia: "Visualização CTV",
    investimento: 6000,
    metricKey: "visualizacoes",
    metricLabel: "Visualizações",
    metricGoal: 37500,
  },
  // TikTok
  {
    plataforma: "TikTok",
    estrategia: "Visualização",
    investimento: 7500,
    metricKey: "visualizacoes",
    metricLabel: "Visualizações",
    metricGoal: 26786,
  },
  // Spotify
  {
    plataforma: "Spotify",
    estrategia: "Streaming",
    investimento: 4500,
    metricKey: "escutas",
    metricLabel: "Escutas",
    metricGoal: 25000,
  },
  // Deezer
  {
    plataforma: "Deezer",
    estrategia: "Streaming",
    investimento: 2500,
    metricKey: "escutas",
    metricLabel: "Escutas",
    metricGoal: 12500,
  },
];

export const TOTAL_INVESTMENT_GOAL = GOALS.reduce((s, g) => s + g.investimento, 0);

/** Metas de uma plataforma específica */
export function goalsOf(platform: Platform): Goal[] {
  return GOALS.filter((g) => g.plataforma === platform);
}
