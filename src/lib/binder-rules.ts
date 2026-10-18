export type BinderStatus = "wishlist" | "owned";

export function cleanBinderName(value: unknown) {
  if (typeof value !== "string") return null;
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 1 || name.length > 40) return null;
  return name;
}

export function cleanStatus(value: unknown): BinderStatus | null {
  return value === "wishlist" || value === "owned" ? value : null;
}

export function cleanFinish(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string") return null;
  const finish = value.trim();
  if (finish.length < 1 || finish.length > 40 || !/^[A-Za-z0-9_-]+$/.test(finish)) return null;
  return finish;
}

export function binderProgress(statuses: BinderStatus[]) {
  const owned = statuses.filter((status) => status === "owned").length;
  return { owned, total: statuses.length };
}
