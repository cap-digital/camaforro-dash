"use client";

import React, { useEffect, useState } from "react";
import { BarChart3 } from "lucide-react";
import { PLATFORM_COLORS } from "../lib/types";

interface Leaf {
  route: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const PLATFORM_LEAVES: Leaf[] = [
  { route: "meta", label: "Meta", icon: <IconDot />, color: PLATFORM_COLORS.Meta },
  { route: "google", label: "Google", icon: <IconDot />, color: PLATFORM_COLORS.Google },
  { route: "tiktok", label: "TikTok", icon: <IconDot />, color: PLATFORM_COLORS.TikTok },
  { route: "spotify", label: "Spotify", icon: <IconDot />, color: PLATFORM_COLORS.Spotify },
  { route: "deezer", label: "Deezer", icon: <IconDot />, color: PLATFORM_COLORS.Deezer },
];

const PLATFORM_ROUTES = ["plataformas", ...PLATFORM_LEAVES.map((l) => l.route)];

const CORES = ["#722B7C", "#E73A37", "#F0862A", "#FFC20E", "#02813F", "#A11D80"];

export function Sidebar({
  route,
  navigate,
  open,
  onClose,
  collapsed,
  onToggleCollapse,
  updatedAt,
}: {
  route: string;
  navigate: (r: string) => void;
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  updatedAt?: string;
}) {
  const [groupOpen, setGroupOpen] = useState(PLATFORM_ROUTES.includes(route));
  useEffect(() => {
    if (PLATFORM_ROUTES.includes(route)) setGroupOpen(true);
  }, [route]);

  const go = (r: string) => {
    navigate(r);
    onClose();
  };

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-[#2E0F35]/40 lg:hidden" onClick={onClose} aria-hidden />}

      <aside
        className={`fixed inset-y-3 left-3 z-40 flex flex-col overflow-hidden rounded-3xl text-white shadow-[0_18px_45px_rgba(46,15,53,0.35)] transition-all duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-[120%]"
        } ${collapsed ? "w-[76px]" : "w-60"}`}
        style={{ background: "linear-gradient(180deg,#722B7C 0%,#4A1652 55%,#2E0F35 100%)" }}
      >
        {/* bandeirinhas no topo */}
        <div className="flex w-full">
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} className="flex-1" style={{ height: 0, borderTop: `10px solid ${CORES[i % CORES.length]}` }} />
          ))}
        </div>

        {/* botão colapsar (desktop) — no meio da borda direita */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expandir menu" : "Colapsar menu"}
          title={collapsed ? "Expandir menu" : "Colapsar menu"}
          className="absolute -right-3.5 top-1/2 z-50 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#FFC20E] text-[#2E0F35] shadow-[0_4px_14px_rgba(46,15,53,0.45)] ring-2 ring-white transition hover:scale-110 lg:flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className={`transition-transform ${collapsed ? "rotate-180" : ""}`}>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>

        {/* logo */}
        <button
          onClick={() => go("")}
          title="Página inicial"
          className={`flex items-center gap-3 border-b border-white/10 px-4 py-4 text-left transition hover:bg-white/5 ${collapsed ? "justify-center px-0" : ""}`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white p-1.5 shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/brand/logocamaforro.svg" alt="Camaforró 2026" className="h-full w-full object-contain" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <p className="font-display text-sm font-bold">Camaforró 2026</p>
              <p className="text-[11px] text-white/60">Dashboard de Mídia</p>
            </div>
          )}
        </button>

        {/* nav */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          <Item leaf={{ route: "overview", label: "Visão Geral", icon: <IconGrid />, color: "#FFC20E" }} active={route === "overview"} collapsed={collapsed} onClick={() => go("overview")} />

          {collapsed ? (
            // colapsado: ícones planos das plataformas
            PLATFORM_LEAVES.map((l) => (
              <Item key={l.route} leaf={l} active={route === l.route} collapsed onClick={() => go(l.route)} />
            ))
          ) : (
            <div>
              {/* cabeçalho do grupo */}
              <div
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  route === "plataformas" ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/8 hover:text-white"
                }`}
              >
                <button onClick={() => go("plataformas")} className="flex flex-1 items-center gap-3 text-left">
                  <span style={{ color: "#3FA9C9" }}><IconLayers /></span>
                  Plataformas
                </button>
                <button onClick={() => setGroupOpen((o) => !o)} aria-label="Expandir plataformas" className="rounded p-0.5 hover:bg-white/10">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-transform ${groupOpen ? "rotate-90" : ""}`}>
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
              {/* filhos */}
              {groupOpen && (
                <div className="mt-1 space-y-0.5 border-l border-white/10 pl-3 ml-3.5">
                  {PLATFORM_LEAVES.map((l) => {
                    const active = route === l.route;
                    return (
                      <button
                        key={l.route}
                        onClick={() => go(l.route)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition ${
                          active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/8 hover:text-white"
                        }`}
                      >
                        <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <Item leaf={{ route: "criativos", label: "Criativos", icon: <IconImage />, color: "#A11D80" }} active={route === "criativos"} collapsed={collapsed} onClick={() => go("criativos")} />
          <Item leaf={{ route: "metas", label: "Metas", icon: <IconTarget />, color: "#E73A37" }} active={route === "metas"} collapsed={collapsed} onClick={() => go("metas")} />
          <Item leaf={{ route: "analytics", label: "Google Analytics", icon: <BarChart3 size={18} strokeWidth={2} />, color: "#F0862A" }} active={route === "analytics"} collapsed={collapsed} onClick={() => go("analytics")} />
        </nav>

        {!collapsed && (
          <div className="border-t border-white/10 px-5 py-4 text-[11px] text-white/45">
            {updatedAt && (
              <p className="mb-2 flex items-center gap-1.5 text-white/55">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#FFC20E]" />
                Atualizado em {formatUpdatedAt(updatedAt)}
              </p>
            )}
            <p>O São João de Camaçari</p>
            <p className="mt-2 text-white/30">Prefeitura de Camaçari</p>
          </div>
        )}
      </aside>
    </>
  );
}

function Item({ leaf, active, collapsed, onClick }: { leaf: Leaf; active: boolean; collapsed: boolean; onClick: () => void }) {
  return (
    <button
      title={leaf.label}
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
        collapsed ? "justify-center px-0" : ""
      } ${active ? "bg-white/15 text-white shadow-sm" : "text-white/65 hover:bg-white/8 hover:text-white"}`}
    >
      <span style={{ color: leaf.color }}>{leaf.icon}</span>
      {!collapsed && leaf.label}
    </button>
  );
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function IconGrid() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}
function IconLayers() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 2 7l10 5 10-5-10-5Z" /><path d="m2 17 10 5 10-5M2 12l10 5 10-5" />
    </svg>
  );
}
function IconDot() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /></svg>;
}
function IconImage() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-5-5L5 21" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" />
    </svg>
  );
}
