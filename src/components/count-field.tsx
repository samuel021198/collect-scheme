"use client";

import { useTranslations } from "next-intl";

export function CountField({
  id,
  value,
  max,
  label,
  onChange,
}: {
  id: string;
  value: string;
  max: number;
  label: string;
  onChange: (value: string) => void;
}) {
  const t = useTranslations("collection");
  const current = Number(value);
  const chosen = Number.isInteger(current) ? current : 1;

  return (
    <div className="grid gap-1 text-sm">
      <label htmlFor={id}>{label}</label>
      <div className="flex h-12 w-fit items-center rounded-lg border border-border">
        <button
          type="button"
          className="h-full min-w-12 text-lg touch-manipulation"
          aria-label={t("less")}
          onClick={() => onChange(String(Math.max(1, chosen - 1)))}
        >
          −
        </button>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          className="h-full w-14 bg-transparent text-center text-base outline-none"
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="h-full min-w-12 text-lg touch-manipulation"
          aria-label={t("more")}
          onClick={() => onChange(String(Math.min(max, (chosen < 1 ? 0 : chosen) + 1)))}
        >
          +
        </button>
      </div>
    </div>
  );
}
