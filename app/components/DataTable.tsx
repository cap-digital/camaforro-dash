"use client";

import React, { useMemo, useState } from "react";

export interface Column<T> {
  key: string;
  header: string;
  align?: "left" | "right";
  /** valor numérico/string para ordenação */
  sortValue: (row: T) => number | string;
  /** conteúdo renderizado (já formatado, zero => "-") */
  render: (row: T) => React.ReactNode;
}

export function DataTable<T>({
  rows,
  columns,
  pageSize = 10,
  initialSortKey,
  initialSortDir = "desc",
}: {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
  initialSortKey?: string;
  initialSortDir?: "asc" | "desc";
}) {
  const [sortKey, setSortKey] = useState<string>(initialSortKey ?? columns[0]?.key);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(initialSortDir);
  const [page, setPage] = useState(0);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue(a);
      const bv = col.sortValue(b);
      let cmp: number;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), "pt-BR");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return copy;
  }, [rows, columns, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function toggleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(0);
  }

  return (
    <div>
      <div className="-mx-4 overflow-x-auto sm:mx-0">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {columns.map((c) => {
                const active = c.key === sortKey;
                return (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className={`cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--muted)] hover:text-[var(--ink)] ${
                      c.align === "right" ? "text-right" : "text-left"
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.header}
                      <span className={active ? "text-[#722B7C]" : "text-gray-300"}>
                        {active ? (sortDir === "asc" ? "▲" : "▼") : "↕"}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={i}
                className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`whitespace-nowrap px-3 py-2.5 ${
                      c.align === "right"
                        ? "text-right tabular-nums font-medium text-[var(--ink)]"
                        : "text-left text-[var(--ink)]"
                    }`}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-3 py-8 text-center text-[var(--muted)]">
                  Nenhum registro encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} de{" "}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <PagerBtn disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              ‹
            </PagerBtn>
            <span className="px-2 font-semibold text-[var(--ink)]">
              {safePage + 1} / {pageCount}
            </span>
            <PagerBtn disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)}>
              ›
            </PagerBtn>
          </div>
        </div>
      )}
    </div>
  );
}

function PagerBtn({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--border)] bg-white text-sm font-bold text-[var(--ink)] disabled:opacity-40 hover:enabled:bg-gray-50"
    >
      {children}
    </button>
  );
}
