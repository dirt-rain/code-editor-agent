#!/usr/bin/env node

/**
 * Manual test script for the MCP server
 * Sends JSON-RPC messages and verifies responses
 */

import { spawn } from 'child_process';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let messageId = 0;

function createJsonRpcRequest(method, params = {}) {
  return {
    jsonrpc: "2.0",
    id: ++messageId,
    method,
    params
  };
}

async function testMCPServer() {
  console.log("🧪 Starting MCP Server Test...\n");

  const serverPath = resolve(__dirname, 'dist/index.js');
  console.log(`📦 Server path: ${serverPath}\n`);

  const server = spawn('node', [serverPath], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let output = '';
  let responses = [];

  server.stdout.on('data', (data) => {
    output += data.toString();
    // Try to parse JSON-RPC responses
    const lines = output.split('\n');
    output = lines.pop() || '';

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response = JSON.parse(line);
          responses.push(response);
          console.log('📥 Received response:', JSON.stringify(response, null, 2));
        } catch (e) {
          console.log('📝 Non-JSON output:', line);
        }
      }
    }
  });

  server.stderr.on('data', (data) => {
    console.log('📋 Server log:', data.toString().trim());
  });

  // Wait a bit for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log("\n🔍 Test 1: Initialize request");
  const initRequest = createJsonRpcRequest('initialize', {
    protocolVersion: "2024-11-05",
    capabilities: {},
    clientInfo: {
      name: "test-client",
      version: "1.0.0"
    }
  });
  server.stdin.write(JSON.stringify(initRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("\n🔍 Test 2: List tools");
  const listToolsRequest = createJsonRpcRequest('tools/list');
  server.stdin.write(JSON.stringify(listToolsRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log("\n🔍 Test 3: Call tool (list_config)");
  const callToolRequest = createJsonRpcRequest('tools/call', {
    name: 'code_editor_agent_list_config',
    arguments: {}
  });
  server.stdin.write(JSON.stringify(callToolRequest) + '\n');
  await new Promise(resolve => setTimeout(resolve, 1000));

  console.log("\n✅ Test completed!");
  console.log(`\n📊 Total responses received: ${responses.length}`);

  server.kill();
  process.exit(0);
}

testMCPServer().catch(error => {
  console.error("❌ Test failed:", error);
  process.exit(1);
});
