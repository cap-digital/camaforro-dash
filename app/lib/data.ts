import { MetricKey, Platform, Row } from "./types";
import { toNumber } from "./format";

// ---------- Fonte de dados ----------
const ENDPOINT = "https://cqrpbiepyeypbkizwacu.supabase.co/functions/v1/Camaforro2026";
const KEY = "sb_publishable_YN9YKLw6sludrgf9T2i_1g_Dcm8dIiK";

interface RawRow {
  [k: string]: string | number | null | undefined;
}

interface ApiResponse {
  success?: boolean;
  meta?: RawRow[];
  google?: RawRow[];
  googlePmax?: RawRow[];
  tiktok?: RawRow[];
  spotify?: RawRow[];
  deezer?: RawRow[];
  timestamp?: string;
}

/**
 * Cada aba da base usa nomes de campo diferentes para a MESMA métrica.
 * Os normalizadores abaixo conciliam tudo no formato unificado `Row`:
 *
 *  investimento  -> coluna "Investimento" (valor faturado, casa com o plano)
 *  spend         -> "spend" (mídia bruta)
 *  impressoes    -> "impressions"
 *  cliques       -> "clicks"
 *  engajamento   -> Meta "actions_page_engagement" | Google "engagements"
 *  alcance       -> Meta/TikTok "reach"
 *  visualizacoes -> Meta "video_thruplay_watched_actions_video_view"
 *                   Google "video_trueview_views" | TikTok "play_duration_2s"
 *  escutas       -> Spotify/Deezer "streams"/"listens"/"plays" (quando houver)
 *  v25..v100     -> quartis de vídeo (contagens)
 */

