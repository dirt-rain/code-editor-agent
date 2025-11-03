import { readFile } from "node:fs/promises";

export async function readFileNothrowOnENOENT(
  path: string
): Promise<string | null> {
  try {
    return await readFile(path, "utf-8");
  } catch (err) {
    if ((err as Partial<Record<"code", unknown>>).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}
