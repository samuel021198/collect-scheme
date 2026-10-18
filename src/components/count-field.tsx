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
      <div className="flex h-10 w-fit items-center rounded-lg border border-border">
        <button
          type="button"
          className="h-full px-3 text-base"
          aria-label={t("less")}
          onClick={() => onChange(String(Math.max(1, chosen - 1)))}
        >
          −
        </button>
        <input
          id={id}
          inputMode="numeric"
          value={value}
          className="h-full w-12 bg-transparent text-center outline-none"
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="h-full px-3 text-base"
          aria-label={t("more")}
          onClick={() => onChange(String(Math.min(max, (chosen < 1 ? 0 : chosen) + 1)))}
        >
          +
        </button>
      </div>
    </div>
  );
}
