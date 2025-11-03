#!/usr/bin/env node

import { generate } from "./commands/generate";
import { init } from "./commands/init";
import { load } from "./commands/load";

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

if (args.length === 1) {
  load(args[0]).catch((e) => {
    console.error(e);
    process.exit(1);
  });
} else if (args.length === 2 && args[0] === "cmd") {
  switch (args[1]) {
    case "init":
      init().catch((e) => {
        console.error(e);
        process.exit(1);
      });
      break;
    case "generate":
      generate().catch((e) => {
        console.error(e);
        process.exit(1);
      });
      break;
  }
} else {
  console.error("Usage: code-editor-agent <file-path>");
  process.exit(1);
}
