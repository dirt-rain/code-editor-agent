package models

// RuleCacheEntry represents a single rule in the cache
type RuleCacheEntry struct {
	Patterns         interface{} `json:"patterns"`         // string or []string
	Path             string      `json:"path"`
	IgnorePatterns   []string    `json:"ignorePatterns"`
	Priority         *int        `json:"priority,omitempty"`
	Tags             []string    `json:"tags"`
	ReferencesIfTop  []string    `json:"referencesIfTop"`
	ReferencesAlways []string    `json:"referencesAlways"`
	Order            *int        `json:"order,omitempty"`
}

// RuleWithDepth extends RuleCacheEntry with agent depth tracking
type RuleWithDepth struct {
	RuleCacheEntry
	AgentDepth int
}

// GetPatterns returns patterns as a string slice
func (r *RuleCacheEntry) GetPatterns() []string {
	switch v := r.Patterns.(type) {
	case string:
		return []string{v}
	case []interface{}:
		result := make([]string, len(v))
		for i, p := range v {
			result[i] = p.(string)
		}
		return result
	case []string:
		return v
	default:
		return []string{}
	}
}

// AgentConfig represents configuration for a single agent
type AgentConfig struct {
	RuleFilePattern string   `json:"ruleFilePattern"`
	CommandGroup    *string  `json:"commandGroup"` // nullable string
	References      []string `json:"references,omitempty"`
}

// Config represents the main configuration file
type Config struct {
	Exclude []string                `json:"exclude"`
	Agents  map[string]*AgentConfig `json:"agents"`
}

const (
	ConfigFilePath    = ".config/code-editor-agent.jsonc"
	RuleCacheFilePath = ".claude/agents/code-editor/rules-cache-generated.json"
)
