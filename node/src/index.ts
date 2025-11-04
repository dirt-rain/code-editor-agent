#!/usr/bin/env node

import { generate } from "./commands/generate";
import { init } from "./commands/init";
import { load } from "./commands/load";
import { loadConfig } from "./loadConfig";

export interface RuleCacheEntry {
  patterns: string | string[];
  path: string;
  ignorePatterns: string[];
  priority?: number;
  tags: string[];
  referencesIfTop: string[];
  referencesAlways: string[];
  order?: number;
}

export const RULE_CACHE_FILE_PATH =
  ".claude/agents/code-editor/rules-cache-generated.json";

const args = process.argv.slice(2);

// Find agent by commandGroup
async function findAgentByCommandGroup(group: string | null): Promise<string | null> {
  const config = await loadConfig();
  for (const [agentName, agentConfig] of Object.entries(config.agents)) {
    if (agentConfig.commandGroup === group) {
      return agentName;
    }
  }
  return null;
}

async function main() {
  if (args.length === 1) {
    // code-editor-agent <file-path>
    // Find agent with commandGroup: null
    const agentName = await findAgentByCommandGroup(null);
    if (!agentName) {
      console.error("No agent found with commandGroup: null");
      process.exit(1);
    }
    await load(agentName, args[0]);
  } else if (args.length === 2) {
    if (args[0] === "cmd") {
      // code-editor-agent cmd <command>
      switch (args[1]) {
        case "init":
          await init();
          break;
        case "generate":
          await generate();
          break;
        default:
          console.error(`Unknown command: ${args[1]}`);
          process.exit(1);
      }
    } else {
      // code-editor-agent <commandGroup> <file-path>
      const agentName = await findAgentByCommandGroup(args[0]);
      if (!agentName) {
        console.error(`No agent found with commandGroup: ${args[0]}`);
        process.exit(1);
      }
      await load(agentName, args[1]);
    }
  } else {
    console.error("Usage:");
    console.error("  code-editor-agent <file-path>              # Use agent with commandGroup: null");
    console.error("  code-editor-agent <commandGroup> <file>    # Use agent with specified commandGroup");
    console.error("  code-editor-agent cmd init                 # Initialize configuration");
    console.error("  code-editor-agent cmd generate             # Generate rule caches");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
