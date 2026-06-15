"use client";

import React from "react";
import { Bandeirinhas } from "../components/Bandeirinhas";

export function Landing({ onEnter }: { onEnter: () => void }) {
  return (
    <div
      className="relative flex min-h-[100dvh] flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg,#FFE600 0%,#FFD000 26%,#F8A91A 58%,#F0862A 100%)",
      }}
    >
      <Bandeirinhas count={36} />

      {/* estrelinhas decorativas */}
      {/* eslint-disable @next/next/no-img-element */}
      <img src="/assets/brand/estrelinha-vermelha.svg" alt="" aria-hidden className="pointer-events-none absolute left-[6%] top-[18%] hidden w-9 anim-sway sm:block" />
      <img src="/assets/brand/estrelinha-amarela.svg" alt="" aria-hidden className="pointer-events-none absolute right-[8%] top-[26%] hidden w-10 anim-sway sm:block" />
      <img src="/assets/brand/estrelinha-laranja.svg" alt="" aria-hidden className="pointer-events-none absolute bottom-[14%] left-[12%] hidden w-8 anim-sway sm:block" />
      <img src="/assets/brand/fogueira.svg" alt="" aria-hidden className="pointer-events-none absolute bottom-0 right-[-2%] w-40 sm:right-[4%] sm:w-56" />
      <img src="/assets/brand/sanfona.svg" alt="" aria-hidden className="pointer-events-none absolute bottom-[6%] left-[-2%] hidden w-44 anim-sway sm:block" />

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
        <img src="/assets/brand/logocamaforro.svg" alt="Camaforró 2026" className="w-64 max-w-[80vw] drop-shadow-[0_8px_18px_rgba(46,15,53,0.18)] sm:w-80" />
        {/* eslint-enable @next/next/no-img-element */}

        <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#722B7C] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-md">
          Dashboard de Mídia
        </span>

        <p className="mt-5 max-w-md text-base font-medium text-[#2E0F35] sm:text-lg">
          Performance das campanhas de mídia do{" "}
          <strong className="text-[#722B7C]">Camaforró 2026</strong> — O São João de Camaçari.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-[#2E0F35]">
          {["Meta", "Google", "TikTok", "Spotify", "Deezer"].map((p) => (
            <span key={p} className="rounded-lg bg-white/70 px-3 py-1 shadow-sm">
              {p}
            </span>
          ))}
        </div>

        <button
          onClick={onEnter}
          className="group mt-9 inline-flex items-center gap-2 rounded-2xl bg-[#E73A37] px-8 py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#cf2f2c] active:scale-[0.98]"
        >
          Acessar Dashboard
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition-transform group-hover:translate-x-1">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>

      <p className="relative z-10 pb-5 text-center text-[11px] font-semibold text-[#2E0F35]/70">
        Prefeitura de Camaçari · Todo dia tem forró
      </p>
    </div>
  );
}
