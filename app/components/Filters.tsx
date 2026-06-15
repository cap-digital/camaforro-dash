"use client";

import React, { useMemo, useState } from "react";
import { Row } from "../lib/types";
import { ButtonGroup, Select } from "./ui";

export interface FilterState {
  from?: string; // yyyy-mm-dd (inclusive)
  to?: string; // yyyy-mm-dd (inclusive)
  estrategia: string; // "all" ou nome
}

export const DEFAULT_FILTERS: FilterState = { estrategia: "all" };

export function applyFilters(rows: Row[], f: FilterState): Row[] {
  return rows.filter((r) => {
    if (f.estrategia !== "all" && r.estrategia !== f.estrategia) return false;
    const day = r.data.slice(0, 10);
    if (f.from && day < f.from) return false;
    if (f.to && day > f.to) return false;
    return true;
  });
}

export function dateBounds(rows: Row[]): { min: string; max: string } | null {
  const days = rows.map((r) => r.data.slice(0, 10)).filter(Boolean).sort();
  if (days.length === 0) return null;
  return { min: days[0], max: days[days.length - 1] };
}

function shiftDate(date: string, k: number): string {
  return new Date(Date.parse(date + "T00:00:00Z") + k * 86400000).toISOString().slice(0, 10);
}
function clamp(d: string, p: { min: string; max: string }): string {
  return d < p.min ? p.min : d > p.max ? p.max : d;
}
function fmtBR(d: string): string {
  const [, m, day] = d.split("-");
  return `${day}/${m}`;
}

export function FilterBar({
  rows,
  filters,
  onChange,
  strategies,
  accent = "#722B7C",
}: {
  rows: Row[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
  strategies?: string[];
  accent?: string;
}) {
  const showStrategy = !!strategies && strategies.length > 1;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <PeriodFilter rows={rows} filters={filters} onChange={onChange} accent={accent} />
      {showStrategy && (
        <div className="rounded-2xl border border-[var(--border)] bg-white px-3 py-2 shadow-sm">
          <Select
            label="Estratégia"
            value={filters.estrategia}
            onChange={(v) => onChange({ ...filters, estrategia: v })}
            options={[{ label: "Todas", value: "all" }, ...strategies!.map((e) => ({ label: e, value: e }))]}
          />
        </div>
      )}
    </div>
  );
}

export function PeriodFilter({
  rows,
  filters,
  onChange,
  accent = "#722B7C",
}: {
  rows: Row[];
  filters: FilterState;
  onChange: (f: FilterState) => void;
  accent?: string;
}) {
  const [open, setOpen] = useState(false);
  const period = useMemo(() => dateBounds(rows), [rows]);

  const activePreset = useMemo(() => {
    if (!period) return "tudo";
    if (!filters.from && !filters.to) return "tudo";
    const max = period.max;
    if (filters.from === filters.to && filters.from === clamp(shiftDate(max, -1), period)) return "ontem";
    if (filters.to === max && filters.from === clamp(shiftDate(max, -6), period)) return "7d";
    if (filters.to === max && filters.from === clamp(shiftDate(max, -14), period)) return "15d";
    return "custom";
  }, [period, filters.from, filters.to]);

  const label = useMemo(() => {
    if (activePreset === "tudo") return "Todo o período";
    if (activePreset === "ontem") return "Ontem";
    if (activePreset === "7d") return "Últimos 7 dias";
    if (activePreset === "15d") return "Últimos 15 dias";
    if (filters.from && filters.to) return `${fmtBR(filters.from)} – ${fmtBR(filters.to)}`;
    return "Escolha o período";
  }, [activePreset, filters.from, filters.to]);

  function setPreset(p: string) {
    if (!period) return;
    const max = period.max;
    if (p === "tudo") onChange({ ...filters, from: undefined, to: undefined });
    else if (p === "ontem") {
      const y = clamp(shiftDate(max, -1), period);
      onChange({ ...filters, from: y, to: y });
    } else if (p === "7d") onChange({ ...filters, from: clamp(shiftDate(max, -6), period), to: max });
    else if (p === "15d") onChange({ ...filters, from: clamp(shiftDate(max, -14), period), to: max });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-2xl border bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:shadow"
        style={{ borderColor: open ? accent : "var(--border)", color: "var(--ink)" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2"><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
        <span className="text-[var(--muted)]">Período:</span>
        <span>{label}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} aria-hidden />
          <div className="absolute left-0 top-full z-30 mt-2 w-[300px] rounded-2xl border border-[var(--border)] bg-white p-4 shadow-xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Atalhos</p>
            <ButtonGroup<string>
              value={activePreset === "custom" ? "" : activePreset}
              onChange={setPreset}
              options={[
                { label: "Tudo", value: "tudo", color: accent },
                { label: "Ontem", value: "ontem", color: accent },
                { label: "7 dias", value: "7d", color: accent },
                { label: "15 dias", value: "15d", color: accent },
              ]}
            />
            {period && (
              <>
                <p className="mb-2 mt-4 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">Personalizado</p>
                <div className="flex flex-col gap-2">
                  <DateInput label="De" value={filters.from ?? period.min} min={period.min} max={filters.to ?? period.max} onChange={(v) => onChange({ ...filters, from: v })} accent={accent} />
                  <DateInput label="Até" value={filters.to ?? period.max} min={filters.from ?? period.min} max={period.max} onChange={(v) => onChange({ ...filters, to: v })} accent={accent} />
                </div>
              </>
            )}
            <div className="mt-4 flex justify-between border-t border-[var(--border)] pt-3">
              <button onClick={() => onChange({ ...filters, from: undefined, to: undefined })} className="text-xs font-semibold text-[var(--muted)] hover:underline">Limpar</button>
              <button onClick={() => setOpen(false)} className="rounded-lg px-3 py-1 text-xs font-bold text-white" style={{ background: accent }}>Aplicar</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DateInput({ label, value, min, max, onChange, accent }: { label: string; value: string; min: string; max: string; onChange: (v: string) => void; accent: string }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs font-semibold text-[var(--muted)]">
      <span>{label}</span>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="rounded-lg border border-[var(--border)] bg-white px-2 py-1.5 text-xs font-semibold text-[var(--ink)] outline-none"
        style={{ accentColor: accent }}
      />
    </label>
  );
}
