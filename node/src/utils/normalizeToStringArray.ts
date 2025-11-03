export function normalizeToStringArray(
  value: unknown,
  errorMessage: string
): string[] {
  if (value === undefined) {
    return [];
  }
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v === "string")) {
      return value;
    }
    throw new Error(errorMessage);
  }
  throw new Error(errorMessage);
}
