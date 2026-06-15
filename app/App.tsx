"use client";

import React, { useEffect, useState } from "react";
import { fetchData } from "./lib/data";
import { Row } from "./lib/types";
import { Sidebar } from "./components/Sidebar";
import { Bandeirinhas } from "./components/Bandeirinhas";
import { Landing } from "./views/Landing";
import { Overview } from "./views/Overview";
import { Platforms } from "./views/Platforms";
import { PlatformView } from "./views/PlatformView";
import { Creatives } from "./views/Creatives";
import { Goals } from "./views/Goals";

const VALID = ["overview", "plataformas", "meta", "google", "tiktok", "spotify", "deezer", "criativos", "metas"];

const PLATFORM_ROUTES: Record<string, "Meta" | "Google" | "TikTok" | "Spotify" | "Deezer"> = {
  meta: "Meta",
  google: "Google",
  tiktok: "TikTok",
  spotify: "Spotify",
  deezer: "Deezer",
};

function parseHash(): string {
  if (typeof window === "undefined") return "";
  const h = window.location.hash.replace(/^#\/?/, "");
  return VALID.includes(h) ? h : h === "" ? "" : "overview";
}

export default function App() {
  const [route, setRoute] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    setRoute(parseHash());
    const onHash = () => setRoute(parseHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    let active = true;
    fetchData()
      .then((d) => {
        if (!active) return;
        setRows(d.rows);
        setUpdatedAt(d.timestamp);
      })
      .catch((e) => active && setError(e.message ?? "Erro ao carregar dados"));
    return () => {
      active = false;
    };
  }, []);

  function navigate(r: string) {
    window.location.hash = r ? `/${r}` : "";
    setRoute(r);
    window.scrollTo({ top: 0 });
  }

  if (!mounted) return null;

  if (route === "") {
    return <Landing onEnter={() => navigate("overview")} />;
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--bg)]">
      <Sidebar
        route={route}
        navigate={navigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        updatedAt={updatedAt}
      />

      <div className={`transition-all duration-200 ${collapsed ? "lg:pl-[100px]" : "lg:pl-[268px]"}`}>
        {/* faixa de bandeirinhas no topo do conteúdo */}
        <div className="px-3 pt-3 lg:pl-3 lg:pr-3">
          <Bandeirinhas count={40} />
        </div>
        {/* botão de menu (mobile) */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed left-4 top-4 z-30 rounded-xl border border-[var(--border)] bg-white p-2 text-[var(--ink)] shadow-md lg:hidden"
          aria-label="Abrir menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <main className="mx-auto max-w-7xl px-4 py-5 pt-16 sm:px-6 sm:py-7 lg:pt-7">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              Não foi possível carregar os dados: {error}
            </div>
          )}
          {!error && rows === null && <Loading />}
          {!error && rows && (
            <div key={route} className="fade-in">
              <Page route={route} rows={rows} navigate={navigate} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Page({ route, rows, navigate }: { route: string; rows: Row[]; navigate: (r: string) => void }) {
  if (route === "overview") return <Overview rows={rows} />;
  if (route === "plataformas") return <Platforms rows={rows} navigate={navigate} />;
  if (route === "criativos") return <Creatives rows={rows} />;
  if (route === "metas") return <Goals rows={rows} />;
  const platform = PLATFORM_ROUTES[route];
  if (platform) return <PlatformView rows={rows} platform={platform} />;
  return <Overview rows={rows} />;
}

function Loading() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 animate-pulse rounded-lg bg-[var(--bg-soft)]" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
        <div className="h-72 animate-pulse rounded-2xl bg-[var(--bg-soft)]" />
      </div>
    </div>
  );
}
