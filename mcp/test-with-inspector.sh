#!/bin/bash
# Test the MCP server using the official MCP Inspector
# See: https://github.com/modelcontextprotocol/inspector

echo "Setting up MCP Inspector test..."
echo ""
echo "1. Install MCP Inspector globally:"
echo "   npx @modelcontextprotocol/inspector node $(pwd)/dist/index.js"
echo ""
echo "2. This will:"
echo "   - Start your MCP server"
echo "   - Open a web UI where you can:"
echo "     * See all available tools"
echo "     * Test each tool with different inputs"
echo "     * View server logs"
echo "     * Inspect responses"
echo ""
echo "Press Enter to launch the inspector..."
read

npx @modelcontextprotocol/inspector node "$(pwd)/dist/index.js"
