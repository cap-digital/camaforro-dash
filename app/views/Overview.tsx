"use client";

import React, { useMemo, useState } from "react";
import { groupBy, sumRows } from "../lib/data";
import { GOALS, TOTAL_INVESTMENT_GOAL } from "../lib/goals";
import { CAMA, MetricKey, PLATFORM_COLORS, Row, PLATFORMS } from "../lib/types";
import { formatCurrency, formatInt, formatNumber, formatPercent } from "../lib/format";
import { DonutChart, HorizontalBars } from "../components/charts";
import { AnalysisBox, BigStat, Card, Insight, MetricIcon, SectionTitle } from "../components/ui";
import { Column, DataTable } from "../components/DataTable";
import { applyFilters, DEFAULT_FILTERS, FilterBar, FilterState } from "../components/Filters";

const METRIC_COLOR: Record<MetricKey, string> = {
  investimento: CAMA.amareloOuro,
  engajamento: CAMA.magenta,
  impressoes: CAMA.roxo,
  alcance: CAMA.amareloOuro,
  visualizacoes: CAMA.laranja,
  cliques: CAMA.vermelho,
  escutas: CAMA.verde,
};

const DELIVERY_ORDER: MetricKey[] = ["engajamento", "impressoes", "visualizacoes", "cliques", "escutas"];

