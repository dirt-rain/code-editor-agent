export function cjs<T>(imported: Record<"default", T>): T {
  return imported.default ?? (imported as unknown as T);
}
