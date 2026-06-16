"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Ga4Report,
  dimVal,
  ga4DateToIso,
  metricNum,
  runReports,
} from "../lib/ga4";
import { shortDate } from "../lib/data";
import { CAMA, CAMA_PALETTE } from "../lib/types";
import { formatInt, formatNumber, formatPercent } from "../lib/format";
import {
  BarDatum,
  DonutChart,
  HorizontalBars,
  TimeSeries,
} from "../components/charts";
import {
  AnalysisBox,
  Card,
  EmptyState,
  Insight,
  KpiCard,
  SectionTitle,
} from "../components/ui";
import { Column, DataTable } from "../components/DataTable";

const RANGES = [
  { label: "7 dias", value: "6daysAgo" },
  { label: "28 dias", value: "27daysAgo" },
  { label: "90 dias", value: "89daysAgo" },
];

const ACCENT = CAMA.laranja;

interface Parsed {
  totals: {
    sessions: number;
    totalUsers: number;
    newUsers: number;
    pageViews: number;
    engagementRate: number; // 0-1
    avgSessionDuration: number; // segundos
    eventCount: number;
  };
  daily: { name: string; sessions: number; usuarios: number; views: number }[];
  dailySessions: number[];
  channels: BarDatum[];
  devices: BarDatum[];
  pages: BarDatum[];
  events: BarDatum[];
  cities: BarDatum[];
  sourceMedium: { origem: string; sessions: number; users: number }[];
}

function color(i: number) {
  return CAMA_PALETTE[i % CAMA_PALETTE.length];
}

function truncate(s: string, n = 30) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

function fmtDuration(sec: number) {
  if (!sec) return "0s";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m ? `${m}m ${String(s).padStart(2, "0")}s` : `${s}s`;
}

