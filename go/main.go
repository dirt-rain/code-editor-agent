package main

import (
	"fmt"
	"os"

	"github.com/dirt-rain/code-editor-agent/commands"
	"github.com/dirt-rain/code-editor-agent/config"
)

// Version information (set via ldflags during build)
var (
	version = "dev"
	commit  = "unknown"
	date    = "unknown"
)

func findAgentByCommandGroup(group *string) (string, error) {
	cfg, err := config.LoadConfig()
	if err != nil {
		return "", err
	}

	for agentName, agentConfig := range cfg.Agents {
		// Compare nullable strings
		if group == nil && agentConfig.CommandGroup == nil {
			return agentName, nil
		}
		if group != nil && agentConfig.CommandGroup != nil && *group == *agentConfig.CommandGroup {
			return agentName, nil
		}
	}

	if group == nil {
		return "", fmt.Errorf("No agent found with commandGroup: null")
	}
	return "", fmt.Errorf("No agent found with commandGroup: %s", *group)
}

func main() {
	args := os.Args[1:]

	// Handle version flag
	if len(args) == 1 && (args[0] == "--version" || args[0] == "-v") {
		fmt.Printf("code-editor-agent version %s (commit: %s, built: %s)\n", version, commit, date)
		return
	}

	if len(args) == 1 {
		// code-editor-agent <file-path>
		// Find agent with commandGroup: null
		agentName, err := findAgentByCommandGroup(nil)
		if err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
		if err := commands.Load(agentName, args[0]); err != nil {
			fmt.Fprintln(os.Stderr, err)
			os.Exit(1)
		}
	} else if len(args) == 2 {
		if args[0] == "cmd" {
			// code-editor-agent cmd <command>
			switch args[1] {
			case "init":
				if err := commands.Init(); err != nil {
					fmt.Fprintln(os.Stderr, err)
					os.Exit(1)
				}
			case "generate":
				if err := commands.Generate(false); err != nil {
					fmt.Fprintln(os.Stderr, err)
					os.Exit(1)
				}
			default:
				fmt.Fprintf(os.Stderr, "Unknown command: %s\n", args[1])
				os.Exit(1)
			}
		} else {
			// code-editor-agent <commandGroup> <file-path>
			agentName, err := findAgentByCommandGroup(&args[0])
			if err != nil {
				fmt.Fprintln(os.Stderr, err)
				os.Exit(1)
			}
			if err := commands.Load(agentName, args[1]); err != nil {
				fmt.Fprintln(os.Stderr, err)
				os.Exit(1)
			}
		}
	} else {
		fmt.Fprintln(os.Stderr, "Usage:")
		fmt.Fprintln(os.Stderr, "  code-editor-agent <file-path>              # Use agent with commandGroup: null")
		fmt.Fprintln(os.Stderr, "  code-editor-agent <commandGroup> <file>    # Use agent with specified commandGroup")
		fmt.Fprintln(os.Stderr, "  code-editor-agent cmd init                 # Initialize configuration")
		fmt.Fprintln(os.Stderr, "  code-editor-agent cmd generate             # Generate rule caches")
		os.Exit(1)
	}
}
