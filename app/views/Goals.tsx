"use client";

import React, { useMemo, useState } from "react";
import { sumRows } from "../lib/data";
import { GOALS, Goal } from "../lib/goals";
import { CAMA, MetricKey, PLATFORM_COLORS, Platform, PLATFORMS, Row } from "../lib/types";
import { formatCurrency, formatInt } from "../lib/format";
import { ButtonGroup, Card, EmptyState, KpiCard, SectionTitle } from "../components/ui";

function fmtMetric(v: number, key: MetricKey): string {
  if (key === "investimento") return formatCurrency(v);
  return formatInt(v);
}

export function Goals({ rows }: { rows: Row[] }) {
  const [platform, setPlatform] = useState<Platform | "all">("all");

  const visibleGoals = useMemo(
    () => GOALS.filter((g) => platform === "all" || g.plataforma === platform),
    [platform]
  );

  const computed = useMemo(() => {
    return visibleGoals.map((g) => {
      const matched = rows.filter((r) => r.plataforma === g.plataforma && r.estrategia === g.estrategia);
      const t = sumRows(matched);
      const realizedInvest = t.investimento;
      const realizedMetric = t[g.metricKey];
      const cappedInvest = Math.min(realizedInvest, g.investimento);
      const investPct = g.investimento > 0 ? Math.min((realizedInvest / g.investimento) * 100, 100) : 0;
      const metricPct = g.metricGoal > 0 ? (realizedMetric / g.metricGoal) * 100 : 0;
      return { g, realizedInvest, cappedInvest, investPct, realizedMetric, metricPct, hasData: t.registros > 0 };
    });
  }, [visibleGoals, rows]);

  const totals = useMemo(() => {
    const goalInvest = computed.reduce((s, c) => s + c.g.investimento, 0);
    const realInvest = computed.reduce((s, c) => s + c.cappedInvest, 0);
    const anyData = computed.some((c) => c.hasData);
    return { goalInvest, realInvest, pct: goalInvest > 0 ? (realInvest / goalInvest) * 100 : 0, anyData };
  }, [computed]);

  return (
    <div>
      <SectionTitle sub="Acompanhamento das metas contratadas por plataforma e estratégia" accent={CAMA.vermelho}>
        Metas
      </SectionTitle>

      {/* filtro de plataforma */}
      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:gap-4">
        <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">Plataforma</span>
        <ButtonGroup<Platform | "all">
          value={platform}
          onChange={setPlatform}
          options={[
            { label: "Todas", value: "all", color: CAMA.roxo },
            ...PLATFORMS.map((p) => ({ label: p, value: p, color: PLATFORM_COLORS[p] })),
          ]}
        />
      </div>

      {/* resumo */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Investimento contratado" value={formatCurrency(totals.goalInvest)} accent={CAMA.amareloOuro} hint={`${computed.length} meta(s)`} />
        <KpiCard label="Investimento realizado" value={totals.anyData ? formatCurrency(totals.realInvest) : "-"} accent={CAMA.verde} hint="Travado no contratado" />
        <KpiCard label="Execução do orçamento" value={totals.anyData ? formatInt(totals.pct) + "%" : "-"} accent={CAMA.roxo} hint="Base ainda não conectada" />
      </div>

      {/* cards de meta */}
      {computed.length === 0 ? (
        <EmptyState message="Nenhuma meta para os filtros selecionados." />
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {computed.map((c) => (
            <GoalCard key={`${c.g.plataforma}-${c.g.estrategia}`} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function GoalCard({
  c,
}: {
  c: {
    g: Goal;
    realizedInvest: number;
    cappedInvest: number;
    investPct: number;
    realizedMetric: number;
    metricPct: number;
    hasData: boolean;
  };
}) {
  const color = PLATFORM_COLORS[c.g.plataforma];
  return (
    <Card accent={color}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color }}>
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
            {c.g.plataforma}
          </span>
          <h3 className="text-base font-bold text-[var(--ink)]">{c.g.estrategia}</h3>
        </div>
      </div>

      <Progress
        label="Investimento"
        valueText={`${c.hasData ? formatCurrency(c.cappedInvest) : "-"} / ${formatCurrency(c.g.investimento)}`}
        pct={c.investPct}
        displayPct={c.investPct}
        hasData={c.hasData}
        color={color}
      />

      <div className="mt-4">
        <Progress
          label={c.g.metricLabel}
          valueText={`${c.hasData ? fmtMetric(c.realizedMetric, c.g.metricKey) : "-"} / ${fmtMetric(c.g.metricGoal, c.g.metricKey)}`}
          pct={Math.min(c.metricPct, 100)}
          displayPct={c.metricPct}
          hasData={c.hasData}
          color={CAMA.verde}
          allowOver
        />
      </div>
    </Card>
  );
}

function Progress({
  label,
  valueText,
  pct,
  displayPct,
  color,
  hasData,
  allowOver = false,
}: {
  label: string;
  valueText: string;
  pct: number;
  displayPct: number;
  color: string;
  hasData: boolean;
  allowOver?: boolean;
}) {
  const reached = hasData && displayPct >= 100;
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-[var(--ink)]">{label}</span>
        <span className="text-sm font-bold" style={{ color: reached ? CAMA.verde : color }}>
          {hasData ? formatInt(displayPct) + "%" : "-"}
          {reached && allowOver && " ✓"}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-soft)]">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${hasData ? Math.max(pct, 1.5) : 0}%`, background: reached ? CAMA.verde : color }}
        />
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">{valueText}</p>
    </div>
  );
}
