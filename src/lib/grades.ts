export const CONDITIONS = ["raw", "psa", "bgs", "cgc", "tag"] as const;

export type ConditionType = (typeof CONDITIONS)[number];

function halves(start: number, end: number) {
  const grades: string[] = [];
  for (let value = start; value <= end + 0.001; value += 0.5) {
    grades.push(Number.isInteger(value) ? String(value) : value.toFixed(1));
  }
  return grades;
}

const PSA = halves(1, 9).filter((grade) => grade !== "9.5").concat("10");
const BGS = halves(1, 10);
const CGC = halves(1, 9.5).concat(["10", "pristine_10"]);
const TAG = halves(1, 9).filter((grade) => grade !== "9.5").concat("10");

const ALLOWED: Record<ConditionType, string[]> = {
  raw: [],
  psa: PSA,
  bgs: BGS,
  cgc: CGC,
  tag: TAG,
};

export function gradesFor(condition: ConditionType) {
  return ALLOWED[condition];
}

export function cleanCondition(condition: unknown, grade: unknown): { condition: ConditionType; grade: string } | null {
  if (typeof condition !== "string" || !CONDITIONS.includes(condition as ConditionType)) return null;
  const kind = condition as ConditionType;
  if (kind === "raw") return { condition: kind, grade: "" };
  if (typeof grade !== "string" || !ALLOWED[kind].includes(grade)) return null;
  return { condition: kind, grade };
}

export function cleanQuantity(value: unknown) {
  const quantity = typeof value === "number" ? value : typeof value === "string" && value.trim() ? Number(value) : 1;
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;
  return quantity;
}

export function cleanCardIds(value: unknown, limit = 48) {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !/^[A-Za-z0-9-]{1,40}$/.test(item) || ids.includes(item)) continue;
    ids.push(item);
    if (ids.length >= limit) break;
  }
  return ids;
}

export function quantityLeft(owned: number, requested: unknown) {
  const amount = cleanQuantity(requested);
  if (!amount || !Number.isInteger(owned) || owned < 1 || amount > owned) return null;
  return owned - amount;
}

export function gradeRank(condition: ConditionType, grade: string) {
  if (condition === "raw" || !grade) return -1;
  if (grade === "pristine_10") return 10.5;
  const value = Number(grade);
  return Number.isFinite(value) ? value : -1;
}

export function gradeOption(condition: ConditionType, grade: string) {
  if (condition === "cgc" && grade === "10") return "Gem Mint 10";
  if (condition === "cgc" && grade === "pristine_10") return "Pristine 10";
  return grade;
}

export function conditionLabel(condition: ConditionType, grade: string) {
  if (condition === "raw") return "Raw";
  if (condition === "cgc" && grade === "10") return "CGC Gem Mint 10";
  if (condition === "cgc" && grade === "pristine_10") return "CGC Pristine 10";
  return `${condition.toUpperCase()} ${grade}`;
}
