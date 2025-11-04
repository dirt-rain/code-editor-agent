import fm = require("front-matter");
import { glob } from "glob";
import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
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

  // Validate commandGroup uniqueness and reserved names
  const commandGroupsSeen = new Set<string | null>();
  for (const [agentName, agentConfig] of Object.entries(config.agents)) {
    const commandGroup = agentConfig.commandGroup;

    // Check for reserved commandGroup name
    if (commandGroup === "cmd") {
      throw new Error(
        `Agent '${agentName}' cannot use reserved commandGroup 'cmd'. Please choose a different commandGroup.`
      );
    }

    // Check for duplicate commandGroups
    if (commandGroupsSeen.has(commandGroup)) {
      const groupName = commandGroup === null ? "null" : `'${commandGroup}'`;
      throw new Error(
        `Multiple agents have the same commandGroup: ${groupName}. Each agent must have a unique commandGroup.`
      );
    }

    commandGroupsSeen.add(commandGroup);
  }

  // Single cache structure: { agentName: RuleCacheEntry[] }
  const allAgentRules: Record<string, RuleCacheEntry[]> = {};

  // Generate cache for each agent
  for (const [agentName, agentConfig] of Object.entries(config.agents)) {
    console.log(`Scanning rules for agent: ${agentName}`);

    const result: RuleCacheEntry[] = [];

    const ruleFiles = await glob([agentConfig.ruleFilePattern], {
      ignore: config.exclude,
    });

    for (const ruleFile of ruleFiles) {
      const { attributes } = cjs(fm)(await readFile(ruleFile, "utf-8"));
      const attrs = attributes as Record<string, unknown>;

      if (!("patterns" in attrs)) {
        throw new Error(
          `Rule file ${ruleFile} is missing 'patterns' attribute.`
        );
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
      result.push(rule);
    }

    // sort to prevent confusing git diffs
    result.sort((a, b) => a.path.localeCompare(b.path));

    allAgentRules[agentName] = result;
    console.log(`Found ${result.length} rules for ${agentName}`);
  }

  // Write single unified cache file
  const cacheDir = dirname(RULE_CACHE_FILE_PATH);
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true });
  }

  await writeFile(
    RULE_CACHE_FILE_PATH,
    JSON.stringify(allAgentRules, null, 2) + "\n"
  );

  console.log(`\nGenerated unified cache file: ${RULE_CACHE_FILE_PATH}`);
}
