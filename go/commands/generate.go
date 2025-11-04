package commands

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"

	"github.com/bmatcuk/doublestar/v4"
	"github.com/dirt-rain/code-editor-agent/config"
	"github.com/dirt-rain/code-editor-agent/models"
	"github.com/dirt-rain/code-editor-agent/utils"
	"gopkg.in/yaml.v3"
)

// FrontMatter represents the YAML front matter in rule files
type FrontMatter struct {
	Patterns         interface{} `yaml:"patterns"`
	IgnorePatterns   interface{} `yaml:"ignorePatterns"`
	Priority         *int        `yaml:"priority"`
	Tags             interface{} `yaml:"tags"`
	ReferencesIfTop  interface{} `yaml:"referencesIfTop"`
	ReferencesAlways interface{} `yaml:"referencesAlways"`
	Order            *int        `yaml:"order"`
}

// Generate scans rule files and builds the cache
func Generate(force bool) error {
	if !utils.FileExists(models.RuleCacheFilePath) && !force {
		return fmt.Errorf("Very likely current working directory is not the root of the project, or `code-editor-agent cmd init` not yet runned.")
	}

	cfg, err := config.LoadConfig()
	if err != nil {
		return err
	}

	// Validate commandGroup uniqueness and reserved names
	commandGroupsSeen := make(map[string]bool)
	for agentName, agentConfig := range cfg.Agents {
		commandGroup := agentConfig.CommandGroup

		// Check for reserved commandGroup name
		if commandGroup != nil && *commandGroup == "cmd" {
			return fmt.Errorf("Agent '%s' cannot use reserved commandGroup 'cmd'. Please choose a different commandGroup.", agentName)
		}

		// Check for duplicate commandGroups
		// Use string representation for comparison
		key := "null"
		if commandGroup != nil {
			key = *commandGroup
		}

		if commandGroupsSeen[key] {
			groupName := "null"
			if commandGroup != nil {
				groupName = fmt.Sprintf("'%s'", *commandGroup)
			}
			return fmt.Errorf("Multiple agents have the same commandGroup: %s. Each agent must have a unique commandGroup.", groupName)
		}
		commandGroupsSeen[key] = true
	}

	// Single cache structure: { agentName: RuleCacheEntry[] }
	allAgentRules := make(map[string][]models.RuleCacheEntry)

	// Generate cache for each agent
	for agentName, agentConfig := range cfg.Agents {
		fmt.Printf("Scanning rules for agent: %s\n", agentName)

		result := []models.RuleCacheEntry{}

		// Find all rule files matching the pattern
		ruleFiles, err := findFiles(agentConfig.RuleFilePattern, cfg.Exclude)
		if err != nil {
			return fmt.Errorf("failed to find rule files for agent '%s': %w", agentName, err)
		}

		for _, ruleFile := range ruleFiles {
			content, err := os.ReadFile(ruleFile)
			if err != nil {
				return fmt.Errorf("failed to read rule file %s: %w", ruleFile, err)
			}

			// Parse front matter
			fm, err := parseFrontMatter(content)
			if err != nil {
				return fmt.Errorf("failed to parse front matter in %s: %w", ruleFile, err)
			}

			if fm.Patterns == nil {
				return fmt.Errorf("Rule file %s is missing 'patterns' attribute.", ruleFile)
			}

			// Validate priority
			if fm.Priority != nil && *fm.Priority < 0 {
				return fmt.Errorf("Rule file %s: 'priority' must be a non-negative number.", ruleFile)
			}

			// Validate order
			if fm.Order != nil && *fm.Order < 0 {
				return fmt.Errorf("Rule file %s: 'order' must be a non-negative number.", ruleFile)
			}

			ignorePatterns, err := utils.NormalizeToStringArray(fm.IgnorePatterns,
				fmt.Sprintf("Rule file %s: 'ignorePatterns' must be a string or array of strings.", ruleFile))
			if err != nil {
				return err
			}

			tags, err := utils.NormalizeToStringArray(fm.Tags,
				fmt.Sprintf("Rule file %s: 'tags' must be a string or array of strings.", ruleFile))
			if err != nil {
				return err
			}

			referencesIfTop, err := utils.NormalizeToStringArray(fm.ReferencesIfTop,
				fmt.Sprintf("Rule file %s: 'referencesIfTop' must be a string or array of strings.", ruleFile))
			if err != nil {
				return err
			}

			referencesAlways, err := utils.NormalizeToStringArray(fm.ReferencesAlways,
				fmt.Sprintf("Rule file %s: 'referencesAlways' must be a string or array of strings.", ruleFile))
			if err != nil {
				return err
			}

			rule := models.RuleCacheEntry{
				Patterns:         fm.Patterns,
				Path:             ruleFile,
				IgnorePatterns:   ignorePatterns,
				Priority:         fm.Priority,
				Tags:             tags,
				ReferencesIfTop:  referencesIfTop,
				ReferencesAlways: referencesAlways,
				Order:            fm.Order,
			}
			result = append(result, rule)
		}

		// Sort to prevent confusing git diffs
		sort.Slice(result, func(i, j int) bool {
			return result[i].Path < result[j].Path
		})

		allAgentRules[agentName] = result
		fmt.Printf("Found %d rules for %s\n", len(result), agentName)
	}

	// Write single unified cache file
	cacheDir := filepath.Dir(models.RuleCacheFilePath)
	if err := os.MkdirAll(cacheDir, 0755); err != nil {
		return fmt.Errorf("failed to create cache directory: %w", err)
	}

	cacheJSON, err := json.MarshalIndent(allAgentRules, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal cache: %w", err)
	}

	if err := os.WriteFile(models.RuleCacheFilePath, append(cacheJSON, '\n'), 0644); err != nil {
		return fmt.Errorf("failed to write cache file: %w", err)
	}

	fmt.Printf("\nGenerated unified cache file: %s\n", models.RuleCacheFilePath)
	return nil
}

