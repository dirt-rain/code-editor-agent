import fm = require("front-matter");
import { minimatch } from "minimatch";
import { readFile } from "node:fs/promises";
import { RuleCacheEntry } from "..";
import { loadConfig } from "../loadConfig";
import { cjs } from "../utils/cjs";

export async function load(agentName: string, filePath: string) {
  const config = await loadConfig();
  const agentConfig = config.agents[agentName];

  if (!agentConfig) {
    throw new Error(`Agent '${agentName}' not found in configuration.`);
  }

  // Load unified cache file
  const CACHE_FILE = ".claude/agents/code-editor/rules-cache-generated.json";
  const allAgentRules: Record<string, RuleCacheEntry[]> = JSON.parse(
    await readFile(CACHE_FILE, "utf-8")
  );

  // Collect all agents to load (current + references)
  const agentsToLoad: string[] = [];

  // Add current agent first (highest priority in topology)
  agentsToLoad.push(agentName);

  // Add referenced agents after (lower priority in topology)
  if (agentConfig.references && agentConfig.references.length > 0) {
    agentsToLoad.push(...agentConfig.references);
  }

  // Load rules from all specified agents with depth tracking
  // Lower agentDepth = higher priority (current agent has depth 0)
  const allRules: Array<RuleCacheEntry & { agentDepth: number }> = [];
  for (let i = 0; i < agentsToLoad.length; i++) {
    const agent = agentsToLoad[i];
    if (allAgentRules[agent]) {
      for (const rule of allAgentRules[agent]) {
        allRules.push({ ...rule, agentDepth: i });
      }
    } else {
      console.error(`Warning: No rules found for agent '${agent}' in cache`);
    }
  }

  // Build a tag map for quick lookup
  type RuleWithDepth = RuleCacheEntry & { agentDepth: number };
  const tagMap = new Map<string, RuleWithDepth[]>();
  for (const rule of allRules) {
    for (const tag of rule.tags) {
      if (!tagMap.has(tag)) {
        tagMap.set(tag, []);
      }
      tagMap.get(tag)!.push(rule);
    }
  }

  // Find top-level rules that match the file path
  const topLevelRules: RuleWithDepth[] = [];
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
  const rulesToLoad = new Set<RuleWithDepth>();
  const processRule = (rule: RuleWithDepth, isTopLevel: boolean) => {
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

  // Sort by [priority ASC, order DESC, agentDepth ASC, filePath ASC] for priority filtering
  // This ensures that when we filter, lower-order rules survive
  // agentDepth ASC means current agent (depth 0) rules survive over referenced agent rules
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

    // Add topology sort: lower agentDepth (current agent) survives
    if (a.agentDepth !== b.agentDepth) {
      return a.agentDepth - b.agentDepth; // ASC: current agent (0) before referenced agents (1, 2, ...)
    }

    return a.path.localeCompare(b.path);
  });

  // Apply priority filtering:
  // For each rule (in sorted order), if totalRulesToPrint > priority, skip it.
  // Each time we skip a rule, decrement totalRulesToPrint.
  const finalRules: RuleWithDepth[] = [];
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

  // Sort final rules by [order ASC, agentDepth ASC, filePath ASC] for output
  // agentDepth ASC means current agent rules appear first
  finalRules.sort((a, b) => {
    const orderA = a.order ?? Infinity;
    const orderB = b.order ?? Infinity;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // Add agentDepth for output ordering
    if (a.agentDepth !== b.agentDepth) {
      return a.agentDepth - b.agentDepth;
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
