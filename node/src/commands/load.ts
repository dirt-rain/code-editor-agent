import fm = require("front-matter");
import { minimatch } from "minimatch";
import { readFile } from "node:fs/promises";
import { RULE_CACHE_FILE_PATH, RuleCacheEntry } from "..";
import { cjs } from "../utils/cjs";

export async function load(filePath: string) {
  const allRules: RuleCacheEntry[] = JSON.parse(
    await readFile(RULE_CACHE_FILE_PATH, "utf-8")
  );

  // Build a tag map for quick lookup
  const tagMap = new Map<string, RuleCacheEntry[]>();
  for (const rule of allRules) {
    for (const tag of rule.tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)!.push(rule);
    }
  }

  // Find top-level rules that match the file path
  const topLevelRules: RuleCacheEntry[] = [];
  for (const rule of allRules) {
    const patterns = Array.isArray(rule.patterns)
      ? rule.patterns
      : [rule.patterns];
    const ignorePatterns = rule.ignorePatterns;

    const matchesPattern = patterns.some((pattern) =>
      minimatch(filePath, pattern)
    );
    const matchesIgnore = ignorePatterns.some((pattern) =>
      minimatch(filePath, pattern)
    );

    if (matchesPattern && !matchesIgnore) {
      topLevelRules.push(rule);
    }
  }

  // Collect all rules to load (including referenced rules)
  const rulesToLoad = new Set<RuleCacheEntry>();
  const processRule = (rule: RuleCacheEntry, isTopLevel: boolean) => {
    if (rulesToLoad.has(rule)) return;
    rulesToLoad.add(rule);

    // Add referencesAlways
    for (const tag of rule.referencesAlways) {
      const referencedRules = tagMap.get(tag) ?? [];
      for (const referencedRule of referencedRules) {
        processRule(referencedRule, false);
      }
    }

    // Add referencesIfTop only if this is a top-level rule
    if (isTopLevel) {
      for (const tag of rule.referencesIfTop) {
        const referencedRules = tagMap.get(tag) ?? [];
        for (const referencedRule of referencedRules) {
          processRule(referencedRule, false);
        }
      }
    }
  };

  for (const rule of topLevelRules) {
    processRule(rule, true);
  }

  if (rulesToLoad.size === 0) {
    console.log(`No additional context found for ${filePath}. Continue.`);
    return;
  }

  // Sort by [priority ASC, order DESC, filePath ASC] for priority filtering
  // This ensures that when we filter, lower-order rules survive
  let candidateRules = Array.from(rulesToLoad);
  candidateRules.sort((a, b) => {
    const priorityA = a.priority ?? Infinity;
    const priorityB = b.priority ?? Infinity;
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    if (orderA !== orderB) {
      return orderB - orderA; // DESC: higher order gets filtered out first
    }

    return a.path.localeCompare(b.path);
  });

  // Apply priority filtering:
  // For each rule (in sorted order), if totalRulesToPrint > priority, skip it.
  // Each time we skip a rule, decrement totalRulesToPrint.
  const finalRules: RuleCacheEntry[] = [];
  let totalRulesToPrint = candidateRules.length;

  for (const rule of candidateRules) {
    const priority = rule.priority ?? Infinity;
    if (totalRulesToPrint > priority) {
      // Skip this rule and decrement the count
      totalRulesToPrint--;
    } else {
      // Include this rule
      finalRules.push(rule);
    }
  }

  // Sort final rules by [order ASC, filePath ASC] for output
  finalRules.sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    return a.path.localeCompare(b.path);
  });

  // Print rules
  for (const rule of finalRules) {
    console.log(cjs(fm)(await readFile(rule.path, "utf-8")).body);
  }

  console.log(
    `* * *\n\nEnd of additional context for ${filePath}. Continue.`
  );
}
