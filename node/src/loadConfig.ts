import * as jsonc from "jsonc-parser";
import { readFileNothrowOnENOENT } from "./utils/readFileNothrowOnENOENT";

export interface AgentConfig {
  ruleFilePattern: string;
  commandGroup: string | null;
  references?: string[];
}

export interface Config {
  exclude: string[];
  agents: Record<string, AgentConfig>;
}

export const CONFIG_FILE_PATH = ".config/code-editor-agent.jsonc";

export const DEFAULT_RAW_CONFIG = {
  exclude: ["./node_modules/**"],
};

const defaultConfig: Config = {
  ...DEFAULT_RAW_CONFIG,
  agents: {
    "code-editor": {
      ruleFilePattern: "**/*.code-editor-agent.md",
      commandGroup: null,
    },
  },
};

// strict, no fallback unless no config file found
export async function loadConfig(): Promise<Config> {
  const raw = await readFileNothrowOnENOENT(CONFIG_FILE_PATH);
  if (raw === null) {
    return defaultConfig;
  }

  const errors: jsonc.ParseError[] = [];
  const json = jsonc.parse(raw, errors, { allowTrailingComma: true });

  if (errors.length > 0) {
    throw new Error(
      `Failed to parse .config/code-editor-agent.jsonc: ${errors
        .map((e) => jsonc.printParseErrorCode(e.error))
        .join(", ")}`
    );
  }

  const result: Partial<Config> = {};

  // exclude
  if ("exclude" in json) {
    if (
      !Array.isArray(json.exclude) ||
      json.exclude.some((item: unknown) => typeof item !== "string")
    ) {
      throw new Error(
        "`.config/code-editor-agent.jsonc` 'exclude' property must be an array of strings."
      );
    }
    result.exclude = json.exclude;
  }

  // agents
  if ("agents" in json) {
    if (
      typeof json.agents !== "object" ||
      json.agents === null ||
      Array.isArray(json.agents)
    ) {
      throw new Error(
        "`.config/code-editor-agent.jsonc` 'agents' property must be an object."
      );
    }

    const agents: Record<string, AgentConfig> = {};
    for (const [agentName, agentConfig] of Object.entries(json.agents)) {
      if (typeof agentConfig !== "object" || agentConfig === null) {
        throw new Error(
          `Agent '${agentName}' configuration must be an object.`
        );
      }

      const config = agentConfig as any;

      // Validate required fields
      if (typeof config.ruleFilePattern !== "string") {
        throw new Error(
          `Agent '${agentName}' must have 'ruleFilePattern' string field.`
        );
      }
      if (!("commandGroup" in config)) {
        throw new Error(
          `Agent '${agentName}' must have 'commandGroup' field (string or null).`
        );
      }
      if (
        config.commandGroup !== null &&
        typeof config.commandGroup !== "string"
      ) {
        throw new Error(
          `Agent '${agentName}' 'commandGroup' must be string or null.`
        );
      }

      // Validate references
      if ("references" in config) {
        if (
          !Array.isArray(config.references) ||
          config.references.some((r: unknown) => typeof r !== "string")
        ) {
          throw new Error(
            `Agent '${agentName}' 'references' must be an array of strings.`
          );
        }
      }

      agents[agentName] = {
        ruleFilePattern: config.ruleFilePattern,
        commandGroup: config.commandGroup,
        references: config.references,
      };
    }
    result.agents = agents;
  }

  return {
    exclude: result.exclude ?? defaultConfig.exclude,
    agents: result.agents ?? defaultConfig.agents,
  };
}
