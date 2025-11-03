import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { RULE_CACHE_FILE_PATH } from "..";
import { CONFIG_FILE_PATH, DEFAULT_CONFIG } from "../loadConfig";
import { generate } from "./generate";

export async function init() {
  if (existsSync(RULE_CACHE_FILE_PATH)) {
    throw new Error(
      `Very likely you have already initialized the agent. To re-initialize, delete the ${RULE_CACHE_FILE_PATH} file and retry.`
    );
  }

  // config file
  await mkdir(dirname(CONFIG_FILE_PATH), { recursive: true });
  await writeFile(
    CONFIG_FILE_PATH,
    JSON.stringify(DEFAULT_CONFIG, null, 2) + "\n",
    "utf-8"
  );

  // RENAME-ME.code-editor-agent.md
  await writeFile(
    "RENAME-ME.code-editor-agent.md",
    `---
# String or array of strings of glob patterns to match files to apply this rule to
patterns: ["**/*.code-editor-agent.md", "**/code-editor-agent.md"]
---

# \`code-editor-agent\` additional file-specific rules

\`**/*.code-editor-agent.md\`, \`**/code-editor-agent.md\` files are used to serve additional context for the file-specific rules to the \`code-editor\` agent.

## How it works:

1. The Claude Code main session will call the \`code-editor\` agent to edit files.
2. When invoked, the \`code-editor\` agent will **load additional context** from these files by reading the output of: \`npx code-editor-agent \${FILE_PATH_TO_EDIT}\`.
3. The \`code-editor-agent\` CLI prints only the additional context relevant to the target file.
4. Therefore, these files act as meta rules. Handle them carefully and do not edit them directly outside this workflow.

## File format

The file should be in Markdown format with Front Matter (YAML) at the beginning.

The Front Matter should contain the following fields:

- \`patterns\` (required): String or array of strings of glob patterns to match files to apply this rule to.
- \`ignorePatterns\` (optional, not implemented yet): String or array of strings of glob patterns to ignore files to apply this rule to. File with path matching both patterns will be ignored.
- \`priority\` (optional, but highly recommended, not implemented yet): Higher number means higher priority. If total rules loaded is more than its priority, it will be skipped. Infinity if omitted.
- \`tags\` (optional, not implemented yet): String or array of strings of tags for reference this rule in other files.
- \`referencesIfTop\` (optional, not implemented yet): String or array of strings of tags of other rules to reference. Used only if this rule is the top-level rule which path matches patterns.
- \`referencesAlways\` (optional, not implemented yet): String or array of strings of tags of other rules to reference. Used even if this rule is referenced by other rules.
- \`order\` (optional, not implemented yet): Number to sort the rules. Used to determine the order of the rules.

The body of the file should contain the additional context for the file-specific rules.

If you want to automatically load other rules

Only the body will be printed by \`code-editor-agent\` CLI.

## Example workflow

If all rule files are like this:

- \`A.code-editor-agent.md\` file with patterns \`src/**/*.tsx\`
- \`B.code-editor-agent.md\` file with patterns \`**/lib/**\`, referencesAlways: \`WillCalled\`
- \`C.code-editor-agent.md\` file with empty patterns, tags: \`WillCalled\`, referencesIfTop: \`WillNotCalled\`
- \`D.code-editor-agent.md\` file with empty patterns, tags: \`WillNotCalled\`

And agent is going to edit \`src/lib/Button.tsx\` file, then:

- \`A.code-editor-agent.md\` will be loaded because it matches the file path.
- \`B.code-editor-agent.md\` will be loaded because it matches the file path. Additionally, it's referencing all rules with tag \`WillCalled\`.
- \`C.code-editor-agent.md\` will be loaded because it tag \`WillCalled\` as \`B.code-editor-agent.md\` references it. As this is loaded not because of matching patterns, \`referencesIfTop\` will not be applied.
- \`D.code-editor-agent.md\` will not be loaded because patterns do not match, and no top-level rule \`referencesIfTop\` references it, and no indirectly referenced rule \`referencesAlways\` references it.

## Notes

- After modifying these files, inform the user that they should run: \`npx code-editor-agent cmd generate\` to regenerate the cache used by the CLI.
- These files are not regular code files — they exist solely to provide structured guidance to the agent.
- Only modify this file if absolutely necessary, and after careful consideration. Changes here can affect how the agent applies rules, so make sure the modification is truly needed.
`
  );
  // TODO: implement tags, referencesIfTop, referencesAlways, order

  // .claude/agents/code-editor.md
  await mkdir(".claude/agents", { recursive: true });
  await writeFile(
    ".claude/agents/code-editor.md",
    `---
name: code-editor
description: For every code editing
tools: Bash, Read, Edit, Write, Grep, Glob
model: sonnet
color: orange
---

You must read full output of \`npx code-editor-agent "\${RELATIVE_PATH_OF_FILE_TO_EDIT_FROM_PROJECT_ROOT_EXCLUDING_LEADING_DOT_SLASH}"\` before create/update/delete any file.
`,
    "utf-8"
  );

  // .claude/agents/code-editor/.cache-data.json
  await mkdir(dirname(RULE_CACHE_FILE_PATH), { recursive: true });
  await generate(true);
}
