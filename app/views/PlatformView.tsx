"use client";

import React, { useMemo, useState } from "react";
import { activeWeekdays, dailyTotals, derived, groupBy, shortDate, sumRows, Totals, weekdayMatrix } from "../lib/data";
import { goalsOf } from "../lib/goals";
import { CAMA, MetricKey, PLATFORM_COLORS, Platform, Row } from "../lib/types";
import { formatCurrency, formatInt, formatNumber, formatPercent } from "../lib/format";
import {
  AreaSeries, BarDatum, DonutChart, FunnelChart, Heatmap, HorizontalBars,
  RadialGauge, ScatterBubble, TimeSeries,
} from "../components/charts";
import { AnalysisBox, BigStat, Card, EmptyState, Insight, SectionTitle, Select, StatCard } from "../components/ui";
import { Column, DataTable } from "../components/DataTable";
import { applyFilters, DEFAULT_FILTERS, FilterBar, FilterState } from "../components/Filters";

const dashNode = () => <span className="text-[var(--muted)]">-</span>;
const fc = (v: number) => (v ? formatCurrency(v) : "-");
const fcc = (v: number) => (v ? formatCurrency(v, true) : "-");
const fp = (v: number) => (isFinite(v) && v ? formatPercent(v) : "-");
const fn = (v: number) => (v ? formatNumber(v) : "-");

function genderColor(g: string) {
  if (g === "Feminino") return CAMA.magenta;
  if (g === "Masculino") return CAMA.roxo;
  return "#8a6d86";
}
function ageOrder(name: string): number {
  if (name.includes("+")) return 999;
  const m = name.match(/\d+/);
  return m ? parseInt(m[0]) : 1000;
}
const byAgeSort = (a: BarDatum, b: BarDatum) => ageOrder(a.name) - ageOrder(b.name);

interface Rates {
  cpm: number; cpc: number; cpv: number; cpe: number;
  vtr: number; ctr: number; engRate: number; freq: number;
}
function rates(t: Totals): Rates {
  const d = derived(t);
  return {
    cpm: d.cpm, cpc: d.cpc, cpv: d.cpv, cpe: d.cpe,
    vtr: t.impressoes ? (t.visualizacoes / t.impressoes) * 100 : 0,
    ctr: t.impressoes ? (t.cliques / t.impressoes) * 100 : 0,
    engRate: t.impressoes ? (t.engajamento / t.impressoes) * 100 : 0,
    freq: t.alcance ? t.impressoes / t.alcance : 0,
  };
}

export function PlatformView({ rows, platform }: { rows: Row[]; platform: Platform }) {
  const color = PLATFORM_COLORS[platform];
  const goals = useMemo(() => goalsOf(platform), [platform]);
  const platformRows = useMemo(() => rows.filter((r) => r.plataforma === platform), [rows, platform]);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const data = useMemo(() => applyFilters(platformRows, filters), [platformRows, filters]);
  const strategies = useMemo(() => Array.from(new Set(platformRows.map((r) => r.estrategia))).sort(), [platformRows]);

  const hasData = data.length > 0;
  const t = useMemo(() => sumRows(data), [data]);

  // metas/estratégias visíveis respeitam o filtro de estratégia
  const visibleGoals = useMemo(
    () => (filters.estrategia === "all" ? goals : goals.filter((g) => g.estrategia === filters.estrategia)),
    [goals, filters.estrategia]
  );
  const goalInvest = visibleGoals.reduce((s, g) => s + g.investimento, 0);

  // metas de entrega, com realizado SEMPRE no escopo das estratégias da meta
  const goalProgress = useMemo(() => {
    const keys = Array.from(new Set(visibleGoals.map((g) => g.metricKey)));
    return keys.map((key) => {
      const gs = visibleGoals.filter((g) => g.metricKey === key);
      const strats = new Set(gs.map((g) => g.estrategia));
      const realized = sumRows(data.filter((r) => strats.has(r.estrategia)))[key];
      return { key, label: gs[0].metricLabel, goal: gs.reduce((s, g) => s + g.metricGoal, 0), realized };
    });
  }, [visibleGoals, data]);

  const header = (
    <SectionTitle sub={`Performance detalhada — ${platform}`} accent={color}>
      <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: color }} />{platform}</span>
    </SectionTitle>
  );

  if (goals.length === 0) return <div>{header}<EmptyState message="Nenhuma estratégia configurada." /></div>;

  const props: ViewProps = { data, t, goals: visibleGoals, goalProgress, goalInvest, color, hasData, estrategiaFilter: filters.estrategia };

  return (
    <div>
      {header}
      <FilterBar rows={platformRows} filters={filters} onChange={setFilters} strategies={strategies} accent={color} />
      {(platform === "Spotify" || platform === "Deezer") && <StreamingPending platform={platform} goals={goals} color={color} totals={t} hasData={hasData} />}
      {platform === "Meta" && <MetaView {...props} />}
      {platform === "Google" && <GoogleView {...props} />}
      {platform === "TikTok" && <TiktokView {...props} />}
    </div>
  );
}