// findFiles finds all files matching the pattern, excluding patterns in exclude
func findFiles(pattern string, exclude []string) ([]string, error) {
	fsys := os.DirFS(".")
	matches, err := doublestar.Glob(fsys, pattern)
	if err != nil {
		return nil, err
	}

	// Filter out excluded patterns
	result := []string{}
	for _, match := range matches {
		excluded := false
		for _, excludePattern := range exclude {
			// Remove leading ./ from exclude pattern
			cleanPattern := excludePattern
			if len(cleanPattern) > 2 && cleanPattern[0:2] == "./" {
				cleanPattern = cleanPattern[2:]
			}
			matched, _ := doublestar.Match(cleanPattern, match)
			if matched {
				excluded = true
				break
			}
		}
		if !excluded {
			result = append(result, match)
		}
	}

	return result, nil
}

// parseFrontMatter extracts YAML front matter from markdown content
func parseFrontMatter(content []byte) (*FrontMatter, error) {
	// Look for front matter delimiters (---)
	contentStr := string(content)
	if len(contentStr) < 8 || contentStr[0:3] != "---" {
		return nil, fmt.Errorf("front matter not found")
	}

	// Find the closing ---
	endIdx := -1
	for i := 3; i < len(contentStr)-3; i++ {
		if contentStr[i:i+3] == "---" && (i == 3 || contentStr[i-1] == '\n') {
			endIdx = i
			break
		}
	}

	if endIdx == -1 {
		return nil, fmt.Errorf("front matter closing delimiter not found")
	}

	// Extract YAML content
	yamlContent := contentStr[3:endIdx]

	var fm FrontMatter
	if err := yaml.Unmarshal([]byte(yamlContent), &fm); err != nil {
		return nil, fmt.Errorf("failed to parse YAML: %w", err)
	}

	return &fm, nil
}
