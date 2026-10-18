export const LAYOUTS = ["3x3", "4x3", "4x4"] as const;

export type BinderLayout = (typeof LAYOUTS)[number];

export function layoutSize(layout: BinderLayout) {
  if (layout === "4x4") return { cols: 4, rows: 4 };
  if (layout === "4x3") return { cols: 4, rows: 3 };
  return { cols: 3, rows: 3 };
}

export function cleanLayout(value: unknown): BinderLayout | null {
  return value === "3x3" || value === "4x3" || value === "4x4" ? value : null;
}

export function cleanBinderName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 40) return null;
  return name;
}

export type PackedSlot = { page: number; row: number; col: number };

export function packSlots(count: number, layout: BinderLayout): PackedSlot[] {
  const { cols, rows } = layoutSize(layout);
  const perPage = cols * rows;
  return Array.from({ length: count }, (_, index) => ({
    page: Math.floor(index / perPage),
    row: Math.floor((index % perPage) / cols),
    col: index % cols,
  }));
}
