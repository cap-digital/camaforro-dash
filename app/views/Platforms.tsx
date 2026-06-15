"use client";

import React, { useMemo, useState } from "react";
import { sumRows } from "../lib/data";
import { goalsOf } from "../lib/goals";
import { CAMA, PLATFORM_COLORS, Platform, PLATFORMS, Row } from "../lib/types";
import { formatCurrency, formatInt, formatNumber } from "../lib/format";
import { SectionTitle } from "../components/ui";
import { applyFilters, DEFAULT_FILTERS, FilterBar, FilterState } from "../components/Filters";

const ROUTE_OF: Record<Platform, string> = {
  Meta: "meta", Google: "google", TikTok: "tiktok", Spotify: "spotify", Deezer: "deezer",
};

export function Platforms({ rows, navigate }: { rows: Row[]; navigate: (r: string) => void }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const data = useMemo(() => applyFilters(rows, filters), [rows, filters]);

  return (
    <div>
      <SectionTitle sub="Selecione uma plataforma para ver o detalhamento" accent={CAMA.roxo}>
        Plataformas
      </SectionTitle>

      <FilterBar rows={rows} filters={filters} onChange={setFilters} accent={CAMA.roxo} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLATFORMS.map((p) => {
          const color = PLATFORM_COLORS[p];
          const goals = goalsOf(p);
          const contracted = goals.reduce((s, g) => s + g.investimento, 0);
          const t = sumRows(data.filter((r) => r.plataforma === p));
          const hasData = t.registros > 0;
          const primary = goals[0];
          const primaryReal = primary ? t[primary.metricKey] : 0;
          return (
            <button
              key={p}
              onClick={() => navigate(ROUTE_OF[p])}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between px-5 py-4 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}>
                <span className="font-display text-lg font-bold">{p}</span>
                <span className="rounded-full bg-white/25 px-2.5 py-0.5 text-[11px] font-bold">
                  {goals.length} estratégia{goals.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 p-5">
                <Stat label="Investimento" value={formatCurrency(contracted, true)} sub="contratado" />
                <Stat label="Realizado" value={hasData ? formatCurrency(t.investimento, true) : "-"} sub={hasData ? `${formatInt((t.investimento / contracted) * 100)}%` : "aguardando"} />
                {primary && (
                  <Stat
                    label={primary.metricLabel}
                    value={hasData ? formatNumber(primaryReal) : "-"}
                    sub={`meta ${formatNumber(primary.metricGoal)}`}
                  />
                )}
                <div className="flex items-end justify-end">
                  <span className="inline-flex items-center gap-1 text-sm font-bold transition group-hover:gap-2" style={{ color }}>
                    Ver
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="truncate text-lg font-bold tabular-nums text-[var(--ink)]">{value}</p>
      <p className="truncate text-[11px] text-[var(--muted)]">{sub}</p>
    </div>
  );
}
