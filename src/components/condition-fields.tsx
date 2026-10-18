"use client";

import { CONDITIONS, gradeOption, gradesFor, type ConditionType } from "@/lib/grades";

export function ConditionFields({
  idPrefix,
  condition,
  grade,
  quantity,
  labels,
  onCondition,
  onGrade,
  onQuantity,
}: {
  idPrefix: string;
  condition: ConditionType;
  grade: string;
  quantity: string;
  labels: { condition: string; grade: string; quantity: string; raw: string };
  onCondition: (value: ConditionType) => void;
  onGrade: (value: string) => void;
  onQuantity: (value: string) => void;
}) {
  const grades = gradesFor(condition);
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <label className="grid gap-1 text-sm">
        {labels.condition}
        <select
          id={`${idPrefix}-condition`}
          value={condition}
          className="h-10 rounded-lg border border-border bg-background px-2"
          onChange={(event) => onCondition(event.target.value as ConditionType)}
        >
          {CONDITIONS.map((item) => (
            <option key={item} value={item}>
              {item === "raw" ? labels.raw : item.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        {labels.grade}
        <select
          id={`${idPrefix}-grade`}
          value={grades.includes(grade) ? grade : ""}
          disabled={grades.length === 0}
          className="h-10 rounded-lg border border-border bg-background px-2 disabled:opacity-50"
          onChange={(event) => onGrade(event.target.value)}
        >
          {grades.length === 0 ? <option value="">—</option> : null}
          {grades.map((item) => (
            <option key={item} value={item}>
              {gradeOption(condition, item)}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        {labels.quantity}
        <input
          id={`${idPrefix}-qty`}
          inputMode="numeric"
          value={quantity}
          className="h-10 rounded-lg border border-border bg-background px-2"
          onChange={(event) => onQuantity(event.target.value)}
        />
      </label>
    </div>
  );
}
