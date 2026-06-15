"use client";

import React from "react";
import { MetricDef } from "../lib/types";
import { formatCurrency, formatInt, formatNumber, formatPercent } from "../lib/format";
import { Sparkline } from "./charts";

export function formatMetric(value: number, kind: MetricDef["kind"], compact = false): string {
  if (kind === "currency") return formatCurrency(value, compact);
  if (kind === "percent") return formatPercent(value);
  return compact ? formatNumber(value) : formatInt(value);
}

export function Card({
  children,
  className = "",
  title,
  subtitle,
  action,
  accent,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className={`rounded-2xl border border-[var(--border)] bg-white shadow-sm transition-shadow hover:shadow-md ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
          <div className="flex items-start gap-2.5">
            {accent && <span className="mt-1 h-3.5 w-1.5 shrink-0 rounded-full" style={{ background: accent }} aria-hidden />}
            <div>
              {title && <h3 className="text-sm font-semibold text-[var(--ink)]">{title}</h3>}
              {subtitle && <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  accent = "#722B7C",
  icon,
  dense = false,
  spark,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: string;
  icon?: React.ReactNode;
  dense?: boolean;
  spark?: number[];
}) {
  const showSpark = spark && spark.length > 1;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <span
        className="absolute left-0 top-0 h-full w-1"
        style={{ background: accent }}
        aria-hidden
      />
      <div className="flex items-center justify-between">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
        {icon ?? <MetricIcon label={label} accent={accent} />}
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <p
          className={`font-bold leading-tight tabular-nums text-[var(--ink)] ${
            dense ? "text-lg sm:text-xl" : "text-2xl sm:text-[1.7rem]"
          }`}
        >
          {value}
        </p>
        {showSpark && (
          <div className="shrink-0 pb-0.5">
            <Sparkline values={spark!} color={accent} width={dense ? 60 : 84} height={26} />
          </div>
        )}
      </div>
      {hint && <p className="mt-1 truncate text-xs text-[var(--muted)]">{hint}</p>}
    </div>
  );
}

/** Card de KPI agrupado: número principal + custos/taxas relacionados dentro */
export function StatCard({
  label,
  value,
  accent = "#722B7C",
  spark,
  subs = [],
}: {
  label: string;
  value: string;
  accent?: string;
  spark?: number[];
  subs?: { label: string; value: string }[];
}) {
  const showSpark = spark && spark.length > 1;
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <span className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} aria-hidden />
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
        <MetricIcon label={label} accent={accent} />
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <p className="text-2xl font-bold leading-tight tabular-nums text-[var(--ink)] sm:text-[1.6rem]">{value}</p>
        {showSpark && (
          <div className="shrink-0 pb-0.5">
            <Sparkline values={spark!} color={accent} width={70} height={26} />
          </div>
        )}
      </div>
      {subs.length > 0 && (
        <div className="mt-3 flex gap-4 border-t border-[var(--border)] pt-2.5">
          {subs.map((s) => (
            <div key={s.label} className="min-w-0">
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-[var(--muted)]">{s.label}</p>
              <p className="truncate text-sm font-bold tabular-nums text-[var(--ink)]">{s.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Badge({
  children,
  color = "#5B6770",
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{ background: `${color}1a`, color }}
    >
      {children}
    </span>
  );
}

export function ButtonGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T; color?: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              active
                ? "text-white shadow-sm"
                : "bg-white text-[var(--muted)] hover:bg-[var(--bg-soft)] border border-[var(--border)]"
            }`}
            style={active ? { background: o.color ?? "#722B7C" } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Select<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-xs text-[var(--muted)]">
      {label && <span className="whitespace-nowrap">{label}</span>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--ink)] outline-none focus:border-[#722B7C]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SectionTitle({ children, sub, accent = "#722B7C" }: { children: React.ReactNode; sub?: string; accent?: string }) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <span className="mt-1 h-8 w-1.5 shrink-0 rounded-full" style={{ background: accent }} aria-hidden />
      <div>
        <h2 className="text-xl font-bold leading-tight text-[var(--ink)] sm:text-2xl">{children}</h2>
        {sub && <p className="mt-0.5 text-sm text-[var(--muted)]">{sub}</p>}
      </div>
    </div>
  );
}

/** Caixa de análise descritiva (insights de texto) */
export function AnalysisBox({
  title,
  accent = "#722B7C",
  children,
  className = "",
}: {
  title: string;
  accent?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm sm:p-5 ${className}`}
      style={{ borderLeft: `4px solid ${accent}` }}
    >
      <div className="mb-3 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2.2">
          <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2Z" />
        </svg>
        <h3 className="text-sm font-bold text-[var(--ink)]">{title}</h3>
      </div>
      <div className="space-y-2.5 text-sm text-[var(--ink)]">{children}</div>
    </div>
  );
}

/** Linha de insight: rótulo + valor destacado */
export function Insight({
  label,
  value,
  color = "#1a1d21",
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[var(--muted)]">{label}</span>
      <span className="text-right font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

/** Número grande de destaque (cabeçalho de páginas) */
export function BigStat({
  label,
  value,
  sub,
  accent = "#722B7C",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
      <span className="absolute left-0 top-0 h-full w-1" style={{ background: accent }} aria-hidden />
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-medium uppercase tracking-wide text-[var(--muted)]">{label}</p>
        <MetricIcon label={label} accent={accent} />
      </div>
      <p className="mt-1.5 text-2xl font-extrabold leading-tight tabular-nums text-[var(--ink)] sm:text-3xl">
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs leading-snug text-[var(--muted)]">{sub}</p>}
    </div>
  );
}

/** Ícone tonalizado derivado do rótulo da métrica */
export function MetricIcon({ label, accent, size = 18 }: { label: string; accent: string; size?: number }) {
  const l = label.toLowerCase();
  let path: React.ReactNode;
  if (/investimento|custo|cpm|cpc|cpv|cpe/.test(l)) path = <><circle cx="12" cy="12" r="8" /><path d="M12 8.5v7M10 14.2c0 .9.9 1.5 2 1.5s2-.5 2-1.4c0-2-3.8-1.2-3.8-3.1 0-.8.8-1.4 1.8-1.4s1.9.6 1.9 1.4" /></>;
  else if (/impress/.test(l)) path = <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="2.6" /></>;
  else if (/clique/.test(l)) path = <><path d="M5 3l4 13 2.3-5.2L16.5 8.5 5 3Z" /><path d="M13 13l5 5" /></>;
  else if (/visualiza|vtr|view/.test(l)) path = <><circle cx="12" cy="12" r="9" /><path d="M10 8.5l5 3.5-5 3.5v-7Z" fill="currentColor" stroke="none" /></>;
  else if (/escuta|stream|música|musica|áudio|audio/.test(l)) path = <><path d="M4 14a8 8 0 0 1 16 0" /><rect x="3" y="13" width="4" height="7" rx="1.5" /><rect x="17" y="13" width="4" height="7" rx="1.5" /></>;
  else if (/engaj/.test(l)) path = <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20Z" />;
  else if (/alcance/.test(l)) path = <><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.6-3 2.9-4.5 5.5-4.5S14 16 14.5 19" /><path d="M16 6a3 3 0 0 1 0 5.5M21 19c-.4-2-1.6-3.3-3.3-3.9" /></>;
  else if (/criativo/.test(l)) path = <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" /></>;
  else path = <><path d="M4 19V5M4 19h16M8 16v-5M13 16V8M18 16v-9" /></>;
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg" style={{ background: `${accent}1f`, color: accent }} aria-hidden>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {path}
      </svg>
    </span>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-white text-sm text-[var(--muted)]">
      {message}
    </div>
  );
}
