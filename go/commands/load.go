package commands

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"sort"
	"strings"

	"github.com/bmatcuk/doublestar/v4"
	"github.com/dirt-rain/code-editor-agent/config"
	"github.com/dirt-rain/code-editor-agent/models"
)

// Load loads and prints relevant rules for a given file path
func Load(agentName, filePath string) error {
	cfg, err := config.LoadConfig()
	if err != nil {
		return err
	}

	agentConfig, ok := cfg.Agents[agentName]
	if !ok {
		return fmt.Errorf("Agent '%s' not found in configuration.", agentName)
	}

	// Load unified cache file
	cacheContent, err := os.ReadFile(models.RuleCacheFilePath)
	if err != nil {
		return fmt.Errorf("failed to read cache file: %w", err)
	}

	var allAgentRules map[string][]models.RuleCacheEntry
	if err := json.Unmarshal(cacheContent, &allAgentRules); err != nil {
		return fmt.Errorf("failed to parse cache file: %w", err)
	}

	// Collect all agents to load (current + references)
	agentsToLoad := []string{agentName}
	if agentConfig.References != nil {
		agentsToLoad = append(agentsToLoad, agentConfig.References...)
	}

	// Load rules from all specified agents with depth tracking
	allRules := []models.RuleWithDepth{}
	for i, agent := range agentsToLoad {
		if rules, ok := allAgentRules[agent]; ok {
			for _, rule := range rules {
				allRules = append(allRules, models.RuleWithDepth{
					RuleCacheEntry: rule,
					AgentDepth:     i,
				})
			}
		} else {
			fmt.Fprintf(os.Stderr, "Warning: No rules found for agent '%s' in cache\n", agent)
		}
	}

	// Build a tag map for quick lookup
	tagMap := make(map[string][]models.RuleWithDepth)
	for _, rule := range allRules {
		for _, tag := range rule.Tags {
			tagMap[tag] = append(tagMap[tag], rule)
		}
	}

	// Find top-level rules that match the file path
	topLevelRules := []models.RuleWithDepth{}
	for _, rule := range allRules {
		patterns := rule.GetPatterns()
		ignorePatterns := rule.IgnorePatterns

		matchesPattern := false
		for _, pattern := range patterns {
			matched, _ := doublestar.Match(pattern, filePath)
			if matched {
				matchesPattern = true
				break
			}
		}

		matchesIgnore := false
		for _, pattern := range ignorePatterns {
			matched, _ := doublestar.Match(pattern, filePath)
			if matched {
				matchesIgnore = true
				break
			}
		}

		if matchesPattern && !matchesIgnore {
			topLevelRules = append(topLevelRules, rule)
		}
	}

	// Collect all rules to load (including referenced rules)
	rulesToLoad := make(map[*models.RuleWithDepth]bool)
	var processRule func(rule models.RuleWithDepth, isTopLevel bool)
	processRule = func(rule models.RuleWithDepth, isTopLevel bool) {
		// Check if already processed
		for r := range rulesToLoad {
			if r.Path == rule.Path && r.AgentDepth == rule.AgentDepth {
				return
			}
		}
		ruleCopy := rule
		rulesToLoad[&ruleCopy] = true

		// Add referencesAlways
		for _, tag := range rule.ReferencesAlways {
			if referencedRules, ok := tagMap[tag]; ok {
				for _, referencedRule := range referencedRules {
					processRule(referencedRule, false)
				}
			}
		}

		// Add referencesIfTop only if this is a top-level rule
		if isTopLevel {
			for _, tag := range rule.ReferencesIfTop {
				if referencedRules, ok := tagMap[tag]; ok {
					for _, referencedRule := range referencedRules {
						processRule(referencedRule, false)
					}
				}
			}
		}
	}

	for _, rule := range topLevelRules {
		processRule(rule, true)
	}

	if len(rulesToLoad) == 0 {
		fmt.Printf("No additional context found for %s. Continue.\n", filePath)
		return nil
	}

	// Convert map to slice
	candidateRules := make([]models.RuleWithDepth, 0, len(rulesToLoad))
	for rule := range rulesToLoad {
		candidateRules = append(candidateRules, *rule)
	}

	// Sort by [priority ASC, order DESC, agentDepth ASC, filePath ASC] for priority filtering
	sort.Slice(candidateRules, func(i, j int) bool {
		priorityA := math.MaxInt32
		priorityB := math.MaxInt32
		if candidateRules[i].Priority != nil {
			priorityA = *candidateRules[i].Priority
		}
		if candidateRules[j].Priority != nil {
			priorityB = *candidateRules[j].Priority
		}
		if priorityA != priorityB {
			return priorityA < priorityB
		}

		orderA := math.MaxInt32
		orderB := math.MaxInt32
		if candidateRules[i].Order != nil {
			orderA = *candidateRules[i].Order
		}
		if candidateRules[j].Order != nil {
			orderB = *candidateRules[j].Order
		}
		if orderA != orderB {
			return orderA > orderB // DESC: higher order gets filtered out first
		}

		if candidateRules[i].AgentDepth != candidateRules[j].AgentDepth {
			return candidateRules[i].AgentDepth < candidateRules[j].AgentDepth // ASC
		}

		return candidateRules[i].Path < candidateRules[j].Path
	})

	// Apply priority filtering
	finalRules := []models.RuleWithDepth{}
	totalRulesToPrint := len(candidateRules)

	for _, rule := range candidateRules {
		priority := math.MaxInt32
		if rule.Priority != nil {
			priority = *rule.Priority
		}
		if totalRulesToPrint > priority {
			// Skip this rule and decrement the count
			totalRulesToPrint--
		} else {
			// Include this rule
			finalRules = append(finalRules, rule)
		}
	}

	// Sort final rules by [order ASC, agentDepth ASC, filePath ASC] for output
	sort.Slice(finalRules, func(i, j int) bool {
		orderA := math.MaxInt32
		orderB := math.MaxInt32
		if finalRules[i].Order != nil {
			orderA = *finalRules[i].Order
		}
		if finalRules[j].Order != nil {
			orderB = *finalRules[j].Order
		}
		if orderA != orderB {
			return orderA < orderB
		}

		if finalRules[i].AgentDepth != finalRules[j].AgentDepth {
			return finalRules[i].AgentDepth < finalRules[j].AgentDepth
		}

		return finalRules[i].Path < finalRules[j].Path
	})

	// Print rules (body only, without front matter)
	for _, rule := range finalRules {
		body, err := extractBody(rule.Path)
		if err != nil {
			return fmt.Errorf("failed to read rule file %s: %w", rule.Path, err)
		}
		fmt.Println(body)
	}

	fmt.Printf("* * *\n\nEnd of additional context for %s. Continue.\n", filePath)
	return nil
}

// extractBody extracts the body (content after front matter) from a file
func extractBody(filePath string) (string, error) {
	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", err
	}

	contentStr := string(content)
	if len(contentStr) < 8 || contentStr[0:3] != "---" {
		return contentStr, nil
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
		return contentStr, nil
	}

	// Return content after the closing delimiter
	body := contentStr[endIdx+3:]
	return strings.TrimLeft(body, "\n"), nil
}
