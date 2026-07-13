"use client";

import { Play, ShieldCheck } from "@phosphor-icons/react";

export function PlayBadgeIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-action text-white">
      <Play size={14} weight="fill" />
    </span>
  );
}

export function OfficialBadgeIcon() {
  return (
    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/15 text-teal-700">
      <ShieldCheck size={16} weight="fill" />
    </span>
  );
}
