import { JSONParseNothrow } from "./utils/JSONParseNothrow";
import { readFileNothrowOnENOENT } from "./utils/readFileNothrowOnENOENT";

export interface Config {
  exclude: string[];
}

export const CONFIG_FILE_PATH = ".config/code-editor-agent.json";

export const DEFAULT_CONFIG: Config = {
  exclude: ["./node_modules/**"],
};

// strict, no fallback unless no config file found
export async function loadConfig(): Promise<Config> {
  const raw = await readFileNothrowOnENOENT(CONFIG_FILE_PATH);
  if (raw === null) {
    return DEFAULT_CONFIG;
  }
  const json = JSONParseNothrow(raw);
  if (json === undefined) {
    throw new Error(
      "Failed to parse `.config/code-editor-agent.json`. Review and fix it."
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
        "`.config/code-editor-agent.json` 'exclude' property must be an array of strings."
      );
    }
    result.exclude = json.exclude;
  }

  return result as Config;
}
