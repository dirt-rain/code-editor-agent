import fm = require("front-matter");
import { glob } from "glob";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { RULE_CACHE_FILE_PATH, RuleCacheEntry } from "..";
import { loadConfig } from "../loadConfig";
import { cjs } from "../utils/cjs";

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
    if (!("patterns" in (attributes as Record<string, unknown>))) {
      throw new Error(`Rule file ${ruleFile} is missing 'patterns' attribute.`);
    }
    const rule: RuleCacheEntry = {
      patterns: (attributes as Record<"patterns", string | string[]>).patterns,
      path: ruleFile,
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