interface GoalProg { key: MetricKey; label: string; goal: number; realized: number }
interface ViewProps {
  data: Row[];
  t: Totals;
  goals: ReturnType<typeof goalsOf>;
  goalProgress: GoalProg[];
  goalInvest: number;
  color: string;
  hasData: boolean;
  estrategiaFilter: string;
}

// ---------- KPIs: métrica como big number + custos/taxas embaixo ----------
function StatKpis({ items }: { items: { label: string; value: string; accent: string; subs: { label: string; value: string }[] }[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((k) => <StatCard key={k.label} label={k.label} value={k.value} accent={k.accent} subs={k.subs} />)}
    </div>
  );
}

// ---------- Gauges de execução (radiais) — realizado escopado ----------
function ExecGauges({ t, goalInvest, goalProgress, color, hasData }: ViewProps) {
  const gauges = [
    { label: "Orçamento", value: goalInvest ? (t.investimento / goalInvest) * 100 : 0, caption: `${fcc(t.investimento)} / ${fcc(goalInvest)}`, c: CAMA.amareloOuro },
    ...goalProgress.map((m) => ({ label: m.label, value: m.goal ? (m.realized / m.goal) * 100 : 0, caption: `${formatNumber(m.realized)} / ${formatNumber(m.goal)}`, c: color })),
  ];
  return (
    <Card title="Execução das metas" subtitle="Realizado sobre o contratado (por estratégia)" accent={color} className="min-w-0">
      {hasData ? (
        <div className={`grid gap-3 ${gauges.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : gauges.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {gauges.map((g) => (
            <div key={g.label} className="min-w-0">
              <RadialGauge value={g.value} label={g.label} color={g.c} height={132} />
              <p className="mt-1 truncate text-center text-xs font-bold text-[var(--ink)]">{g.label}</p>
              <p className="truncate text-center text-[10px] text-[var(--muted)]">{g.caption}</p>
            </div>
          ))}
        </div>
      ) : <EmptyState message="Sem dados no período." />}
    </Card>
  );
}

// ---------- Gráfico com seletor de métrica ----------
const METRIC_OPTS: { key: MetricKey; label: string }[] = [
  { key: "investimento", label: "Investimento" },
  { key: "impressoes", label: "Impressões" },
  { key: "visualizacoes", label: "Visualizações" },
  { key: "engajamento", label: "Engajamento" },
  { key: "cliques", label: "Cliques" },
  { key: "alcance", label: "Alcance" },
];
function MetricChart({
  data, groupFn, title, subtitle, color, chart, metricKeys, height = 280, colorOf, sortFn,
}: {
  data: Row[];
  groupFn: (r: Row) => string;
  title: string;
  subtitle: string;
  color: string;
  chart: "bars" | "hbars" | "donut";
  metricKeys: MetricKey[];
  height?: number;
  colorOf?: (name: string) => string;
  sortFn?: (a: BarDatum, b: BarDatum) => number;
}) {
  const opts = METRIC_OPTS.filter((o) => metricKeys.includes(o.key));
  const [metric, setMetric] = useState<MetricKey>(opts[0]?.key ?? "impressoes");
  const grouped: BarDatum[] = groupBy(data, groupFn)
    .map((g) => ({ name: g.key, value: g.totals[metric], color: colorOf?.(g.key) }))
    .filter((x) => x.value > 0)
    .sort(sortFn ?? ((a, b) => b.value - a.value));
  const kind = metric === "investimento" ? "currency" : "compact";
  return (
    <Card title={title} subtitle={subtitle} accent={color} className="min-w-0" action={<Select value={metric} onChange={(v) => setMetric(v as MetricKey)} options={opts.map((o) => ({ label: o.label, value: o.key }))} />}>
      {grouped.length ? (
        chart === "donut" ? <DonutChart data={grouped} kind={kind} /> :
        chart === "hbars" ? <HorizontalBars data={grouped} kind={kind} color={color} height={height} /> :
        <HorizontalBars data={grouped} kind={kind} color={color} height={height} />
      ) : <EmptyState message="Sem dados para a métrica." />}
    </Card>
  );
}

// ---------- Heatmap por dia da semana (valores reais) ----------
function WeekdayHeatmapCard({
  data, rowFn, title, subtitle, color, metricKeys,
}: {
  data: Row[];
  rowFn: (r: Row) => string;
  title: string;
  subtitle: string;
  color: string;
  metricKeys: MetricKey[];
}) {
  const opts = METRIC_OPTS.filter((o) => metricKeys.includes(o.key));
  const [metric, setMetric] = useState<MetricKey>(opts[0]?.key ?? "impressoes");
  const cols = activeWeekdays(data);
  const rowKeys = Array.from(new Set(data.map(rowFn)));
  const matrix = weekdayMatrix(data, rowFn, metric);
  const fmt = metric === "investimento" ? (v: number) => formatCurrency(v, true) : formatNumber;
  return (
    <Card title={title} subtitle={subtitle} accent={color} className="min-w-0" action={<Select value={metric} onChange={(v) => setMetric(v as MetricKey)} options={opts.map((o) => ({ label: o.label, value: o.key }))} />}>
      {cols.length && rowKeys.length ? (
        <Heatmap rows={rowKeys} cols={cols} getValue={(r, c) => matrix.get(r, c)} color={color} format={fmt} />
      ) : <EmptyState message="Sem dados por dia." />}
    </Card>
  );
}

function StrategyTable({ data, goals, color }: { data: Row[]; goals: ReturnType<typeof goalsOf>; color: string }) {
  const realizedByStrategy = groupBy(data, (r) => r.estrategia);
  const tableRows = goals.map((g) => ({ g, realized: realizedByStrategy.find((x) => x.key === g.estrategia)?.totals ?? null }));
  const cols: Column<(typeof tableRows)[number]>[] = [
    { key: "estr", header: "Estratégia", sortValue: (r) => r.g.estrategia, render: (r) => <span className="font-semibold">{r.g.estrategia}</span> },
    { key: "inv", header: "Investimento", align: "right", sortValue: (r) => r.g.investimento, render: (r) => formatCurrency(r.g.investimento) },
    { key: "real_inv", header: "Realizado", align: "right", sortValue: (r) => r.realized?.investimento ?? -1, render: (r) => (r.realized ? formatCurrency(r.realized.investimento) : dashNode()) },
    { key: "metr", header: "Meta", align: "right", sortValue: (r) => r.g.metricGoal, render: (r) => <span><span className="text-[var(--muted)]">{r.g.metricLabel}: </span><span className="font-semibold">{formatInt(r.g.metricGoal)}</span></span> },
    { key: "real_m", header: "Entregue", align: "right", sortValue: (r) => (r.realized ? r.realized[r.g.metricKey] : -1), render: (r) => { const v = r.realized ? r.realized[r.g.metricKey] : 0; return v ? formatInt(v) : dashNode(); } },
  ];
  return <Card title="Estratégias" subtitle="Contratado e realizado" className="mt-4 min-w-0" accent={color}><DataTable rows={tableRows} columns={cols} initialSortKey="inv" pageSize={8} /></Card>;
}

function DailyCard({ data, color }: { data: Row[]; color: string }) {
  const daily = dailyTotals(data).map((d) => ({ name: shortDate(d.date), impressoes: d.totals.impressoes, visualizacoes: d.totals.visualizacoes, cliques: d.totals.cliques }));
  return (
    <Card title="Evolução diária" subtitle="Entrega por dia" accent={color} className="min-w-0">
      <TimeSeries data={daily} series={[
        { key: "impressoes", label: "Impressões", color: CAMA.roxo, kind: "int" },
        { key: "visualizacoes", label: "Visualizações", color: CAMA.laranja, kind: "int" },
        { key: "cliques", label: "Cliques", color: CAMA.vermelho, kind: "int" },
      ]} height={280} />
    </Card>
  );
}

// ============ META ============
function MetaView(p: ViewProps) {
  const { data, t, color, hasData } = p;
  const r = rates(t);
  const genders = Array.from(new Set(data.map((x) => x.genero).filter((g) => g && g !== "Não informado"))).sort();
  const byGender: BarDatum[] = genders.map((g) => ({ name: g, value: sumRows(data.filter((x) => x.genero === g)).impressoes, color: genderColor(g) })).filter((x) => x.value > 0);
  const topGender = [...byGender].sort((a, b) => b.value - a.value)[0];
  const totGender = byGender.reduce((s, x) => s + x.value, 0) || 1;

  return (
    <>
      <StatKpis items={[
        { label: "Investimento", value: hasData ? fcc(t.investimento) : "-", accent: CAMA.amareloOuro, subs: [{ label: "CPM", value: fc(r.cpm) }, { label: "CPC", value: fc(r.cpc) }] },
        { label: "Impressões", value: hasData ? fn(t.impressoes) : "-", accent: CAMA.roxo, subs: [{ label: "Alcance", value: fn(t.alcance) }, { label: "Freq.", value: r.freq ? r.freq.toFixed(2).replace(".", ",") : "-" }] },
        { label: "Engajamento", value: hasData ? fn(t.engajamento) : "-", accent: CAMA.magenta, subs: [{ label: "Taxa eng.", value: fp(r.engRate) }, { label: "CPE", value: fc(r.cpe) }] },
        { label: "Visualizações", value: hasData ? fn(t.visualizacoes) : "-", accent: CAMA.laranja, subs: [{ label: "VTR", value: fp(r.vtr) }, { label: "CPV", value: fc(r.cpv) }] },
      ]} />

      {!hasData ? <EmptyState message="Sem dados no período." /> : (
        <div className="mt-6 space-y-4">
          <ExecGauges {...p} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[6fr_4fr]">
            <MetricChart data={data} groupFn={(r) => r.idade} title="Público por faixa etária" subtitle="Escolha a métrica" color={color} chart="hbars" metricKeys={["impressoes", "engajamento", "visualizacoes", "cliques"]} height={300} sortFn={byAgeSort} />
            <AnalysisBox title="Análise — Meta" accent={color}>
              <p className="text-sm text-[var(--ink)]">Meta entrega volume com segmentação demográfica. Veja a métrica por idade e por gênero nos gráficos.</p>
              {topGender && <Insight label="Gênero dominante" value={`${topGender.name} · ${formatPercent((topGender.value / totGender) * 100)}`} color={genderColor(topGender.name)} />}
              <Insight label="Frequência" value={r.freq ? r.freq.toFixed(2).replace(".", ",") : "-"} />
              <Insight label="VTR" value={fp(r.vtr)} color={CAMA.laranja} />
              <Insight label="CTR" value={fp(r.ctr)} color={CAMA.vermelho} />
            </AnalysisBox>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <WeekdayHeatmapCard data={data} rowFn={(r) => r.estrategia} title="Estratégia × dia da semana" subtitle="Intensidade da métrica por dia" color={color} metricKeys={["impressoes", "engajamento", "visualizacoes", "investimento"]} />
            <MetricChart data={data} groupFn={(r) => r.genero} title="Distribuição por gênero" subtitle="Escolha a métrica" color={color} chart="donut" metricKeys={["impressoes", "engajamento", "visualizacoes", "cliques"]} colorOf={genderColor} />
          </div>

          <DailyCard data={data} color={color} />
        </div>
      )}
      <StrategyTable data={data} goals={p.goals} color={color} />
    </>
  );
}

// ---------- Termos de busca do Performance Max (Tráfego) ----------
function PmaxSearchTermsCard({ data, color }: { data: Row[]; color: string }) {
  const pmax = data.filter((r) => r.searchTerms);
  if (!pmax.length) return null;

  const groups = groupBy(pmax, (r) => r.grupo || "—")
    .map((g) => {
      const terms = Array.from(
        new Set(g.rows.flatMap((r) => (r.searchTerms ?? "").split(",").map((s) => s.trim()).filter(Boolean)))
      );
      return { grupo: g.key, terms, t: g.totals, d: derived(g.totals) };
    })
    .sort((a, b) => b.t.investimento - a.t.investimento);

  const tot = sumRows(pmax);
  const totD = derived(tot);
  const totCtr = tot.impressoes ? (tot.cliques / tot.impressoes) * 100 : 0;
  const ctrOf = (g: (typeof groups)[number]) => (g.t.impressoes ? (g.t.cliques / g.t.impressoes) * 100 : 0);

  const numCell = "px-3 py-3 text-right tabular-nums font-medium text-[var(--ink)]";
  const head = "px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)]";

  return (
    <Card title="Termos de busca · PMax (Tráfego)" subtitle="Custos e taxas por grupo de ativos" accent={color} className="min-w-0">
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <th className={`${head} text-left`}>Grupo de ativos</th>
              <th className={`${head} text-left`}>Termos de busca</th>
              <th className={`${head} text-right`}>Invest.</th>
              <th className={`${head} text-right`}>Impr.</th>
              <th className={`${head} text-right`}>Cliques</th>
              <th className={`${head} text-right`}>CTR</th>
              <th className={`${head} text-right`}>CPC</th>
              <th className={`${head} text-right`}>CPM</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <tr key={g.grupo} className="border-b border-[var(--border)] align-top last:border-0 hover:bg-gray-50">
                <td className="px-3 py-3 text-left font-semibold text-[var(--ink)]">{g.grupo}</td>
                <td className="px-3 py-3 text-left">
                  <div className="flex max-w-[360px] flex-wrap gap-1">
                    {g.terms.map((term) => (
                      <span key={term} className="rounded-md bg-[var(--bg-soft)] px-2 py-0.5 text-xs text-[var(--ink)]">{term}</span>
                    ))}
                  </div>
                </td>
                <td className={numCell}>{fcc(g.t.investimento)}</td>
                <td className={numCell}>{fn(g.t.impressoes)}</td>
                <td className={numCell}>{fn(g.t.cliques)}</td>
                <td className={numCell}>{fp(ctrOf(g))}</td>
                <td className={numCell}>{fc(g.d.cpc)}</td>
                <td className={numCell}>{fc(g.d.cpm)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--border)] font-bold">
              <td className="px-3 py-3 text-left text-[var(--ink)]">Total</td>
              <td className="px-3 py-3" />
              <td className={numCell}>{fcc(tot.investimento)}</td>
              <td className={numCell}>{fn(tot.impressoes)}</td>
              <td className={numCell}>{fn(tot.cliques)}</td>
              <td className={numCell}>{fp(totCtr)}</td>
              <td className={numCell}>{fc(totD.cpc)}</td>
              <td className={numCell}>{fc(totD.cpm)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}

// ============ GOOGLE ============
function GoogleView(p: ViewProps) {
  const { data, t, color, hasData, estrategiaFilter } = p;
  const r = rates(t);
  // Na estratégia de Tráfego, o foco é Cliques: vira o big number e Engajamentos vai para o sub
  const isTrafego = estrategiaFilter === "Tráfego";
  const engClickKpi = isTrafego
    ? { label: "Cliques", value: hasData ? fn(t.cliques) : "-", accent: CAMA.magenta, subs: [{ label: "Engajamentos", value: fn(t.engajamento) }, { label: "CPC", value: fc(r.cpc) }] }
    : { label: "Engajamentos", value: hasData ? fn(t.engajamento) : "-", accent: CAMA.magenta, subs: [{ label: "Cliques", value: fn(t.cliques) }, { label: "CPC", value: fc(r.cpc) }] };
  const strategiesList = Array.from(new Set(data.map((x) => x.estrategia)));
  const [areaMetric, setAreaMetric] = useState<MetricKey>("visualizacoes");
  const daily = dailyTotals(data);
  const areaData = daily.map((d) => {
    const row: Record<string, number | string> = { name: shortDate(d.date) };
    for (const s of strategiesList) row[s] = sumRows(data.filter((x) => x.estrategia === s && x.data.slice(0, 10) === d.date))[areaMetric];
    return row;
  });
  const areaSeries = strategiesList.map((s, i) => ({ key: s, label: s.replace(/^Visualiza[çc][ãa]o\s*/i, "") || s, color: [CAMA.laranja, CAMA.roxo, CAMA.amareloOuro][i % 3] }));
  const areaMetricLabel = METRIC_OPTS.find((o) => o.key === areaMetric)?.label ?? "";
  const funnel = [{ name: "25%", value: t.v25 }, { name: "50%", value: t.v50 }, { name: "75%", value: t.v75 }, { name: "100%", value: t.v100 }].filter(() => t.v25 + t.v50 + t.v75 + t.v100 > 0);

  return (
    <>
      <StatKpis items={[
        { label: "Investimento", value: hasData ? fcc(t.investimento) : "-", accent: CAMA.amareloOuro, subs: [] },
        { label: "Visualizações", value: hasData ? fn(t.visualizacoes) : "-", accent: CAMA.laranja, subs: [{ label: "VTR", value: fp(r.vtr) }, { label: "CPV", value: fc(r.cpv) }] },
        { label: "Impressões", value: hasData ? fn(t.impressoes) : "-", accent: CAMA.roxo, subs: [{ label: "CPM", value: fc(r.cpm) }, { label: "CTR", value: fp(r.ctr) }] },
        engClickKpi,
      ]} />

      {!hasData ? <EmptyState message="Sem dados no período." /> : (
        <div className="mt-6 space-y-4">
          <ExecGauges {...p} />

          <Card
            title={`CTV × Shorts ao longo do tempo · ${areaMetricLabel}`}
            subtitle="Área empilhada por formato — escolha a métrica"
            className="min-w-0"
            accent={color}
            action={<Select value={areaMetric} onChange={(v) => setAreaMetric(v as MetricKey)} options={METRIC_OPTS.filter((o) => ["investimento", "impressoes", "visualizacoes", "engajamento", "cliques"].includes(o.key)).map((o) => ({ label: o.label, value: o.key }))} />}
          >
            <AreaSeries data={areaData} series={areaSeries} kind={areaMetric === "investimento" ? "currency" : "compact"} height={300} />
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[5fr_5fr]">
            {funnel.length > 0 && (
              <Card title="Funil de visualização" subtitle="Retenção por quartil (estimado)" accent={color} className="min-w-0">
                <FunnelChart data={funnel} format={formatNumber} />
              </Card>
            )}
            <AnalysisBox title="Análise — Google" accent={color}>
              <p className="text-sm text-[var(--ink)]">CTV (TV conectada) entrega visualização premium; Shorts entrega volume. A área temporal mostra como cada formato evolui dia a dia.</p>
              <Insight label="VTR" value={fp(r.vtr)} color={CAMA.verde} />
              <Insight label="CPV / CPM" value={`${fc(r.cpv)} · ${fc(r.cpm)}`} />
              {t.v100 > 0 && <Insight label="Assistiram 100%" value={formatNumber(t.v100)} color={CAMA.verde} />}
              <Insight label="Engajamentos" value={fn(t.engajamento)} color={CAMA.magenta} />
            </AnalysisBox>
          </div>

          <PmaxSearchTermsCard data={data} color={color} />

          <WeekdayHeatmapCard data={data} rowFn={(r) => r.estrategia} title="Formato × dia da semana" subtitle="Intensidade da métrica por dia" color={color} metricKeys={["visualizacoes", "impressoes", "engajamento", "investimento"]} />
        </div>
      )}
      <StrategyTable data={data} goals={p.goals} color={color} />
    </>
  );
}

// ============ TIKTOK ============
function TiktokView(p: ViewProps) {
  const { data, t, color, hasData, goalInvest, goalProgress } = p;
  const r = rates(t);
  const funnel = [{ name: "2s", value: t.visualizacoes }, { name: "25%", value: t.v25 }, { name: "50%", value: t.v50 }, { name: "75%", value: t.v75 }, { name: "100%", value: t.v100 }].filter(() => t.v25 + t.v50 + t.v75 + t.v100 > 0);
  const bubbles = groupBy(data, (x) => x.criativo).map((g) => {
    const tt = g.totals;
    return { name: g.key, x: tt.investimento, y: tt.impressoes ? (tt.visualizacoes / tt.impressoes) * 100 : 0, z: tt.visualizacoes };
  }).filter((b) => b.z > 0);
  const ret100 = t.v25 ? (t.v100 / t.v25) * 100 : 0;
  const viewsGoal = goalProgress[0]?.goal ?? 0;

  return (
    <>
      <StatKpis items={[
        { label: "Investimento", value: hasData ? fcc(t.investimento) : "-", accent: CAMA.amareloOuro, subs: [{ label: "CPV", value: fc(r.cpv) }, { label: "CPM", value: fc(r.cpm) }] },
        { label: "Visualizações (2s)", value: hasData ? fn(t.visualizacoes) : "-", accent: CAMA.laranja, subs: [{ label: "VTR", value: fp(r.vtr) }, { label: "CPV", value: fc(r.cpv) }] },
        { label: "Alcance", value: hasData ? fn(t.alcance) : "-", accent: CAMA.roxo, subs: [{ label: "Freq.", value: r.freq ? r.freq.toFixed(2).replace(".", ",") : "-" }, { label: "Impr.", value: fn(t.impressoes) }] },
        { label: "Cliques", value: hasData ? fn(t.cliques) : "-", accent: CAMA.vermelho, subs: [{ label: "CTR", value: fp(r.ctr) }, { label: "CPC", value: fc(r.cpc) }] },
      ]} />

      {!hasData ? <EmptyState message="Sem dados no período." /> : (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[4fr_6fr]">
            <Card title="Execução das metas" subtitle="Realizado sobre o contratado" accent={color} className="min-w-0">
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0"><RadialGauge value={goalInvest ? (t.investimento / goalInvest) * 100 : 0} label="Orçamento" color={CAMA.amareloOuro} height={140} /><p className="mt-1 text-center text-xs font-bold">Orçamento</p><p className="truncate text-center text-[10px] text-[var(--muted)]">{fcc(t.investimento)} / {fcc(goalInvest)}</p></div>
                <div className="min-w-0"><RadialGauge value={viewsGoal ? (t.visualizacoes / viewsGoal) * 100 : 0} label="Views" color={color} height={140} /><p className="mt-1 text-center text-xs font-bold">Visualizações</p><p className="truncate text-center text-[10px] text-[var(--muted)]">{fn(t.visualizacoes)} / {formatNumber(viewsGoal)}</p></div>
              </div>
            </Card>
            <Card title="Criativos: investimento × eficiência" subtitle="Bolha = volume de visualizações" accent={color} className="min-w-0">
              {bubbles.length ? <ScatterBubble data={bubbles} color={color} xLabel="Investimento" yLabel="VTR" xKind="currency" yKind="percent" height={300} /> : <EmptyState message="Sem criativos com views." />}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[5fr_5fr]">
            {funnel.length > 0 && (
              <Card title="Funil de retenção" subtitle="De 2s até 100% assistido" accent={color} className="min-w-0">
                <FunnelChart data={funnel} format={formatNumber} />
              </Card>
            )}
            <AnalysisBox title="Análise — TikTok" accent={color}>
              <p className="text-sm text-[var(--ink)]">Campanha única de VideoView. O gráfico de bolhas cruza investimento e eficiência (VTR) por criativo — bolhas maiores entregaram mais views.</p>
              <Insight label="Retenção até 100% (de 25%)" value={fp(ret100)} color={CAMA.verde} />
              <Insight label="VTR" value={fp(r.vtr)} color={CAMA.laranja} />
              <Insight label="CPV / CPM" value={`${fc(r.cpv)} · ${fc(r.cpm)}`} />
              <Insight label="Alcance" value={fn(t.alcance)} />
            </AnalysisBox>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MetricChart data={data} groupFn={(r) => r.idade} title="Público por faixa etária" subtitle="Escolha a métrica" color={color} chart="hbars" metricKeys={["visualizacoes", "impressoes", "cliques", "investimento"]} height={280} sortFn={byAgeSort} />
            <MetricChart data={data} groupFn={(r) => r.genero} title="Distribuição por gênero" subtitle="Escolha a métrica" color={color} chart="donut" metricKeys={["visualizacoes", "impressoes", "cliques", "investimento"]} colorOf={genderColor} />
          </div>

          <MetricChart data={data} groupFn={(r) => r.criativo} title="Top criativos" subtitle="Escolha a métrica" color={color} chart="hbars" metricKeys={["visualizacoes", "impressoes", "investimento", "cliques"]} height={320} />
          <DailyCard data={data} color={color} />
        </div>
      )}
    </>
  );
}

// ============ STREAMING (Spotify / Deezer) ============
function StreamingPending({
  platform, goals, color, totals, hasData,
}: {
  platform: Platform;
  goals: ReturnType<typeof goalsOf>;
  color: string;
  totals: Totals;
  hasData: boolean;
}) {
  const g = goals[0];
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <BigStat label="Investimento contratado" value={formatCurrency(g.investimento, true)} accent={CAMA.amareloOuro} sub={`Estratégia ${g.estrategia}`} />
        <BigStat label="Meta de escutas" value={formatNumber(g.metricGoal)} accent={CAMA.verde} sub="Streaming contratado" />
        <BigStat label="Escutas realizadas" value={hasData ? formatNumber(totals.escutas) : "-"} accent={color} sub={hasData ? `${formatInt((totals.escutas / g.metricGoal) * 100)}%` : "Aguardando dados"} />
      </div>
      <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-10 text-center">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6"><path d="M4 14a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="7" rx="1.5" /><rect x="17" y="13" width="4" height="7" rx="1.5" /></svg>
        <p className="text-lg font-bold text-[var(--ink)]">Dados de streaming ainda não disponíveis</p>
        <p className="max-w-md text-sm text-[var(--muted)]">A campanha de <strong>{g.estrategia}</strong> no <strong>{platform}</strong> está contratada por {formatCurrency(g.investimento)} com meta de {formatNumber(g.metricGoal)} escutas. Os dados aparecerão aqui quando a base de {platform} for alimentada.</p>
      </div>
    </>
  );
}
