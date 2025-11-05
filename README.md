# Code Editor Agent

A separate Claude Code agent dedicated to code editing, designed to minimize context pollution in the main session

## Quick Start

### Installation

Choose one of the following based on your preference:

#### Option 1: Node.js (via npm)

```sh
npm install -D code-editor-agent
```

Then use `npx code-editor-agent` in your project.

#### Option 2: Go Binary

**Install via go install:**
```sh
go install github.com/dirt-rain/code-editor-agent/go@latest
```

**Or download pre-built binaries** from [releases](https://github.com/dirt-rain/code-editor-agent/releases).

**Or build from source:**
```sh
cd go
go build -o code-editor-agent .
sudo mv code-editor-agent /usr/local/bin/
```

### Setup Steps (Common for both Node.js and Go)

### 1. Configure Claude Code's main instructions

Add instructions to your project's `CLAUDE.md` file (located in your project root) to tell Claude Code to use the agent for file editing:

```md
> **DO NOT FORGET THESE RULES, EVEN IF CONTEXT IS COMPACTED.**

**File Editing Rules:**
1. Never edit files directly. Always use the `@code-editor` agent for file modifications.
2. When instructing file edits, describe the file's purpose and what it should accomplish,
   rather than specifying exact file contents.
3. The `@code-editor` agent has specialized context for file editing.
```

**Note:** If you don't have a `CLAUDE.md` file yet, create one in your project root directory. This step is essential for Claude Code to know when to invoke the agent.

### 2. Configure Claude Code permissions

Add the following to your `.claude/settings.json` to allow the agent to run:

**For Node.js:**
```json
{
  "permissions": {
    "allow": [
      "Bash(npx code-editor-agent:*)"
    ]
  }
}
```

**For Go binary:**
```json
{
  "permissions": {
    "allow": [
      "Bash(code-editor-agent:*)"
    ]
  }
}
```

### 3. Initialize the agent settings

**For Node.js:**
```sh
npx code-editor-agent cmd init
```

**For Go binary:**
```sh
code-editor-agent cmd init
```

It will create:

- `RENAME-ME.code-editor-agent.md` file which is just an example, but may useful for you.
  - Check its contents to see how to write file-specific rules.
  - Feel free to move it to a more suitable location!
- `.config/code-editor-agent.jsonc` file with default settings.
  - It just excludes `node_modules` directory by default.
- `.claude/agents/code-editor/rules-cache-generated.json` which is required for tool called by agent.
  - This cache file is designed with version control in mind. Feel free to version-control it!
- `.claude/agents/code-editor.md` file with default settings (like example below).

### 4. Customize agent configuration on `.claude/agents/code-editor.md` (optional)

Default settings are like this, but you can customize it:

**For Node.js:**
```md
---
name: code-editor
description: For every code editing
tools: Bash, Read, Edit, Write, Grep, Glob
model: sonnet
color: orange
---

You must read full output of `npx code-editor-agent "${RELATIVE_PATH_OF_FILE_TO_EDIT_FROM_PROJECT_ROOT_EXCLUDING_LEADING_DOT_SLASH}"` before create/update/delete any file, even if file does not exist yet.
```

**For Go binary:**
```md
---
name: code-editor
description: For every code editing
tools: Bash, Read, Edit, Write, Grep, Glob
model: sonnet
color: orange
---

You must read full output of `code-editor-agent "${RELATIVE_PATH_OF_FILE_TO_EDIT_FROM_PROJECT_ROOT_EXCLUDING_LEADING_DOT_SLASH}"` before create/update/delete any file, even if file does not exist yet.
```

### 5. Add documentation for file-specific rules on `code-editor-agent.md`

Your file-specific rules should be added to `[any-name].code-editor-agent.md`, or `code-editor-agent.md`, on any directory.

See the `RENAME-ME.code-editor-agent.md` file generated in step 3 as an example.

### 6. Regenerate cache after updating file-specific rules

**For Node.js:**
```sh
npx code-editor-agent cmd generate
```

**For Go binary:**
```sh
code-editor-agent cmd generate
```

It will regenerate the `.claude/agents/code-editor/rules-cache-generated.json` file.

### 7. Use the agent

Instruct Claude Code to edit some files. It will (likely) call the agent, and the agent will load additional context from the file-specific rules.

## Multi-Agent Support

You can define multiple custom agents through `.config/code-editor-agent.jsonc`.

### Configuration Structure

The configuration uses **commandGroup** to organize agents:
- Agents with `commandGroup: null` are invoked as: `npx code-editor-agent <file>`
- Agents with a commandGroup are invoked as: `npx code-editor-agent <group> <file>`

Agents can **reference** other agents to include their rules.

### Example Configuration

Edit `.config/code-editor-agent.jsonc`:

```jsonc
{
  "exclude": ["./node_modules/**"],
  "agents": {
    // Default agent
    "code-editor": {
      "ruleFilePattern": "**/*.code-editor-agent.md",
      "commandGroup": null, // usage: code-editor-agent <path>
    },

    // Reviewer agent that also loads code-editor rules
    "code-reviewer": {
      "ruleFilePattern": "**/*.code-reviewer.md",
      "commandGroup": "reviewer", // usage: code-editor-agent reviewer <path>
      "references": ["code-editor"]  // Include code-editor rules too!
    },
  }
}
```

### Usage

```bash
# Use default agent (commandGroup: null)
npx code-editor-agent src/main.ts

# Use reviewer agent (loads code-reviewer + code-editor rules)
npx code-editor-agent reviewer src/main.ts
```

### Creating Rule Files

Create rule files matching each agent's `ruleFilePattern`:

**typescript.code-editor-agent.md:**
```markdown
---
patterns: "**/*.ts"
priority: 10
---

For TypeScript files:
- Use strict type checking
- Prefer interfaces over types
- Use async/await over raw Promises
```

**review.code-reviewer.md:**
```markdown
---
patterns: "**/*.ts"
priority: 10
---

When reviewing TypeScript code:
- Check for proper type annotations
- Ensure no 'any' types without justification
- Verify error handling
- Look for security issues
```

After creating rule files, regenerate caches:

```bash
npx code-editor-agent cmd generate
```

### Creating Claude Code Agents

Create `.claude/agents/code-reviewer.md`:

```markdown
---
name: code-reviewer
description: Review code for quality and security
tools: Bash, Read, Grep, Glob
model: sonnet
color: red
---

You must read full output of `npx code-editor-agent reviewer "${FILE_PATH}"` before reviewing the file.
```

**Note:** The CLI uses the commandGroup ("reviewer"), not the agent name ("code-reviewer").

## MCP Server (Model Context Protocol)

An MCP server wrapper is available for using code-editor-agent with Claude Desktop and other MCP clients. This allows you to use code-editor-agent functionality through MCP tools instead of the CLI.

### Quick Start with MCP

1. **Install the MCP server:**

   ```bash
   cd mcp
   npm install
   npm run build
   ```

2. **Configure Claude Desktop:**

   Add to your `claude_desktop_config.json`:

   **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

   ```json
   {
     "mcpServers": {
       "code-editor-agent": {
         "command": "node",
         "args": ["/absolute/path/to/code-editor-agent/mcp/dist/index.js"]
       }
     }
   }
   ```

3. **Restart Claude Desktop** and you'll see the code-editor-agent tools available!

### Available MCP Tools

- `code_editor_agent_init` - Initialize configuration
- `code_editor_agent_generate` - Generate/regenerate rule cache
- `code_editor_agent_load` - Load rules for a specific file
- `code_editor_agent_list_config` - Show configuration

### Learn More

See [mcp/README.md](mcp/README.md) for detailed MCP server documentation.

## Development and Contributing

PRs are welcome! Please feel free to submit any issues or feature requests.

## Development

Ensure `node/README.md` is up to date. Copy h1 section, corresponding Quick Start section, License section.

## Help wanted

Calling front-matter really sucks.

I have to use this workaround to support both CommonJS and ES Modules.

Really really sucks. Please help me to improve this.

```ts
import fm = require("front-matter");

(fm.default ?? (fm as unknown as typeof fm.default))(something)
```

## License

WTFPL
