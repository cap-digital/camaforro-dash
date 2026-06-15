"use client";

import React from "react";

// Faixa de bandeirinhas (festoon) — assinatura visual do São João.
// Triângulos alternando as cores do Camaforró.
const CORES = ["#722B7C", "#E73A37", "#F0862A", "#FFC20E", "#02813F", "#A11D80"];

export function Bandeirinhas({ count = 24, className = "" }: { count?: number; className?: string }) {
  const flags = Array.from({ length: count }, (_, i) => CORES[i % CORES.length]);
  return (
    <div className={`flex w-full items-start overflow-hidden ${className}`} aria-hidden>
      {flags.map((c, i) => (
        <span
          key={i}
          className="flex-1"
          style={{
            height: 0,
            borderLeft: "0.6vw solid transparent",
            borderRight: "0.6vw solid transparent",
            borderTop: `1.1rem solid ${c}`,
            maxWidth: 34,
          }}
        />
      ))}
    </div>
  );
}
