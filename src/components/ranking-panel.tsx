"use client";

import { Crown } from "@phosphor-icons/react";
import type { RankingEntry } from "@/lib/game-data";

export function RankingPanel({ entries, title = "Top 3 de hoje" }: { entries: RankingEntry[]; title?: string }) {
  const [first, second, third] = entries;
  const podium = [
    { entry: second, label: "2", color: "bg-medal-silver", height: "h-28" },
    { entry: first, label: "1", color: "bg-medal-gold", height: "h-40" },
    { entry: third, label: "3", color: "bg-medal-bronze", height: "h-24" }
  ].filter((item) => item.entry);

  return (
    <section className="rounded-lg border border-teal-400/30 bg-zinc-950 p-4 text-white shadow-[0_0_0_1px_rgba(20,184,166,.18),0_18px_44px_rgba(20,184,166,.18)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-200">ranking oficial</p>
          <h2 className="text-xl font-black">{title}</h2>
        </div>
        <Crown size={28} weight="fill" className="text-medal-gold" />
      </div>
      <div className="flex items-end justify-center gap-2">
        {podium.map(({ entry, label, color, height }) => (
          <div key={entry.user_id} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-black">
              {initials(entry.public_name)}
            </div>
            <div className={`flex w-full flex-col items-center justify-end rounded-t-lg ${color} ${height} p-2 text-ink`}>
              <span className="text-lg font-black">{label}</span>
              <span className="mt-1 max-w-full truncate text-xs font-black">{entry.public_name}</span>
              <span className="text-[11px] font-bold">{formatScore(entry.score)}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function RankingRows({ entries }: { entries: RankingEntry[] }) {
  return (
    <div className="space-y-2">
      {entries.map((entry, index) => (
        <div key={`${entry.user_id}-${index}`} className="flex items-center gap-3 rounded-lg border border-line bg-white p-3 shadow-soft">
          <div className={rankClass(index + 1)}>{index + 1}</div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-600 text-sm font-black text-white">
            {initials(entry.public_name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-ink">{entry.public_name}</p>
            <p className="text-xs font-bold text-muted">
              {entry.level ? `Fase ${entry.level}` : "Desafio oficial"}
              {entry.duration_seconds ? ` • ${entry.duration_seconds}s` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-black text-teal-700">{formatScore(entry.score)}</p>
            <p className="text-[11px] font-bold text-muted">pts</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/[._\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatScore(score: number) {
  return new Intl.NumberFormat("pt-BR").format(score);
}

function rankClass(rank: number) {
  const base = "flex h-9 w-9 items-center justify-center rounded-full text-sm font-black";
  if (rank === 1) return `${base} bg-medal-gold text-ink`;
  if (rank === 2) return `${base} bg-medal-silver text-ink`;
  if (rank === 3) return `${base} bg-medal-bronze text-white`;
  return `${base} bg-zinc-100 text-zinc-700`;
}
