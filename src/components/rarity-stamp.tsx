import { finishLabel, type Finish } from "@/lib/finishes";
import { cn } from "cn";

const TONE: Record<Finish["tone"], string> = {
  plain: "bg-black/75 text-white border-white/50",
  holo: "border-white bg-gradient-to-br from-cyan-200 via-white to-amber-200 text-slate-900",
  reverse:
    "border-indigo-200 text-white bg-[radial-gradient(circle_at_20%_30%,white,transparent_42%),radial-gradient(circle_at_70%_60%,#c4b5fd,transparent_36%),linear-gradient(#312e81,#0f172a)]",
  ultra: "border-fuchsia-200 bg-gradient-to-br from-fuchsia-600 to-amber-300 text-white",
  illustration: "border-rose-200 bg-rose-50 text-rose-950",
  special: "border-white bg-gradient-to-r from-pink-400 via-amber-100 to-sky-400 text-slate-900",
  gold: "border-amber-100 bg-gradient-to-br from-amber-200 to-yellow-500 text-amber-950",
  shiny: "border-yellow-100 bg-yellow-100 text-yellow-950",
  promo: "border-emerald-100 bg-emerald-100 text-emerald-950",
};

const VEIL: Partial<Record<Finish["tone"], string>> = {
  holo: "bg-[linear-gradient(115deg,transparent_35%,rgba(255,255,255,0.55)_48%,transparent_62%)] mix-blend-screen",
  reverse:
    "bg-[radial-gradient(circle,rgba(255,255,255,0.55)_1px,transparent_1.6px)] bg-[size:10px_10px] mix-blend-screen opacity-80",
  gold: "bg-[linear-gradient(160deg,transparent_40%,rgba(251,191,36,0.35)_50%,transparent_60%)]",
  special: "bg-[linear-gradient(120deg,rgba(244,114,182,0.18),transparent_40%,rgba(125,211,252,0.2))]",
};

export function RarityMark({
  finish,
  locale,
  corner = "right",
}: {
  finish: Finish | null;
  locale: string;
  corner?: "left" | "right";
}) {
  if (!finish) return null;
  const label = finishLabel(finish, locale);
  return (
    <>
      {VEIL[finish.tone] ? <span aria-hidden className={cn("pointer-events-none absolute inset-0", VEIL[finish.tone])} /> : null}
      <span
        className={cn(
          `pointer-events-none absolute top-2 z-10 grid h-8 min-w-8 place-items-center rounded-md border px-1 text-[10px] font-bold tracking-wide shadow-md ${corner === "left" ? "left-2" : "right-2"}`,
          TONE[finish.tone],
        )}
      >
        {finish.mark}
      </span>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-black/75 px-2 py-1 text-center text-[11px] font-medium text-white">
        {label}
      </span>
    </>
  );
}