export function Overview({ rows }: { rows: Row[] }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const data = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  const realizedTotals = useMemo(() => sumRows(data), [data]);
  const realizedInvest = realizedTotals.investimento;
  const hasData = realizedTotals.registros > 0;

  // ---- Metas de entrega: cada métrica vinculada às SUAS estratégias/plataformas ----
  const deliveries = useMemo(() => {
    return DELIVERY_ORDER.map((key) => {
      const gs = GOALS.filter((g) => g.metricKey === key);
      if (!gs.length) return null;
      const goal = gs.reduce((s, g) => s + g.metricGoal, 0);
      const scopeKeys = new Set(gs.map((g) => `${g.plataforma}|${g.estrategia}`));
      const realized = data
        .filter((r) => scopeKeys.has(`${r.plataforma}|${r.estrategia}`))
        .reduce((s, r) => s + r[key], 0);
      const platforms = Array.from(new Set(gs.map((g) => g.plataforma)));
      const scope = gs.length === 1 ? `${gs[0].plataforma} · ${gs[0].estrategia}` : platforms.join(" · ");
      return { key, label: gs[0].metricLabel, goal, realized, scope };
    }).filter((x): x is NonNullable<typeof x> => x !== null);
  }, [data]);

  // investimento contratado por plataforma / estratégia (plano)
  const investByPlatform = PLATFORMS.map((p) => ({
    name: p,
    value: GOALS.filter((g) => g.plataforma === p).reduce((s, g) => s + g.investimento, 0),
    color: PLATFORM_COLORS[p],
  })).filter((d) => d.value > 0);

  const investByStrategy = GOALS.map((g) => ({
    name: `${g.plataforma} · ${g.estrategia}`,
    value: g.investimento,
    color: PLATFORM_COLORS[g.plataforma],
  })).sort((a, b) => b.value - a.value);

  // realizado por estratégia (para a tabela)
  const realizedByStrategy = useMemo(() => groupBy(data, (r) => `${r.plataforma}|${r.estrategia}`), [data]);
  const tableRows = GOALS.map((g) => {
    const realized = realizedByStrategy.find((x) => x.key === `${g.plataforma}|${g.estrategia}`);
    return { g, realized: realized?.totals ?? null };
  });

  const cols: Column<(typeof tableRows)[number]>[] = [
    { key: "plat", header: "Plataforma", sortValue: (r) => r.g.plataforma, render: (r) => (
      <span className="inline-flex items-center gap-2 font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: PLATFORM_COLORS[r.g.plataforma] }} />{r.g.plataforma}</span>
    ) },
    { key: "estr", header: "Estratégia", sortValue: (r) => r.g.estrategia, render: (r) => r.g.estrategia },
    { key: "inv", header: "Investimento", align: "right", sortValue: (r) => r.g.investimento, render: (r) => formatCurrency(r.g.investimento) },
    { key: "metr", header: "Métrica-meta", align: "right", sortValue: (r) => r.g.metricGoal, render: (r) => <span><span className="text-[var(--muted)]">{r.g.metricLabel}: </span><span className="font-semibold">{formatInt(r.g.metricGoal)}</span></span> },
    { key: "real", header: "Realizado", align: "right", sortValue: (r) => (r.realized ? r.realized[r.g.metricKey] : -1), render: (r) => { const v = r.realized ? r.realized[r.g.metricKey] : 0; return v ? formatInt(v) : <span className="text-[var(--muted)]">-</span>; } },
  ];

  // leitura rápida
  const insights = useMemo(() => {
    const withPace = deliveries.filter((d) => d.realized > 0).map((d) => ({ ...d, pace: d.goal ? (d.realized / d.goal) * 100 : 0 }));
    const best = [...withPace].sort((a, b) => b.pace - a.pace)[0];
    const worst = [...withPace].sort((a, b) => a.pace - b.pace)[0];
    const byPlat = PLATFORMS.map((p) => ({ p, t: sumRows(data.filter((r) => r.plataforma === p)) })).filter((x) => x.t.investimento > 0);
    const topSpend = [...byPlat].sort((a, b) => b.t.investimento - a.t.investimento)[0];
    return { best, worst, topSpend, activePlatforms: byPlat.length };
  }, [deliveries, data]);

  return (
    <div>
      <SectionTitle sub="Plano de mídia consolidado — Camaforró 2026" accent={CAMA.roxo}>
        Visão Geral
      </SectionTitle>

      <FilterBar rows={rows} filters={filters} onChange={setFilters} accent={CAMA.roxo} />

      {/* resumo do plano */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <BigStat label="Investimento contratado" value={formatCurrency(TOTAL_INVESTMENT_GOAL)} accent={CAMA.amareloOuro} sub="Total do plano de mídia" />
        <BigStat label="Investimento realizado" value={hasData ? formatCurrency(realizedInvest) : "-"} accent={CAMA.verde} sub={hasData ? `${formatInt((realizedInvest / TOTAL_INVESTMENT_GOAL) * 100)}% do contratado` : "Aguardando dados"} />
        <BigStat label="Plataformas" value={String(PLATFORMS.length)} accent={CAMA.roxo} sub="Meta · Google · TikTok · Spotify · Deezer" />
        <BigStat label="Estratégias" value={String(GOALS.length)} accent={CAMA.magenta} sub="Linhas do plano de mídia" />
      </div>

      {/* metas de entrega — com escopo explícito */}
      <h3 className="mb-3 mt-7 text-base font-bold text-[var(--ink)]">Metas de entrega contratadas</h3>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {deliveries.map((d) => (
          <DeliveryCard key={d.key} d={d} color={METRIC_COLOR[d.key]} hasData={hasData} />
        ))}
      </div>

      {/* distribuição de investimento + leitura rápida */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-[6fr_4fr]">
        <Card title="Investimento por plataforma" subtitle="Distribuição do valor contratado" accent={CAMA.roxo} className="min-w-0">
          <DonutChart data={investByPlatform} kind="currency" />
        </Card>
        <AnalysisBox title="Leitura rápida" accent={CAMA.verde} className="min-w-0">
          {hasData ? (
            <>
              <Insight label="Execução do orçamento" value={`${formatPercent((realizedInvest / TOTAL_INVESTMENT_GOAL) * 100)}`} color={CAMA.verde} />
              {insights.best && <Insight label="Entrega mais adiantada" value={`${insights.best.label} · ${formatPercent(insights.best.pace)}`} color={METRIC_COLOR[insights.best.key]} />}
              {insights.worst && insights.worst.key !== insights.best?.key && <Insight label="Entrega mais atrasada" value={`${insights.worst.label} · ${formatPercent(insights.worst.pace)}`} color={CAMA.vermelho} />}
              {insights.topSpend && <Insight label="Maior investimento realizado" value={`${insights.topSpend.p} · ${formatCurrency(insights.topSpend.t.investimento, true)}`} color={PLATFORM_COLORS[insights.topSpend.p]} />}
              <p className="border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">
                {insights.activePlatforms} de {PLATFORMS.length} plataformas com entrega no período. Spotify e Deezer ainda sem dados de escutas.
              </p>
            </>
          ) : (
            <p className="text-sm text-[var(--muted)]">Sem dados de entrega no período selecionado.</p>
          )}
        </AnalysisBox>
      </div>

      <Card title="Investimento por estratégia" subtitle="Valor contratado por linha do plano" className="mt-4" accent={CAMA.laranja}>
        <HorizontalBars data={investByStrategy} kind="currency" height={360} />
      </Card>

      <Card title="Plano de mídia" subtitle="Metas contratadas por plataforma e estratégia" className="mt-4" accent={CAMA.vermelho}>
        <DataTable rows={tableRows} columns={cols} initialSortKey="inv" pageSize={10} />
      </Card>
    </div>
  );
}

function DeliveryCard({
  d,
  color,
  hasData,
}: {
  d: { key: MetricKey; label: string; goal: number; realized: number; scope: string };
  color: string;
  hasData: boolean;
}) {
  const pace = d.goal ? (d.realized / d.goal) * 100 : 0;
  const reached = hasData && pace >= 100;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <span className="absolute left-0 top-0 h-full w-1" style={{ background: color }} aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{d.label}</p>
        <MetricIcon label={d.label} accent={color} />
      </div>
      <p className="mt-1.5 text-2xl font-extrabold leading-tight tabular-nums text-[var(--ink)]">{formatNumber(d.goal)}</p>
      <p className="mt-0.5 truncate text-[11px] font-medium" style={{ color }} title={d.scope}>{d.scope}</p>
      <div className="mt-2.5 border-t border-[var(--border)] pt-2 text-xs">
        <span className="text-[var(--muted)]">Realizado: </span>
        <span className="font-bold text-[var(--ink)]">{hasData ? formatNumber(d.realized) : "-"}</span>
        {hasData && (
          <span className="ml-1 font-bold" style={{ color: reached ? CAMA.verde : color }}>
            ({formatInt(pace)}%{reached ? " ✓" : ""})
          </span>
        )}
      </div>
    </div>
  );
}
