# Code Editor Agent MCP Server

This is an MCP (Model Context Protocol) server wrapper for the [code-editor-agent](https://github.com/dirt-rain/code-editor-agent) CLI tool. It exposes the CLI functionality as MCP tools that can be used by Claude Desktop and other MCP clients.

## What is code-editor-agent?

Code Editor Agent is a specialized tool for Claude Code that loads context-specific rules before editing files. It helps minimize context pollution by serving as a separate, dedicated agent.

## Prerequisites

1. **code-editor-agent CLI must be installed**: This MCP server wraps the CLI, so you need to have `code-editor-agent` installed and available:

   ```bash
   # Install the CLI (choose one):
   npm install -g code-editor-agent
   # OR download the Go binary from releases
   ```

2. **Node.js 18+**: Required to run the MCP server

## Installation

### Option 1: Install from npm (when published)

```bash
npm install -g code-editor-agent-mcp
```

### Option 2: Build from source

```bash
cd mcp
npm install
npm run build
```

## Configuration

### For Claude Desktop

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "code-editor-agent": {
      "command": "npx",
      "args": ["code-editor-agent-mcp"]
    }
  }
}
```

If you installed globally:

```json
{
  "mcpServers": {
    "code-editor-agent": {
      "command": "code-editor-agent-mcp"
    }
  }
}
```

If running from source:

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

### Important Notes

- Use **absolute paths** (not relative paths like `~/` or `./`)
- Restart Claude Desktop completely after configuration changes
- Check Claude Desktop logs if the server doesn't appear

## Available Tools

The MCP server exposes the following tools:

### 1. `code_editor_agent_init`

Initialize code-editor-agent configuration in your project.

**What it does:**
- Creates `.config/code-editor-agent.jsonc` configuration file
- Sets up `.claude/agents/code-editor/` directory structure
- Creates example rule files to get you started
- Generates initial cache

**Usage in Claude:**
> "Initialize code-editor-agent in this project"

### 2. `code_editor_agent_generate`

Generate or regenerate the rule cache file.

**When to use:**
- After adding new rule files
- After modifying existing rule files
- When rule patterns or priorities change

**What it does:**
- Scans all configured rule files
- Builds a cache file (`.claude/agents/code-editor/rules-cache-generated.json`)
- Enables fast rule lookups

**Usage in Claude:**
> "Regenerate the code-editor-agent cache"

### 3. `code_editor_agent_load`

Load relevant rules for a specific file.

**Parameters:**
- `file_path` (required): The file path to load rules for
- `agent_name` (optional): Which agent to use (defaults to the agent with `commandGroup: null`)

**What it does:**
- Finds all rules that match the file path
- Applies priority filtering
- Resolves tag references
- Returns formatted markdown with relevant context

**Usage in Claude:**
> "Load code-editor-agent rules for src/components/Button.tsx"

### 4. `code_editor_agent_list_config`

Display the CLI usage and help information.

**Usage in Claude:**
> "Show me the code-editor-agent configuration"

## Workflow Example

Here's a typical workflow using the MCP server in Claude Desktop:

1. **Initialize** (first time only):
   ```
   You: Initialize code-editor-agent in this project
   Claude: [runs code_editor_agent_init]
   ```

2. **Add your rule files** in `.claude/agents/code-editor/*.code-editor-agent.md`

3. **Generate the cache**:
   ```
   You: Regenerate the code-editor-agent cache
   Claude: [runs code_editor_agent_generate]
   ```

4. **Load rules when editing**:
   ```
   You: Load rules for src/App.tsx
   Claude: [runs code_editor_agent_load with file_path="src/App.tsx"]
   ```

## How It Works

This MCP server is a **wrapper** around the code-editor-agent CLI:

```
Claude Desktop (MCP Client)
    ↓
MCP Server (this package)
    ↓
code-editor-agent CLI (via npx/node spawn)
    ↓
Your project's rules and configuration
```

The server translates MCP tool calls into CLI commands:
- `code_editor_agent_init` → `code-editor-agent cmd init`
- `code_editor_agent_generate` → `code-editor-agent cmd generate`
- `code_editor_agent_load` → `code-editor-agent <file-path>`

## Development

### Build

```bash
npm run build
```

### Watch mode (rebuild on changes)

```bash
npm run watch
```

### Run locally

```bash
npm run mcp
```

This starts the MCP server on stdio, which is how MCP clients communicate with it.

## Troubleshooting

### Server doesn't appear in Claude Desktop

1. Check that the configuration file is in the correct location
2. Verify the paths are absolute (not relative)
3. Restart Claude Desktop completely (not just close the window)
4. Check Claude Desktop logs:
   - macOS: `~/Library/Logs/Claude/`
   - Windows: `%APPDATA%\Claude\logs\`

### "code-editor-agent not found" error

Make sure the CLI is installed:
```bash
npm install -g code-editor-agent
# OR ensure the Go binary is in your PATH
```

### Tool calls fail

1. Make sure you've run `code_editor_agent_init` in your project first
2. Check that `.config/code-editor-agent.jsonc` exists
3. Try running the CLI directly to verify it works:
   ```bash
   code-editor-agent cmd init
   ```

## Learn More

- [code-editor-agent GitHub](https://github.com/dirt-rain/code-editor-agent)
- [Model Context Protocol docs](https://modelcontextprotocol.io)
- [Claude Desktop](https://claude.ai/download)

## License

MIT
