# Quick Testing Guide - For Later

When you have time to test the MCP server, follow these steps in order.

## Prerequisites

Make sure you have:
- [ ] Node.js 18+ installed (`node --version`)
- [ ] `code-editor-agent` CLI installed (`npm install -g code-editor-agent` or Go binary)
- [ ] Built the MCP server (`cd mcp && npm run build`)

## Quick Test Checklist

### ✅ Test 1: Server Starts (30 seconds)

```bash
cd /home/mjy/workspace/dirt-rain/code-editor-agent/mcp
node dist/index.js
```

**Expected output:**
```
Code Editor Agent MCP Server running on stdio
Wrapping code-editor-agent CLI commands as MCP tools
```

Press `Ctrl+C` to stop.

**✅ Pass** if you see the messages above.
**❌ Fail** if you see errors about missing modules.

---

### ✅ Test 2: Interactive Testing with MCP Inspector (5 minutes)

This is the **easiest and most visual** way to test all features.

```bash
cd /home/mjy/workspace/dirt-rain/code-editor-agent/mcp
npx @modelcontextprotocol/inspector node dist/index.js
```

This will:
1. Start the MCP server
2. Open a web browser with a testing UI
3. Show all available tools

**In the web UI, test each tool:**

1. **Click "code_editor_agent_list_config"** → Should show CLI usage
2. **Click "code_editor_agent_init"** → Should show initialization output
3. **Click "code_editor_agent_generate"** → Should generate cache
4. **Click "code_editor_agent_load"** with `{"file_path": "test.ts"}` → Should return rules or "No rules found"

**✅ Pass** if all tools respond without errors.
**❌ Fail** if tools show "code-editor-agent not found" (install CLI first).

---

### ✅ Test 3: Claude Desktop Integration (10 minutes)

**Only do this if Tests 1 & 2 passed!**

#### Step 1: Configure Claude Desktop

Find your config file:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

Add this (use **absolute path**, not `~/`):

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

#### Step 2: Restart Claude Desktop

**Important:** Quit Claude Desktop completely (not just close window), then reopen.

#### Step 3: Verify

In Claude Desktop, look for:
- A tools/hammer icon in the interface
- Type: "What code-editor-agent tools are available?"

#### Step 4: Test a Tool

Ask Claude:
```
Can you run code_editor_agent_list_config?
```

**✅ Pass** if Claude calls the tool and shows results.
**❌ Fail** if tools don't appear → Check logs below.

---

## Troubleshooting

### Issue: "code-editor-agent not found"

**Fix:** Install the CLI first:
```bash
npm install -g code-editor-agent
```

### Issue: Tools don't appear in Claude Desktop

**Check:**
1. Config file has **absolute path** (not `~/` or `./`)
2. You restarted Claude Desktop **completely** (quit app, not just close window)
3. Check Claude Desktop logs:
   - **macOS:** `~/Library/Logs/Claude/`
   - **Windows:** `%APPDATA%\Claude\logs\`

### Issue: Server crashes on startup

**Fix:** Rebuild:
```bash
cd mcp
rm -rf node_modules dist
npm install
npm run build
```

---

## Full Workflow Test

Once everything works, test the full workflow:

1. **Create a test directory:**
   ```bash
   mkdir -p /tmp/mcp-test
   cd /tmp/mcp-test
   ```

2. **In Claude Desktop, ask:**
   ```
   Initialize code-editor-agent in this directory
   ```

3. **Verify files were created:**
   ```bash
   ls -la .config/
   ls -la .claude/agents/code-editor/
   ```

4. **Ask Claude to generate cache:**
   ```
   Generate the code-editor-agent cache
   ```

5. **Test loading rules:**
   ```
   Load code-editor-agent rules for example.ts
   ```

**✅ Pass** if all steps complete without errors.

---

## Summary

- **Test 1** verifies server starts
- **Test 2** (Inspector) lets you test all tools interactively
- **Test 3** (Claude Desktop) tests real-world integration

**Start with Test 1, then Test 2.** Only do Test 3 if the first two pass.

## More Details

For comprehensive testing guide, see [TESTING.md](TESTING.md)

---

## Quick Commands Reference

```bash
# Build
cd mcp && npm run build

# Test startup
node mcp/dist/index.js

# Test with Inspector
cd mcp && npx @modelcontextprotocol/inspector node dist/index.js

# Rebuild from scratch
cd mcp && rm -rf node_modules dist && npm install && npm run build
```

Good luck! 🚀
