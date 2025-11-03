import fm = require("front-matter");
import { minimatch } from "minimatch";
import { readFile } from "node:fs/promises";
import { RULE_CACHE_FILE_PATH, RuleCacheEntry } from "..";
import { cjs } from "../utils/cjs";

export async function load(filePath: string) {
  const rulesCaches: RuleCacheEntry[] = JSON.parse(
    await readFile(RULE_CACHE_FILE_PATH, "utf-8")
  );

  let found = false;
  for (const rulesCache of rulesCaches) {
    const patterns = Array.isArray(rulesCache.patterns)
      ? rulesCache.patterns
      : [rulesCache.patterns];
    if (patterns.some((pattern) => minimatch(filePath, pattern))) {
      found = true;
      console.log(cjs(fm)(await readFile(rulesCache.path, "utf-8")).body);
    }
  }

  if (found) {
    console.log(
      `* * *\n\nEnd of additional context for ${filePath}. Continue.`
    );
  } else {
    console.log(`No additional context found for ${filePath}. Continue.`);
  }
}
