import fm = require("front-matter");
import { glob } from "glob";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { RULE_CACHE_FILE_PATH, RuleCacheEntry } from "..";
import { loadConfig } from "../loadConfig";
import { cjs } from "../utils/cjs";
import { normalizeToStringArray } from "../utils/normalizeToStringArray";

export async function generate(force = false) {
  if (!existsSync(RULE_CACHE_FILE_PATH) && !force) {
    throw new Error(
      "Very likely current working directory is not the root of the project, or `npx code-editor-agent cmd init` not yet runned."
    );
  }

  const config = await loadConfig();

  const intermediate: { comparator: string; result: RuleCacheEntry }[] = [];

  const ruleFiles = await glob(
    ["**/*.code-editor-agent.md", "**/code-editor-agent.md"],
    {
      ignore: config.exclude,
    }
  );

  for (const ruleFile of ruleFiles) {
    const { attributes } = cjs(fm)(await readFile(ruleFile, "utf-8"));
    const attrs = attributes as Record<string, unknown>;

    if (!("patterns" in attrs)) {
      throw new Error(`Rule file ${ruleFile} is missing 'patterns' attribute.`);
    }

    // Validate priority
    if ("priority" in attrs && typeof attrs.priority !== "number") {
      throw new Error(`Rule file ${ruleFile}: 'priority' must be a number.`);
    }

    // Validate order
    if ("order" in attrs && typeof attrs.order !== "number") {
      throw new Error(`Rule file ${ruleFile}: 'order' must be a number.`);
    }

    const rule: RuleCacheEntry = {
      patterns: attrs.patterns as string | string[],
      path: ruleFile,
      ignorePatterns: normalizeToStringArray(
        attrs.ignorePatterns,
        `Rule file ${ruleFile}: 'ignorePatterns' must be a string or array of strings.`
      ),
      priority: attrs.priority as number | undefined,
      tags: normalizeToStringArray(
        attrs.tags,
        `Rule file ${ruleFile}: 'tags' must be a string or array of strings.`
      ),
      referencesIfTop: normalizeToStringArray(
        attrs.referencesIfTop,
        `Rule file ${ruleFile}: 'referencesIfTop' must be a string or array of strings.`
      ),
      referencesAlways: normalizeToStringArray(
        attrs.referencesAlways,
        `Rule file ${ruleFile}: 'referencesAlways' must be a string or array of strings.`
      ),
      order: attrs.order as number | undefined,
    };
    intermediate.push({ comparator: JSON.stringify(rule), result: rule });
  }

  // sort to prevent confusing git diffs
  intermediate.sort((a, b) => a.comparator.localeCompare(b.comparator));

  // format to prevent confusing git diffs
  await writeFile(
    RULE_CACHE_FILE_PATH,
    JSON.stringify(
      intermediate.map(({ result }) => result),
      null,
      2
    ) + "\n"
  );
}
