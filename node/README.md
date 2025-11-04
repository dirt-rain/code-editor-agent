# Code Editor Agent

A separate Claude Code agent dedicated to code editing, designed to minimize context pollution in the main session

## Quick Start

A few steps to get started, using `code-editor-agent` command:

### 1. Let Claude Code use the agent, by editing the `CLAUDE.md` file

This should be done manually.

```md
> **DO NOT FORGET THESE RULES, EVEN IF CONTEXT IS COMPACTED.**

**IMPORTANT RULES:**
0. DO NOT FORGET THESE RULES EVEN ON CONTEXT COMPACTION
1. Never edit files directly. Always use the `@code-editor` agent for file modifications.
2. When instructing file edits, do **not** specify exact file contents.  
   Instead, describe the file’s purpose and what it should accomplish.
3. The `@code-editor` agent will receive extra context specific to file editing.  
   It's highly specialized and only relevant for that agent — nothing you need to worry about.
```

This is just an example, but it should contain similar instructions.

### 2. Initialize the agent settings

```sh
npx code-editor-agent cmd init
```

It will create:

- `RENAME-ME.code-editor-agent.md` file which is just an example, but may useful for you.
  - Check its contents to see how to write file-specific rules.
  - Feel free to move it to a more suitable location!
- `.config/code-editor-agent.jsonc` file with default settings.
  - It just excludes `node_modules` directory by default.
- `.claude/agents/code-editor/.cache-data.json` which is required for tool called by agent.
  - This cache file is designed with version control in mind. Feel free to version-control it!
- `.claude/agents/code-editor.md` file with default settings (like example below).

### 3. Customize agent configuration on `.claude/agents/code-editor.md` (optional)

Default settings are like this, but you can customize it:

```md
---
name: code-editor
description: For every code editing
tools: Bash, Read, Edit, Write, Grep, Glob
model: sonnet
color: orange # just an example
---

You must read full output of `npx code-editor-agent "${RELATIVE_PATH_OF_FILE_TO_EDIT_FROM_PROJECT_ROOT_EXCLUDING_LEADING_DOT_SLASH}"` before create/update/delete any file, even if file does not exist yet.
```

### 4. Add documentation for file-specific rules on `code-editor-agent.md`

Your file-specific rules should be added to `[any-name].code-editor-agent.md`, or `code-editor-agent.md`, on any directory.

See the `RENAME-ME.code-editor-agent.md` file generated in step 2 as an example.

### 5. Regenerate cache after updating file-specific rules

```sh
npx code-editor-agent cmd generate
```

It will regenerate the `.claude/agents/code-editor/.cache-data.json` file.

### 6. Use the agent

Instruct Claude Code to edit some files. It will (likely) call the agent, and the agent will load additional context from the file-specific rules.

## Development and Contributing

PRs are welcome! Please feel free to submit any issues or feature requests.

## License

WTFPL
