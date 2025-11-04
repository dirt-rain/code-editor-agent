package config

import (
	"encoding/json"
	"fmt"

	"github.com/dirt-rain/code-editor-agent/models"
	"github.com/dirt-rain/code-editor-agent/utils"
	"github.com/tidwall/jsonc"
)

var defaultConfig = &models.Config{
	Exclude: []string{"./node_modules/**"},
	Agents: map[string]*models.AgentConfig{
		"code-editor": {
			RuleFilePattern: "**/*.code-editor-agent.md",
			CommandGroup:    nil,
		},
	},
}

// LoadConfig loads and validates the configuration file
func LoadConfig() (*models.Config, error) {
	raw, err := utils.ReadFileNoThrowOnENOENT(models.ConfigFilePath)
	if err != nil {
		return nil, err
	}

	// Return default config if file doesn't exist
	if raw == nil {
		return defaultConfig, nil
	}

	// Parse JSONC (JSON with comments and trailing commas)
	jsonBytes := jsonc.ToJSON(raw)

	var result map[string]interface{}
	if err := json.Unmarshal(jsonBytes, &result); err != nil {
		return nil, fmt.Errorf("failed to parse %s: %w", models.ConfigFilePath, err)
	}

	config := &models.Config{
		Exclude: defaultConfig.Exclude,
		Agents:  make(map[string]*models.AgentConfig),
	}

	// Parse exclude
	if excludeVal, ok := result["exclude"]; ok {
		exclude, err := utils.NormalizeToStringArray(excludeVal,
			fmt.Sprintf("`%s` 'exclude' property must be an array of strings.", models.ConfigFilePath))
		if err != nil {
			return nil, err
		}
		config.Exclude = exclude
	}

	// Parse agents
	if agentsVal, ok := result["agents"]; ok {
		agentsMap, ok := agentsVal.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("`%s` 'agents' property must be an object.", models.ConfigFilePath)
		}

		for agentName, agentVal := range agentsMap {
			agentConfigMap, ok := agentVal.(map[string]interface{})
			if !ok {
				return nil, fmt.Errorf("Agent '%s' configuration must be an object.", agentName)
			}

			// Validate ruleFilePattern
			ruleFilePattern, ok := agentConfigMap["ruleFilePattern"].(string)
			if !ok {
				return nil, fmt.Errorf("Agent '%s' must have 'ruleFilePattern' string field.", agentName)
			}

			// Validate commandGroup
			if _, hasCommandGroup := agentConfigMap["commandGroup"]; !hasCommandGroup {
				return nil, fmt.Errorf("Agent '%s' must have 'commandGroup' field (string or null).", agentName)
			}

			var commandGroup *string
			if cg := agentConfigMap["commandGroup"]; cg != nil {
				cgStr, ok := cg.(string)
				if !ok {
					return nil, fmt.Errorf("Agent '%s' 'commandGroup' must be string or null.", agentName)
				}
				commandGroup = &cgStr
			}

			// Parse references
			var references []string
			if refsVal, ok := agentConfigMap["references"]; ok {
				refs, err := utils.NormalizeToStringArray(refsVal,
					fmt.Sprintf("Agent '%s' 'references' must be an array of strings.", agentName))
				if err != nil {
					return nil, err
				}
				references = refs
			}

			config.Agents[agentName] = &models.AgentConfig{
				RuleFilePattern: ruleFilePattern,
				CommandGroup:    commandGroup,
				References:      references,
			}
		}
	}

	// If no agents defined, use default
	if len(config.Agents) == 0 {
		config.Agents = defaultConfig.Agents
	}

	return config, nil
}
