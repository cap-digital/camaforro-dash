"use client";

// ============================================================================
//  Google Analytics Data API (GA4) — autenticação e consulta 100% no navegador
// ============================================================================
//
//  ⚠️  AVISO DE SEGURANÇA  ⚠️
//  A chave privada da service account abaixo é embarcada no bundle JavaScript
//  e fica VISÍVEL para qualquer pessoa que abrir esta página (View Source /
//  aba Network). Qualquer um pode extraí-la e usá-la como a service account.
//  • Use este dashboard apenas em ambiente privado (localhost / rede interna).
//  • Trate esta chave como COMPROMETIDA e ROTACIONE-a no GCP.
//  • A forma segura seria manter a chave em um backend/proxy — o usuário optou
//    explicitamente pela abordagem client-side.
//
//  Para funcionar, no Google Cloud / GA4 é preciso (uma vez):
//   1. Ativar a "Google Analytics Data API" no projeto da service account.
//   2. Conceder à service account acesso de Leitor (Viewer) na propriedade GA4
//      541694920 (GA Admin → Gerenciamento de acesso à propriedade).
// ============================================================================

const SERVICE_ACCOUNT = {
  client_email: "camaforro-dashboard@camaforro-dashboard.iam.gserviceaccount.com",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDHukoAyZw7cTc4\ndzNucCvS9+DoohnIF+dDtvPJAJ6uDVbYWnI7vqJXkOR+PquOEz3Jb0p27MzE23kF\nKVLZc/95ICfCRJeMZ4Hr/9JZOsvCxMNaU4pybR5y9+zMEn4n6pt4Ybgddw+AEY02\nUjnn04CXyKuS2ozAHYJqa+Uz4gPhP0t5ynTFkDdKxLF+Q9DxyaFv1Ki6RxmasFXV\nrDsWrYY0aWFHWfR+TUPKZ3qkU0iJaz0MT7NA0gzrplds03P5nwJLFUzKRgcMPhWo\n2U0Jzd6j92ePZJaOqIDnE9M3y0ooiEXvddiADAiGZDdNfRWNCWFmWAoV5ufd7qpn\nMMwzYDd7AgMBAAECggEAKzFpYaQ4Kk7Ar3Bv6flOMPC0bfrocnJg7C77p8N/jYqK\n9n0Q6US/3QoTsA2jkjUtDowH4ZIycnw4PtqB9U71t98xWfz1fULBQSVw+yUQ/c0J\nplYcwcRBaoGdb0CskbtV5gHUDGM8MekZzd6YcT83NxwJptemysFW++bbiY3eYu6o\nKp4sAFO1zToEyqmqk0ef60liIvAdMUUFx7mqtC9DpgJ3jGvXntCHPCeeCona80Xc\nP6GXfHPbxDeK8AK6gN3iWwBpzZVi2HSiBWQP/z/BUWC7nJIl0ILRmUskNFbsg4rp\nq8+93onO6l2TdfW8+Z+YPcfkd7soq3iXYWdKD+rswQKBgQD0yYdNL9F6fd+VkpbK\nGgNvm6ZRgHVLfT9GTPg2QUM6wllW3zkSuK8q2lyU+3YnG3NHMq+iMhsGYH2KliCr\nHtXhDjuea3ggAmWkvcUBbfxZU9WltFFcgRodfjSxprrVV54w0PtmUJ8/VLuoLDH0\n/TpWFVVzyJbrGjjfxGDXi1MdYQKBgQDQ4F/vYinrCqLIfuCJZlHnk1AlZ1UipADk\nPiIQ5u+5uvX8A1CDE438GPmSVZ2T7O70r2qCWEJft4PsOKhMjkQPLV/6vRrzDYom\nSJZf4yI7XNjSLcUG9dQkzY6G9f7LN/1MEfi6EanrWNhfq47z/rhqEMui7ztHzYgK\nuMzlC/SGWwKBgH69STyBoagWPAkpWMFTLqw+nqJcLF7lfjlb6LfOmox1y+Pat6Yl\n0SwS2xSYDdi5sboPWDhWUP/APb/fcxKmaH6Z6+xeIFgSZaYiSzouRBXL/jZJYkbO\n4UKb8ZR5iwqiztjfmwqie5FCwdaU61i5M9cWPKQyG1GmxgO1nZ58GJCBAoGBANBj\nilLhtMByVAWDz7BFDOHk7sjiVuXAicMs2f/S5sh95nwPMnwTPkyM/jEoiZXThHNJ\nrxFrzIyCInPB8uat6OjbdC5MDF8A2xtmv9/aU4S2FPtb/n37NDOjgNbVBebpbSQ/\nqc65YLUUZorMNkrnjkUDjKZ51sLEIz3PMVwymTqRAoGAS6fA7DUnWECtmsHokXZh\nytc42XGie7RFRPRnIaKtd1osEhU9SD70Giwajoc6de0tGgjUIlArzjC8pmlQlX9J\nfZ7I2yLHIG4V8vyPqyxbHsfr9JfizmAHo+zFF30e1pkm7htLoP17MwiO96wWigsg\nLMF3HWL7Xg8Bf2LOXwuioHo=\n-----END PRIVATE KEY-----\n",
};

