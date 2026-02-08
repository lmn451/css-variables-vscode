// Helper utilities extracted from src/extension.ts to allow unit testing
export type PathDisplayMode = "relative" | "absolute" | "abbreviated";
export type UndefinedVarFallbackMode = "warning" | "info" | "off";

export function normalizeStringArray(
  value: unknown,
  fallback: string[]
): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0);
  }
  return fallback;
}

export function normalizePathDisplay(
  value: unknown
): PathDisplayMode | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.toLowerCase();
  if (
    normalized === "relative" ||
    normalized === "absolute" ||
    normalized === "abbreviated"
  ) {
    return normalized;
  }
  return undefined;
}

export function normalizePathDisplayLength(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return undefined;
  }
  return Math.floor(value);
}

export function normalizeUndefinedVarFallback(
  value: unknown
): UndefinedVarFallbackMode | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const normalized = value.trim().toLowerCase();
  switch (normalized) {
    case "warning":
    case "warn":
      return "warning";
    case "info":
    case "information":
      return "info";
    case "off":
    case "disable":
    case "disabled":
    case "none":
    case "omit":
      return "off";
    default:
      return undefined;
  }
}