export function GoogleAnalytics() {
  const [rangeIdx, setRangeIdx] = useState(1);
  const [data, setData] = useState<Parsed | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (start: string) => {
    setLoading(true);
    setError(null);
    const dateRanges = [{ startDate: start, endDate: "today" }];
    try {
      const [totals, daily, channels, devices, pages, events, cities, srcMed] =
        await runReports([
          {
            dateRanges,
            metrics: [
              { name: "sessions" },
              { name: "totalUsers" },
              { name: "newUsers" },
              { name: "screenPageViews" },
              { name: "engagementRate" },
              { name: "averageSessionDuration" },
              { name: "eventCount" },
            ],
          },
          {
            dateRanges,
            dimensions: [{ name: "date" }],
            metrics: [{ name: "sessions" }, { name: "totalUsers" }, { name: "screenPageViews" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
          },
          {
            dateRanges,
            dimensions: [{ name: "sessionDefaultChannelGroup" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 8,
          },
          {
            dateRanges,
            dimensions: [{ name: "deviceCategory" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          },
          {
            dateRanges,
            dimensions: [{ name: "pageTitle" }],
            metrics: [{ name: "screenPageViews" }],
            orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
            limit: 8,
          },
          {
            dateRanges,
            dimensions: [{ name: "eventName" }],
            metrics: [{ name: "eventCount" }],
            orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
            limit: 8,
          },
          {
            dateRanges,
            dimensions: [{ name: "city" }],
            metrics: [{ name: "totalUsers" }],
            orderBys: [{ metric: { metricName: "totalUsers" }, desc: true }],
            limit: 8,
          },
          {
            dateRanges,
            dimensions: [{ name: "sessionSourceMedium" }],
            metrics: [{ name: "sessions" }, { name: "totalUsers" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 10,
          },
        ]);

      const tRow = totals.rows?.[0];
      const dailyRows = daily.rows ?? [];

      const parsed: Parsed = {
        totals: {
          sessions: tRow ? metricNum(tRow, 0) : 0,
          totalUsers: tRow ? metricNum(tRow, 1) : 0,
          newUsers: tRow ? metricNum(tRow, 2) : 0,
          pageViews: tRow ? metricNum(tRow, 3) : 0,
          engagementRate: tRow ? metricNum(tRow, 4) : 0,
          avgSessionDuration: tRow ? metricNum(tRow, 5) : 0,
          eventCount: tRow ? metricNum(tRow, 6) : 0,
        },
        daily: dailyRows.map((r) => ({
          name: shortDate(ga4DateToIso(dimVal(r))),
          sessions: metricNum(r, 0),
          usuarios: metricNum(r, 1),
          views: metricNum(r, 2),
        })),
        dailySessions: dailyRows.map((r) => metricNum(r, 0)),
        channels: toBars(channels),
        devices: toBars(devices),
        pages: toBars(pages, 30),
        events: toBars(events, 28),
        cities: toBars(cities, 28),
        sourceMedium: (srcMed.rows ?? []).map((r) => ({
          origem: dimVal(r),
          sessions: metricNum(r, 0),
          users: metricNum(r, 1),
        })),
      };
      setData(parsed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar o Google Analytics.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(RANGES[rangeIdx].value);
  }, [rangeIdx, load]);

  const t = data?.totals;
  const insights = useMemo(() => {
    if (!data) return null;
    const topChannel = data.channels[0];
    const topDevice = data.devices[0];
    const devTotal = data.devices.reduce((s, d) => s + d.value, 0) || 1;
    const newPct = data.totals.sessions ? (data.totals.newUsers / Math.max(1, data.totals.totalUsers)) * 100 : 0;
    return { topChannel, topDevice, devTotal, newPct };
  }, [data]);

  return (
    <div>
      <SectionTitle sub={`Propriedade GA4 · dados em tempo real da Google Analytics Data API`} accent={ACCENT}>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full" style={{ background: ACCENT }} />
          Google Analytics
        </span>
      </SectionTitle>

      {/* seletor de período */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {RANGES.map((r, i) => {
          const active = i === rangeIdx;
          return (
            <button
              key={r.value}
              onClick={() => setRangeIdx(i)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "text-white shadow-sm"
                  : "border border-[var(--border)] bg-white text-[var(--muted)] hover:bg-[var(--bg-soft)]"
              }`}
              style={active ? { background: ACCENT } : undefined}
            >
              {r.label}
            </button>
          );
        })}
        {loading && <span className="ml-2 text-xs text-[var(--muted)]">Carregando…</span>}
      </div>

      {error && <ErrorPanel message={error} onRetry={() => load(RANGES[rangeIdx].value)} />}

      {!error && loading && !data && <LoadingSkeleton />}

      {!error && data && t && (
        <div className="space-y-4">
          {/* KPIs — 4 em cima, 3 centralizados embaixo */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Sessões" value={formatInt(t.sessions)} accent={ACCENT} spark={data.dailySessions} hint={`${formatInt(t.totalUsers)} usuários`} />
            <KpiCard label="Usuários" value={formatInt(t.totalUsers)} accent={CAMA.roxo} hint={`${formatInt(t.newUsers)} novos`} />
            <KpiCard label="Visualizações" value={formatInt(t.pageViews)} accent={CAMA.magenta} hint="Páginas/telas vistas" />
            <KpiCard label="Eventos" value={formatNumber(t.eventCount)} accent={CAMA.verde} hint="Contagem de eventos" />
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {[
              <KpiCard key="eng" label="Taxa de engajamento" value={formatPercent(t.engagementRate * 100)} accent={CAMA.amareloOuro} hint="Sessões engajadas" />,
              <KpiCard key="dur" label="Duração média" value={fmtDuration(t.avgSessionDuration)} accent={CAMA.laranjaQuente} hint="Por sessão" />,
              <KpiCard key="new" label="Novos usuários" value={formatInt(t.newUsers)} accent={CAMA.roxo} hint={insights ? `${formatPercent(insights.newPct)} do total` : undefined} />,
            ].map((card, i) => (
              <div key={i} className="shrink-0 grow-0 basis-[calc((100%-0.75rem)/2)] lg:basis-[calc((100%-2.25rem)/4)]">
                {card}
              </div>
            ))}
          </div>

          {/* evolução diária */}
          <Card title="Evolução diária" subtitle="Sessões, usuários e visualizações por dia" accent={ACCENT} className="min-w-0">
            {data.daily.length ? (
              <TimeSeries
                data={data.daily}
                series={[
                  { key: "sessions", label: "Sessões", color: ACCENT, kind: "int" },
                  { key: "usuarios", label: "Usuários", color: CAMA.roxo, kind: "int" },
                  { key: "views", label: "Visualizações", color: CAMA.magenta, kind: "int" },
                ]}
                height={300}
              />
            ) : (
              <EmptyState message="Sem dados no período." />
            )}
          </Card>

          {/* canais + dispositivos */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Sessões por canal" subtitle="Origem do tráfego (Default Channel Group)" accent={ACCENT} className="min-w-0">
              {data.channels.length ? <DonutChart data={data.channels} kind="int" /> : <EmptyState message="Sem dados de canal." />}
            </Card>
            <Card title="Dispositivos" subtitle="Sessões por categoria de dispositivo" accent={CAMA.roxo} className="min-w-0">
              {data.devices.length ? <DonutChart data={data.devices} kind="int" /> : <EmptyState message="Sem dados de dispositivo." />}
            </Card>
          </div>

          {/* páginas + eventos */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Páginas mais vistas" subtitle="Top por visualizações" accent={CAMA.magenta} className="min-w-0">
              {data.pages.length ? <HorizontalBars data={data.pages} kind="int" color={CAMA.magenta} height={300} /> : <EmptyState message="Sem páginas no período." />}
            </Card>
            <Card title="Principais eventos" subtitle="Top por contagem de eventos" accent={CAMA.verde} className="min-w-0">
              {data.events.length ? <HorizontalBars data={data.events} kind="int" color={CAMA.verde} height={300} /> : <EmptyState message="Sem eventos no período." />}
            </Card>
          </div>

          {/* cidades + análise (65/35) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[65fr_35fr]">
            <Card title="Usuários por cidade" subtitle="Top cidades por usuários" accent={CAMA.roxo} className="min-w-0">
              {data.cities.length ? <HorizontalBars data={data.cities} kind="int" color={CAMA.roxo} height={300} /> : <EmptyState message="Sem dados de cidade." />}
            </Card>
            <AnalysisBox title="Análise — GA4" accent={ACCENT}>
              <p className="text-sm text-[var(--ink)]">
                Visão do site/app no período selecionado. Use os canais e a origem/mídia para
                entender o impacto das campanhas no tráfego.
              </p>
              {insights?.topChannel && (
                <Insight label="Canal líder" value={`${insights.topChannel.name} · ${formatInt(insights.topChannel.value)}`} color={ACCENT} />
              )}
              {insights?.topDevice && (
                <Insight
                  label="Dispositivo dominante"
                  value={`${insights.topDevice.name} · ${formatPercent((insights.topDevice.value / insights.devTotal) * 100)}`}
                  color={CAMA.roxo}
                />
              )}
              <Insight label="Engajamento" value={formatPercent(t.engagementRate * 100)} color={CAMA.amareloOuro} />
              <Insight label="Duração média" value={fmtDuration(t.avgSessionDuration)} color={CAMA.laranjaQuente} />
            </AnalysisBox>
          </div>

          {/* origem / mídia (por último) */}
          <Card title="Origem / Mídia" subtitle="De onde vêm as sessões" accent={ACCENT} className="min-w-0">
            {data.sourceMedium.length ? <SourceMediumTable rows={data.sourceMedium} /> : <EmptyState message="Sem dados de origem." />}
          </Card>
        </div>
      )}
    </div>
  );
}

function toBars(report: Ga4Report, truncN?: number): BarDatum[] {
  return (report.rows ?? [])
    .map((r, i) => ({
      name: truncN ? truncate(dimVal(r) || "(não definido)", truncN) : dimVal(r) || "(não definido)",
      value: metricNum(r, 0),
      color: color(i),
    }))
    .filter((b) => b.value > 0);
}

function SourceMediumTable({ rows }: { rows: { origem: string; sessions: number; users: number }[] }) {
  const cols: Column<(typeof rows)[number]>[] = [
    { key: "origem", header: "Origem / Mídia", sortValue: (r) => r.origem, render: (r) => <span className="font-medium text-[var(--ink)]">{r.origem || "(não definido)"}</span> },
    { key: "sessions", header: "Sessões", align: "right", sortValue: (r) => r.sessions, render: (r) => formatInt(r.sessions) },
    { key: "users", header: "Usuários", align: "right", sortValue: (r) => r.users, render: (r) => formatInt(r.users) },
  ];
  return <DataTable rows={rows} columns={cols} initialSortKey="sessions" pageSize={8} />;
}

function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
      <div className="flex items-start gap-3">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
        </svg>
        <div className="min-w-0">
          <p className="font-bold text-red-800">Não foi possível carregar o Google Analytics</p>
          <p className="mt-1 break-words text-sm text-red-700">{message}</p>
          <div className="mt-3 rounded-xl border border-red-200 bg-white/60 p-3 text-xs text-red-800">
            <p className="font-semibold">Checklist de configuração (Google Cloud / GA4):</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4">
              <li>Ativar a <strong>Google Analytics Data API</strong> no projeto da service account.</li>
              <li>Conceder à service account o papel de <strong>Leitor</strong> na propriedade GA4 <strong>541694920</strong>.</li>
            </ol>
          </div>
          <button onClick={onRetry} className="mt-3 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-red-700">
            Tentar novamente
          </button>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
        <div className="h-72 animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
      </div>
    </div>
  );
}
