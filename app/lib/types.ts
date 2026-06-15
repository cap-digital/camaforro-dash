// Estrutura de dados do dashboard Camaforró 2026

export type Platform = "Meta" | "Google" | "TikTok" | "Spotify" | "Deezer";

export const PLATFORMS: Platform[] = ["Meta", "Google", "TikTok", "Spotify", "Deezer"];

export interface Row {
  data: string; // ISO date
  campanha: string;
  grupo: string; // adset / ad group
  criativo: string; // ad name
  idade: string;
  genero: string;
  thumbnail: string;
  plataforma: Platform;
  estrategia: string;
  // métricas numéricas (já conciliadas entre as abas)
  investimento: number; // valor faturado (coluna "Investimento")
  spend: number; // investimento de mídia bruto (spend)
  impressoes: number;
  cliques: number;
  engajamento: number;
  alcance: number;
  visualizacoes: number;
  escutas: number; // streamings (Spotify / Deezer)
  // quartis de vídeo (contagens)
  v25: number;
  v50: number;
  v75: number;
  v100: number;
}

export type MetricKey =
  | "investimento"
  | "impressoes"
  | "cliques"
  | "engajamento"
  | "alcance"
  | "visualizacoes"
  | "escutas";

export interface MetricDef {
  key: MetricKey;
  label: string;
  kind: "currency" | "int" | "percent";
}

export const METRICS: MetricDef[] = [
  { key: "investimento", label: "Investimento", kind: "currency" },
  { key: "impressoes", label: "Impressões", kind: "int" },
  { key: "cliques", label: "Cliques", kind: "int" },
  { key: "engajamento", label: "Engajamento", kind: "int" },
  { key: "alcance", label: "Alcance", kind: "int" },
  { key: "visualizacoes", label: "Visualizações", kind: "int" },
  { key: "escutas", label: "Escutas", kind: "int" },
];

// Paleta oficial Camaforró / São João de Camaçari
export const CAMA = {
  roxo: "#722B7C",
  roxoEscuro: "#2E0F35",
  magenta: "#A11D80",
  vermelho: "#E73A37",
  amarelo: "#F2D000",
  amareloOuro: "#FFC20E",
  laranja: "#F0862A",
  laranjaQuente: "#F8A91A",
  verde: "#02813F",
} as const;

// Cor de cada plataforma (tons festivos do São João)
export const PLATFORM_COLORS: Record<Platform, string> = {
  Meta: "#722B7C", // roxo
  Google: "#F0862A", // laranja
  TikTok: "#A11D80", // magenta
  Spotify: "#02813F", // verde
  Deezer: "#E73A37", // vermelho
};

// Paleta para gráficos
export const CAMA_PALETTE = [
  "#722B7C", // roxo
  "#E73A37", // vermelho
  "#F0862A", // laranja
  "#02813F", // verde
  "#A11D80", // magenta
  "#FFC20E", // amarelo ouro
  "#F8A91A", // laranja quente
];
