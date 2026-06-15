"use client";

import React, { useMemo, useState } from "react";
import { groupBy, resolveThumb, sumRows, Totals } from "../lib/data";
import { CAMA, PLATFORM_COLORS, Platform, PLATFORMS, Row } from "../lib/types";
import { formatCurrency, formatInt, formatNumber, formatPercent } from "../lib/format";
import { AnalysisBox, ButtonGroup, Card, EmptyState, Insight, KpiCard, SectionTitle, Select } from "../components/ui";
import { Column, DataTable } from "../components/DataTable";

type SortKey = "investimento" | "impressoes" | "visualizacoes" | "engajamento" | "cliques";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "investimento", label: "Investimento" },
  { key: "impressoes", label: "Impressões" },
  { key: "visualizacoes", label: "Visualizações" },
  { key: "engajamento", label: "Engajamento" },
  { key: "cliques", label: "Cliques" },
];

interface CardData {
  id: string;
  criativo: string;
  estrategia: string;
  plataforma: Platform;
  thumbnail: string | null;
  totals: Totals;
}

export function Creatives({ rows }: { rows: Row[] }) {
  const [platform, setPlatform] = useState<Platform | "all">("all");
  const [sortKey, setSortKey] = useState<SortKey>("investimento");

  const scoped = useMemo(
    () => (platform === "all" ? rows : rows.filter((r) => r.plataforma === platform)),
    [rows, platform]
  );

  const cards: CardData[] = useMemo(() => {
    return groupBy(scoped, (r) => `${r.plataforma}||${r.estrategia}||${r.criativo}`)
      .map((g) => {
        const first = g.rows[0];
        const thumb = g.rows.map((r) => r.thumbnail).find((tt) => resolveThumb(tt));
        return {
          id: g.key,
          criativo: first.criativo,
          estrategia: first.estrategia,
          plataforma: first.plataforma,
          thumbnail: thumb ? resolveThumb(thumb) : null,
          totals: g.totals,
        };
      })
      .filter((c) => c.totals.investimento > 0 || c.totals.impressoes > 0)
      .sort((a, b) => b.totals[sortKey] - a.totals[sortKey]);
  }, [scoped, sortKey]);

  // KPIs de criativos
  const tot = useMemo(() => sumRows(scoped), [scoped]);
  const withVideo = cards.filter((c) => c.thumbnail).length;
  const top = cards[0];
  const topShare = top && tot[sortKey] ? (top.totals[sortKey] / tot[sortKey]) * 100 : 0;
  const ctrOf = (t: Totals) => (t.impressoes ? (t.cliques / t.impressoes) * 100 : 0);
  const bestCtr = [...cards].filter((c) => c.totals.impressoes > 300).sort((a, b) => ctrOf(b.totals) - ctrOf(a.totals))[0];
  const byPlatformCount = PLATFORMS.map((p) => ({ p, n: cards.filter((c) => c.plataforma === p).length })).filter((x) => x.n > 0);

  const tableCols: Column<CardData>[] = [
    { key: "criativo", header: "Criativo", sortValue: (r) => r.criativo, render: (r) => (
      <div className="flex items-center gap-2.5">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PLATFORM_COLORS[r.plataforma] }} />
        <div className="max-w-[220px]"><p className="truncate font-semibold">{r.criativo}</p><p className="truncate text-xs text-[var(--muted)]">{r.plataforma} · {r.estrategia}</p></div>
      </div>
    ) },
    { key: "inv", header: "Investimento", align: "right", sortValue: (r) => r.totals.investimento, render: (r) => formatCurrency(r.totals.investimento, true) },
    { key: "imp", header: "Impressões", align: "right", sortValue: (r) => r.totals.impressoes, render: (r) => dash(r.totals.impressoes, formatNumber) },
    { key: "views", header: "Visualizações", align: "right", sortValue: (r) => r.totals.visualizacoes, render: (r) => dash(r.totals.visualizacoes, formatNumber) },
    { key: "clk", header: "Cliques", align: "right", sortValue: (r) => r.totals.cliques, render: (r) => dash(r.totals.cliques, formatInt) },
    { key: "ctr", header: "CTR", align: "right", sortValue: (r) => ctrOf(r.totals), render: (r) => dash(ctrOf(r.totals), (v) => formatPercent(v)) },
    { key: "eng", header: "Engajamento", align: "right", sortValue: (r) => r.totals.engajamento, render: (r) => dash(r.totals.engajamento, formatInt) },
  ];

  return (
    <div>
      <SectionTitle sub="Desempenho por peça criativa" accent={CAMA.magenta}>
        Criativos
      </SectionTitle>

      <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-white p-3 shadow-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-[var(--muted)] sm:inline">Plataforma</span>
          <ButtonGroup<Platform | "all">
            value={platform}
            onChange={setPlatform}
            options={[{ label: "Todas", value: "all", color: CAMA.roxo }, ...PLATFORMS.map((p) => ({ label: p, value: p, color: PLATFORM_COLORS[p] }))]}
          />
        </div>
        <div className="sm:ml-auto">
          <Select label="Ordenar por" value={sortKey} onChange={(v) => setSortKey(v as SortKey)} options={SORT_OPTIONS.map((o) => ({ label: o.label, value: o.key }))} />
        </div>
      </div>

      {cards.length === 0 ? (
        <EmptyState message="Nenhum criativo com dados para esta plataforma ainda." />
      ) : (
        <>
          {/* KPIs de criativos */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Criativos ativos" value={String(cards.length)} accent={CAMA.magenta} hint={`${withVideo} com vídeo/imagem`} />
            <KpiCard label="Investimento" value={formatCurrency(tot.investimento, true)} accent={CAMA.amareloOuro} hint="No recorte atual" />
            <KpiCard label="Impressões" value={formatNumber(tot.impressoes)} accent={CAMA.roxo} hint={`${formatNumber(tot.visualizacoes)} visualizações`} />
            <KpiCard label="CTR médio" value={formatPercent(ctrOf(tot))} accent={CAMA.vermelho} hint={`${formatInt(tot.cliques)} cliques`} />
          </div>

          {/* tabela + análise */}
          <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[7fr_4fr]">
            <Card title="Ranking de criativos" subtitle="Ordenável por qualquer coluna" accent={CAMA.magenta} className="min-w-0">
              <DataTable rows={cards} columns={tableCols} initialSortKey="inv" pageSize={8} />
            </Card>
            <AnalysisBox title="Leitura dos criativos" accent={CAMA.magenta} className="min-w-0">
              {top && <Insight label={`Líder em ${SORT_OPTIONS.find((s) => s.key === sortKey)?.label}`} value={top.criativo.length > 18 ? top.criativo.slice(0, 18) + "…" : top.criativo} color={PLATFORM_COLORS[top.plataforma]} />}
              {top && <Insight label="Concentração do líder" value={formatPercent(topShare)} />}
              {bestCtr && <Insight label="Melhor CTR" value={`${formatPercent(ctrOf(bestCtr.totals))}`} color={CAMA.vermelho} />}
              <Insight label="Peças por plataforma" value={byPlatformCount.map((x) => `${x.p}: ${x.n}`).join(" · ")} />
              <p className="border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">
                {top ? `"${top.criativo}" concentra ${formatPercent(topShare)} do total de ${SORT_OPTIONS.find((s) => s.key === sortKey)?.label?.toLowerCase()} no recorte. ` : ""}
                Ajuste a ordenação para revelar líderes por outra métrica.
              </p>
            </AnalysisBox>
          </div>

          {/* galeria de cards */}
          <h3 className="mb-3 mt-6 text-base font-bold text-[var(--ink)]">Galeria de criativos</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.slice(0, 12).map((c) => (
              <CreativeCard key={c.id} card={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function dash(v: number, f: (n: number) => string) {
  return v ? f(v) : <span className="text-[var(--muted)]">-</span>;
}

function CreativeCard({ card }: { card: CardData }) {
  const color = PLATFORM_COLORS[card.plataforma];
  const [imgError, setImgError] = useState(false);
  const t = card.totals;
  const stats = [
    { label: "Investimento", value: formatCurrency(t.investimento, true) },
    { label: "Impressões", value: t.impressoes ? formatNumber(t.impressoes) : "-" },
    { label: "Visualizações", value: t.visualizacoes ? formatNumber(t.visualizacoes) : "-" },
    { label: card.plataforma === "Meta" ? "Engajamento" : "Cliques", value: (card.plataforma === "Meta" ? t.engajamento : t.cliques) ? formatNumber(card.plataforma === "Meta" ? t.engajamento : t.cliques) : "-" },
  ];
  return (
    <div className="group overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-soft)]">
        {card.thumbnail && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.thumbnail} alt={card.criativo} referrerPolicy="no-referrer" onError={() => setImgError(true)} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center" style={{ background: `${color}14` }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="3" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></svg>
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white shadow" style={{ background: color }}>{card.plataforma}</span>
      </div>
      <div className="p-3.5">
        <p className="truncate text-sm font-bold text-[var(--ink)]" title={card.criativo}>{card.criativo}</p>
        <p className="mb-3 truncate text-xs text-[var(--muted)]">{card.estrategia}</p>
        <div className="grid grid-cols-2 gap-2">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg bg-[var(--bg-soft)] px-2.5 py-1.5">
              <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{s.label}</p>
              <p className="truncate text-sm font-bold tabular-nums text-[var(--ink)]">{s.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
