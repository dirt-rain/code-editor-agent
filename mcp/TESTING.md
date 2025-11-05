# Testing the MCP Server

This guide covers multiple ways to test the code-editor-agent MCP server.

## Method 1: Quick Startup Test ✅

Verify the server starts without errors:

```bash
cd /home/mjy/workspace/dirt-rain/code-editor-agent/mcp
node dist/index.js
```

You should see:
```
Code Editor Agent MCP Server running on stdio
Wrapping code-editor-agent CLI commands as MCP tools
```

Press Ctrl+C to stop. If you see these messages, the server is working!

## Method 2: MCP Inspector (Recommended) 🔍

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is an official tool that provides a web UI for testing MCP servers.

### Setup and Run

```bash
cd /home/mjy/workspace/dirt-rain/code-editor-agent/mcp
npx @modelcontextprotocol/inspector node dist/index.js
```

### What it does:
1. Starts your MCP server
2. Opens a web browser with an interactive UI
3. Shows all available tools
4. Lets you test each tool with custom inputs
5. Displays server logs and responses in real-time

### Quick test script

```bash
cd /home/mjy/workspace/dirt-rain/code-editor-agent/mcp
chmod +x test-with-inspector.sh
./test-with-inspector.sh
```

## Method 3: Manual JSON-RPC Testing 🧪

Test the server programmatically by sending JSON-RPC messages:

```bash
cd /home/mjy/workspace/dirt-rain/code-editor-agent/mcp
node test-manual.js
```

This script:
- Spawns the MCP server
- Sends initialization request
- Lists available tools
- Calls a test tool
- Displays all responses

## Method 4: Test with Claude Desktop 🖥️

The ultimate test is using it with Claude Desktop.

### Setup

1. **Build the server:**
   ```bash
   cd /home/mjy/workspace/dirt-rain/code-editor-agent/mcp
   npm run build
   ```

2. **Find your config file:**
   - **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

3. **Add server configuration:**
   ```json
   {
     "mcpServers": {
       "code-editor-agent": {
         "command": "node",
         "args": ["/home/mjy/workspace/dirt-rain/code-editor-agent/mcp/dist/index.js"]
       }
     }
   }
   ```

   **Note:** Use the ABSOLUTE path (not relative like `~/`)

4. **Restart Claude Desktop completely** (quit and reopen, not just close window)

### Verify it's working

1. **Check for the hammer icon:** Look for the tools icon in Claude Desktop's interface
2. **Try a command:** Ask Claude something like:
   ```
   Can you show me what code-editor-agent tools are available?
   ```

3. **Test each tool:**
   ```
   Initialize code-editor-agent in this project
   ```

   ```
   Generate the code-editor-agent cache
   ```

### View logs

If something doesn't work, check Claude Desktop logs:

- **macOS:** `~/Library/Logs/Claude/`
- **Windows:** `%APPDATA%\Claude\logs\`

Look for errors related to "code-editor-agent"

## Method 5: Integration Test (with real project)

Test the full workflow:

1. **Create a test project:**
   ```bash
   mkdir -p /tmp/mcp-test-project
   cd /tmp/mcp-test-project
   ```

2. **Test via MCP Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector node /home/mjy/workspace/dirt-rain/code-editor-agent/mcp/dist/index.js
   ```

3. **In the Inspector UI, test this workflow:**

   a. **Call `code_editor_agent_init`** (no arguments)
      - Should create `.config/code-editor-agent.jsonc`
      - Should create `.claude/agents/code-editor/` directory
      - Should create example files

   b. **Call `code_editor_agent_generate`** (no arguments)
      - Should generate cache file
      - Should show success message

   c. **Call `code_editor_agent_load`** with:
      ```json
      {
        "file_path": "example.ts"
      }
      ```
      - Should return rules or "No rules found"

   d. **Call `code_editor_agent_list_config`** (no arguments)
      - Should show CLI usage/help

## Troubleshooting

### Server won't start
- Check Node.js version: `node --version` (needs 18+)
- Rebuild: `npm run build`
- Check for TypeScript errors in the build output

### Tools don't appear in Claude Desktop
- Verify absolute path in config (not `~/` or `./`)
- Restart Claude Desktop completely
- Check Claude Desktop logs for connection errors
- Ensure `code-editor-agent` CLI is installed: `npm install -g code-editor-agent`

### "code-editor-agent not found" error
The MCP server wraps the CLI, so you need the CLI installed:
```bash
npm install -g code-editor-agent
# OR
go install github.com/dirt-rain/code-editor-agent/go@latest
```

### Tools fail when called
- Make sure you're in a project directory (not `/`)
- For `load` tool, run `init` first to create configuration
- For `load` tool, run `generate` after `init` to create cache
- Check that `.config/code-editor-agent.jsonc` exists

## Expected Behavior

### ✅ Success indicators:
- Server starts with log messages on stderr
- Inspector shows 4 tools
- `init` creates config files
- `generate` creates cache file
- `load` returns rules or "No rules found"
- No error messages in logs

### ❌ Common issues:
- Server crashes on startup → Check dependencies
- No tools in Claude Desktop → Check config path
- Tools fail → Check CLI is installed
- Empty responses → Check you're in a project directory

## Next Steps

After successful testing:
1. Use it in a real project
2. Create custom rule files
3. Test with different file types
4. Try multi-agent configurations
5. Share feedback!
