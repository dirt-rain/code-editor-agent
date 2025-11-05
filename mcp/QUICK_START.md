# MCP Server - Quick Start

## One-Time Setup

```bash
cd mcp
npm install
npm run build
```

## Testing (When You're Ready)

### Option 1: Quick Check (30 seconds)
```bash
npm run test:start
```
Press Ctrl+C to stop. Should see startup messages.

### Option 2: Interactive Testing (5 minutes) ⭐ Recommended
```bash
npm run test:inspector
```
Opens web UI to test all tools interactively.

### Option 3: Manual Test
```bash
npm run test:manual
```
Runs automated JSON-RPC tests.

## Claude Desktop Setup

1. **Edit config file:**
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%\Claude\claude_desktop_config.json`

2. **Add server:**
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
   **Use absolute path!**

3. **Restart Claude Desktop** (quit app completely)

## Available Tools

- `code_editor_agent_init` - Initialize config
- `code_editor_agent_generate` - Generate cache
- `code_editor_agent_load` - Load rules for a file
- `code_editor_agent_list_config` - Show config

## Troubleshooting

**"code-editor-agent not found"?**
```bash
npm install -g code-editor-agent
```

**Tools don't appear in Claude Desktop?**
- Check absolute path in config
- Restart Claude Desktop completely
- Check logs: `~/Library/Logs/Claude/` (macOS)

## Detailed Guides

- [TEST_LATER.md](TEST_LATER.md) - Step-by-step testing checklist
- [TESTING.md](TESTING.md) - Comprehensive testing guide
- [README.md](README.md) - Full documentation

---

**TL;DR for later:**
```bash
npm run test:inspector  # Opens web UI to test everything
```
