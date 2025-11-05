#!/usr/bin/env node

/**
 * MCP Server wrapper for code-editor-agent
 *
 * This server exposes the code-editor-agent CLI functionality as MCP tools,
 * allowing Claude Desktop and other MCP clients to use it.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { z } from "zod";

// Schemas for tool inputs
const InitSchema = z.object({});

const GenerateSchema = z.object({});

const LoadSchema = z.object({
  agent_name: z.string().optional().describe("The agent name to use (optional - if not provided, uses the agent with commandGroup: null)"),
  file_path: z.string().describe("The file path to load rules for (relative to the project root)"),
});

const ListAgentsSchema = z.object({});

// Tool definitions
const TOOLS: Tool[] = [
  {
    name: "code_editor_agent_init",
    description: "Initialize code-editor-agent configuration, creating .config/code-editor-agent.jsonc, example rule files, and cache directory structure",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "code_editor_agent_generate",
    description: "Generate/regenerate the rule cache file by scanning all configured rule files. This should be run after adding or modifying rule files.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "code_editor_agent_load",
    description: "Load relevant context rules for a specific file. Returns markdown-formatted rules that apply to the given file path based on pattern matching, priorities, and tags.",
    inputSchema: {
      type: "object",
      properties: {
        agent_name: {
          type: "string",
          description: "The agent name to use (optional - if not provided, uses the agent with commandGroup: null)",
        },
        file_path: {
          type: "string",
          description: "The file path to load rules for (relative to the project root)",
        },
      },
      required: ["file_path"],
    },
  },
  {
    name: "code_editor_agent_list_config",
    description: "Show the current configuration by running 'code-editor-agent cmd init' to display agents and their settings",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// Helper function to execute CLI command
function executeCLI(args: string[]): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    // Try to use npx to run code-editor-agent from the installed package
    const child = spawn("npx", ["code-editor-agent", ...args], {
      cwd: process.cwd(),
      env: process.env,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({ stdout, stderr, exitCode: code || 0 });
    });

    child.on("error", (error) => {
      resolve({
        stdout: "",
        stderr: `Failed to execute command: ${error.message}`,
        exitCode: 1
      });
    });
  });
}

// Create server instance
const server = new Server(
  {
    name: "code-editor-agent",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "code_editor_agent_init": {
        const result = await executeCLI(["cmd", "init"]);

        if (result.exitCode !== 0) {
          return {
            content: [
              {
                type: "text",
                text: `Error initializing:\n${result.stderr || result.stdout}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Initialization complete!\n\n${result.stdout}${result.stderr ? "\n" + result.stderr : ""}`,
            },
          ],
        };
      }

      case "code_editor_agent_generate": {
        const result = await executeCLI(["cmd", "generate"]);

        if (result.exitCode !== 0) {
          return {
            content: [
              {
                type: "text",
                text: `Error generating cache:\n${result.stderr || result.stdout}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: `Cache generation complete!\n\n${result.stdout}${result.stderr ? "\n" + result.stderr : ""}`,
            },
          ],
        };
      }

      case "code_editor_agent_load": {
        const input = LoadSchema.parse(args);

        const cliArgs: string[] = [];
        if (input.agent_name) {
          cliArgs.push(input.agent_name, input.file_path);
        } else {
          cliArgs.push(input.file_path);
        }

        const result = await executeCLI(cliArgs);

        if (result.exitCode !== 0) {
          return {
            content: [
              {
                type: "text",
                text: `Error loading rules:\n${result.stderr || result.stdout}`,
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: "text",
              text: result.stdout || "No rules found for this file.",
            },
          ],
        };
      }

      case "code_editor_agent_list_config": {
        // Show help/usage which includes configuration info
        const result = await executeCLI([]);

        return {
          content: [
            {
              type: "text",
              text: `Code Editor Agent CLI Usage:\n\n${result.stdout}${result.stderr}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (not stdout, which is used for JSON-RPC)
  console.error("Code Editor Agent MCP Server running on stdio");
  console.error("Wrapping code-editor-agent CLI commands as MCP tools");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