export const GA4_PROPERTY_ID = "541694920";

const TOKEN_URI = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";

// ---------- utils de codificação ----------
function base64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlFromString(str: string): string {
  return base64urlFromBytes(new TextEncoder().encode(str));
}

function pemToPkcs8(pem: string): ArrayBuffer {
  const b64 = pem
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

// ---------- JWT assinado (RS256) via Web Crypto ----------
async function createSignedJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlFromString(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64urlFromString(
    JSON.stringify({
      iss: SERVICE_ACCOUNT.client_email,
      scope: SCOPE,
      aud: TOKEN_URI,
      iat: now,
      exp: now + 3600,
    })
  );
  const signingInput = `${header}.${claim}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToPkcs8(SERVICE_ACCOUNT.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput)
  );
  return `${signingInput}.${base64urlFromBytes(new Uint8Array(signature))}`;
}

// ---------- troca JWT -> access token (com cache + dedupe) ----------
let cachedToken: { token: string; exp: number } | null = null;
let inFlight: Promise<string> | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    const assertion = await createSignedJwt();
    const res = await fetch(TOKEN_URI, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion,
      }).toString(),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Falha ao autenticar na Google (${res.status}). ${txt}`);
    }
    const json = await res.json();
    cachedToken = {
      token: json.access_token as string,
      exp: Date.now() + (json.expires_in ?? 3600) * 1000,
    };
    return cachedToken.token;
  })().finally(() => {
    inFlight = null;
  });

  return inFlight;
}

// ---------- tipos do runReport ----------
export interface Ga4OrderBy {
  metric?: { metricName: string };
  dimension?: { dimensionName: string };
  desc?: boolean;
}

export interface Ga4ReportRequest {
  dateRanges: { startDate: string; endDate: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  orderBys?: Ga4OrderBy[];
  limit?: number;
  keepEmptyRows?: boolean;
}

export interface Ga4Row {
  dimensionValues?: { value: string }[];
  metricValues?: { value: string }[];
}

export interface Ga4Report {
  dimensionHeaders?: { name: string }[];
  metricHeaders?: { name: string; type: string }[];
  rows?: Ga4Row[];
  totals?: Ga4Row[];
  rowCount?: number;
}

function describeError(status: number, body: string): string {
  if (status === 403 && /SERVICE_DISABLED|has not been used/.test(body))
    return "A Google Analytics Data API está desativada no projeto da service account. Ative-a no Google Cloud Console e tente novamente em alguns minutos.";
  if (status === 403)
    return "Acesso negado. Conceda à service account o papel de Leitor (Viewer) na propriedade GA4 541694920.";
  if (status === 401) return "Token inválido ou expirado.";
  try {
    const j = JSON.parse(body);
    if (j?.error?.message) return j.error.message;
  } catch {
    /* ignore */
  }
  return `Erro ${status} ao consultar o GA4.`;
}

/** Executa um runReport único no GA4 Data API. */
export async function runReport(req: Ga4ReportRequest): Promise<Ga4Report> {
  const token = await getAccessToken();
  const res = await fetch(`${DATA_API}/properties/${GA4_PROPERTY_ID}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(describeError(res.status, await res.text()));
  return res.json();
}

/** Executa vários reports em paralelo, garantindo um único fetch de token. */
export async function runReports(reqs: Ga4ReportRequest[]): Promise<Ga4Report[]> {
  await getAccessToken(); // aquece o cache antes do paralelismo
  return Promise.all(reqs.map(runReport));
}

// ---------- helpers de leitura ----------
/** Converte data GA4 "YYYYMMDD" em ISO "YYYY-MM-DD". */
export function ga4DateToIso(yyyymmdd: string): string {
  if (!/^\d{8}$/.test(yyyymmdd)) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

/** Valor numérico de uma métrica (por índice) de uma linha. */
export function metricNum(row: Ga4Row, i = 0): number {
  const v = row.metricValues?.[i]?.value;
  const n = v ? Number(v) : 0;
  return isFinite(n) ? n : 0;
}

/** Valor de uma dimensão (por índice) de uma linha. */
export function dimVal(row: Ga4Row, i = 0): string {
  return row.dimensionValues?.[i]?.value ?? "";
}