function firstNonEmpty(raw: RawRow, keys: string[]): string {
  for (const k of keys) {
    const v = raw[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
  }
  return "";
}

function baseRow(raw: RawRow, plataforma: Platform): Row {
  return {
    data: String(raw["date"] ?? "").slice(0, 10),
    campanha: String(raw["campaign"] ?? "").trim(),
    grupo: String(raw["adset_name"] ?? raw["ad_group_name"] ?? raw["asset_group_name"] ?? "").trim(),
    criativo: String(raw["ad_name"] ?? "").trim() || "(sem nome)",
    idade: normAge(String(raw["age"] ?? "").trim()),
    genero: normGender(String(raw["gender"] ?? "").trim()),
    thumbnail: String(
      firstNonEmpty(raw, [
        "thumbnail_url", "video_thumbnail_url", "thumbnailurl", "thumbnailURL", "thumbnail",
        "image_url", "ad_image_ad_image_url", "video_url", "youtube_url", "final_url", "ad_final_url", "url", "link",
      ])
    ).trim(),
    plataforma,
    estrategia: String(raw["Estratégia "] ?? raw["Estratégia"] ?? raw["estrategia"] ?? "").trim() || "—",
    investimento: toNumber(raw["Investimento"]),
    spend: toNumber(raw["spend"]),
    impressoes: toNumber(raw["impressions"]),
    cliques: toNumber(raw["clicks"]),
    engajamento: 0,
    alcance: toNumber(raw["reach"]),
    visualizacoes: 0,
    escutas: 0,
    v25: 0,
    v50: 0,
    v75: 0,
    v100: 0,
  };
}

function normMeta(raw: RawRow): Row {
  const r = baseRow(raw, "Meta");
  r.engajamento = toNumber(raw["actions_page_engagement"]);
  r.visualizacoes = toNumber(raw["video_thruplay_watched_actions_video_view"]);
  r.v25 = toNumber(raw["video_p25_watched_actions_video_view"]);
  r.v50 = toNumber(raw["video_p50_watched_actions_video_view"]);
  r.v75 = toNumber(raw["video_p75_watched_actions_video_view"]);
  r.v100 = toNumber(raw["video_p100_watched_actions_video_view"]);
  return r;
}

function normGoogle(raw: RawRow): Row {
  const r = baseRow(raw, "Google");
  r.engajamento = toNumber(raw["engagements"]);
  r.visualizacoes = toNumber(raw["video_trueview_views"]);
  // Google entrega quartis como taxa (0-1) sobre impressões → converte em contagem
  const imp = r.impressoes;
  r.v25 = Math.round(toNumber(raw["video_quartile25_rate"]) * imp);
  r.v50 = Math.round(toNumber(raw["video_quartile50_rate"]) * imp);
  r.v75 = Math.round(toNumber(raw["video_quartile75_rate"]) * imp);
  r.v100 = Math.round(toNumber(raw["video_quartile100_rate"]) * imp);
  return r;
}

// Google Performance Max (aba "googlePmax") — estratégia de Tráfego.
// É campanha do Google, então entra como plataforma "Google": só tem
// spend/impressões/cliques (sem engajamento nem quartis de vídeo) e
// agrupa por "asset_group_name" no lugar do criativo.
function normGooglePmax(raw: RawRow): Row {
  const r = baseRow(raw, "Google");
  if (r.criativo === "(sem nome)" && r.grupo) r.criativo = r.grupo;
  r.searchTerms = String(raw["Search Terms"] ?? raw["search_terms"] ?? "").trim();
  return r;
}

function normTiktok(raw: RawRow): Row {
  const r = baseRow(raw, "TikTok");
  r.visualizacoes = toNumber(raw["play_duration_2s"]);
  r.v25 = toNumber(raw["play_first_quartile"]);
  r.v50 = toNumber(raw["play_midpoint"]);
  r.v75 = toNumber(raw["play_third_quartile"]);
  r.v100 = toNumber(raw["play_over"]);
  return r;
}

// Spotify / Deezer (abas "spotify" / "deezer") — estratégia de Streaming.
// A base traz poucas métricas, com cabeçalhos em MAIÚSCULAS e por dia:
// DATE, IMPRESSIONS, VIEWS, CLICKS, CTR, "ÁUDIOS COMPLETOS" (escutas).
// Não há coluna de investimento, campanha, criativo nem demografia.
function normStreaming(raw: RawRow, plataforma: Platform): Row {
  const r = baseRow(raw, plataforma);
  r.data = String(raw["DATE"] ?? raw["date"] ?? "").slice(0, 10);
  r.campanha = r.campanha || "Streaming";
  r.estrategia = r.estrategia !== "—" ? r.estrategia : "Streaming";
  r.impressoes = toNumber(raw["IMPRESSIONS"] ?? raw["impressions"]);
  r.visualizacoes = toNumber(raw["VIEWS"] ?? raw["views"]);
  r.cliques = toNumber(raw["CLICKS"] ?? raw["clicks"]);
  r.escutas = toNumber(
    raw["ÁUDIOS COMPLETOS"] ?? raw["AUDIOS COMPLETOS"] ?? raw["streams"] ??
    raw["listens"] ?? raw["plays"] ?? raw["escutas"] ?? raw["streamings"]
  );
  return r;
}

function normAge(a: string): string {
  const l = a.toLowerCase();
  if (!l || l === "unknown" || l === "none") return "N/D";
  // TikTok usa "AGE_25_34", "AGE_55_100" → "25-34", "55+"
  const m = a.match(/^age_(\d+)_(\d+)$/i);
  if (m) return parseInt(m[2]) >= 100 ? `${m[1]}+` : `${m[1]}-${m[2]}`;
  return a;
}

function normGender(g: string): string {
  const l = g.toLowerCase();
  if (l === "female" || l === "feminino") return "Feminino";
  if (l === "male" || l === "masculino") return "Masculino";
  if (!l || l === "unknown" || l === "none") return "Não informado";
  return g;
}

export async function fetchData(): Promise<{ rows: Row[]; timestamp: string }> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${KEY}`,
      apikey: KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name: "Functions" }),
  });
  if (!res.ok) throw new Error(`Erro ${res.status} ao carregar dados`);
  const json: ApiResponse = await res.json();

  const rows: Row[] = [
    ...(json.meta ?? []).map(normMeta),
    ...(json.google ?? []).map(normGoogle),
    ...(json.googlePmax ?? []).map(normGooglePmax),
    ...(json.tiktok ?? []).map(normTiktok),
    ...(json.spotify ?? []).map((r) => normStreaming(r, "Spotify")),
    ...(json.deezer ?? []).map((r) => normStreaming(r, "Deezer")),
  ].filter((r) => r.campanha);

  return {
    rows,
    timestamp: typeof json.timestamp === "string" ? json.timestamp : "",
  };
}

export async function fetchRows(): Promise<Row[]> {
  return (await fetchData()).rows;
}

// ---------- Agregações ----------

export interface Totals {
  investimento: number;
  spend: number;
  impressoes: number;
  cliques: number;
  engajamento: number;
  alcance: number;
  visualizacoes: number;
  escutas: number;
  v25: number;
  v50: number;
  v75: number;
  v100: number;
  registros: number;
}

export function sumRows(rows: Row[]): Totals {
  const t: Totals = {
    investimento: 0, spend: 0, impressoes: 0, cliques: 0, engajamento: 0,
    alcance: 0, visualizacoes: 0, escutas: 0, v25: 0, v50: 0, v75: 0, v100: 0,
    registros: rows.length,
  };
  for (const r of rows) {
    t.investimento += r.investimento;
    t.spend += r.spend;
    t.impressoes += r.impressoes;
    t.cliques += r.cliques;
    t.engajamento += r.engajamento;
    t.alcance += r.alcance;
    t.visualizacoes += r.visualizacoes;
    t.escutas += r.escutas;
    t.v25 += r.v25;
    t.v50 += r.v50;
    t.v75 += r.v75;
    t.v100 += r.v100;
  }
  return t;
}

export function metricValue(t: Totals, key: MetricKey): number {
  return t[key];
}

/** Agrupa linhas por uma chave e soma as métricas */
export function groupBy<K extends string>(
  rows: Row[],
  keyFn: (r: Row) => K
): { key: K; rows: Row[]; totals: Totals }[] {
  const map = new Map<K, Row[]>();
  for (const r of rows) {
    const k = keyFn(r);
    const arr = map.get(k);
    if (arr) arr.push(r);
    else map.set(k, [r]);
  }
  return Array.from(map.entries()).map(([key, rs]) => ({
    key,
    rows: rs,
    totals: sumRows(rs),
  }));
}

// ---------- Tempo ----------

/** dd/mm a partir de ISO */
export function shortDate(iso: string): string {
  const [, m, d] = iso.slice(0, 10).split("-");
  return d && m ? `${d}/${m}` : iso;
}

/** Série diária ordenada com totais por dia */
export function dailyTotals(rows: Row[]): { date: string; totals: Totals }[] {
  return groupBy(rows.filter((r) => r.data), (r) => r.data.slice(0, 10))
    .map((g) => ({ date: g.key, totals: g.totals }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Valores diários de uma métrica (para sparklines) */
export function dailyValues(rows: Row[], key: keyof Totals): number[] {
  return dailyTotals(rows).map((d) => d.totals[key] as number);
}

// ---------- Métricas derivadas de custo ----------

export interface Derived {
  cpm: number; // custo por mil impressões
  cpc: number; // custo por clique
  cpv: number; // custo por visualização
  cpe: number; // custo por engajamento
  cps: number; // custo por escuta (streaming)
}

export function derived(t: Totals): Derived {
  return {
    cpm: t.impressoes ? (t.investimento / t.impressoes) * 1000 : 0,
    cpc: t.cliques ? t.investimento / t.cliques : 0,
    cpv: t.visualizacoes ? t.investimento / t.visualizacoes : 0,
    cpe: t.engajamento ? t.investimento / t.engajamento : 0,
    cps: t.escutas ? t.investimento / t.escutas : 0,
  };
}

// ---------- Dia da semana ----------

export const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Índice 0-6 (Dom-Sáb) a partir da parte de data ISO, sem viés de fuso */
export function weekdayIndex(iso: string): number {
  if (!iso) return -1;
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return -1;
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/** Dias da semana presentes nas linhas, em ordem Dom→Sáb */
export function activeWeekdays(rows: Row[]): string[] {
  const set = new Set<string>();
  for (const r of rows) {
    const wd = weekdayIndex(r.data);
    if (wd >= 0) set.add(WEEKDAYS[wd]);
  }
  return WEEKDAYS.filter((w) => set.has(w));
}

/** Matriz categoria × dia-da-semana somando uma métrica — para heatmap */
export function weekdayMatrix(
  rows: Row[],
  rowFn: (r: Row) => string,
  key: keyof Totals
): { get: (rowKey: string, weekday: string) => number } {
  const map = new Map<string, number>();
  for (const r of rows) {
    const wd = weekdayIndex(r.data);
    if (wd < 0) continue;
    const k = `${rowFn(r)}__${WEEKDAYS[wd]}`;
    map.set(k, (map.get(k) ?? 0) + (r[key as keyof Row] as number));
  }
  return { get: (rk, wd) => map.get(`${rk}__${wd}`) ?? 0 };
}

// ---------- Thumbnails ----------

/** Resolve uma URL de imagem exibível a partir do criativo (aceita vários formatos) */
export function resolveThumb(url: string): string | null {
  if (!url) return null;
  const u = url.trim();
  // YouTube — todos os formatos: youtu.be/ID, watch?v=ID, /shorts/ID, /embed/ID, /v/ID, /live/ID
  const yt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|v\/|live\/))([\w-]{6,})/);
  if (yt) return `https://i.ytimg.com/vi/${yt[1]}/hqdefault.jpg`;
  // Google Drive
  const drive = u.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([\w-]+)/);
  if (drive) return `https://drive.google.com/thumbnail?id=${drive[1]}&sz=w600`;
  // Imagem/URL direta
  if (/^https?:\/\//.test(u)) return u;
  return null;
}
