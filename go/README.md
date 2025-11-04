# code-editor-agent (Go Implementation)

This is a Go rewrite of the original Node.js `code-editor-agent` tool. It provides the same functionality with improved performance and a single binary distribution.

## Features

- **No Runtime Dependencies**: Single binary, no need for Node.js
- **Faster Startup**: Go binaries have instant startup time compared to Node.js
- **Cross-Platform**: Easy to build for multiple platforms
- **Lower Memory Footprint**: More efficient resource usage

## Building

```bash
go build -o code-editor-agent .
```

### Cross-compilation

Build for different platforms:

```bash
# Linux
GOOS=linux GOARCH=amd64 go build -o code-editor-agent-linux .

# macOS
GOOS=darwin GOARCH=amd64 go build -o code-editor-agent-macos .
GOOS=darwin GOARCH=arm64 go build -o code-editor-agent-macos-arm64 .

# Windows
GOOS=windows GOARCH=amd64 go build -o code-editor-agent.exe .
```

## Usage

The usage is identical to the Node.js version:

```bash
# Initialize configuration
./code-editor-agent cmd init

# Generate rule cache
./code-editor-agent cmd generate

# Load rules for a file (default agent)
./code-editor-agent path/to/file.ts

# Load rules for a file (specific agent)
./code-editor-agent <commandGroup> path/to/file.ts
```

## Installation

1. Build the binary (see above)
2. Move it to your `$PATH`:
   ```bash
   sudo mv code-editor-agent /usr/local/bin/
   ```
3. Or use it directly from the build location

## Dependencies

The Go implementation uses these libraries:

- **github.com/tidwall/jsonc** - JSONC parsing (JSON with comments and trailing commas)
- **github.com/bmatcuk/doublestar/v4** - Glob pattern matching
- **gopkg.in/yaml.v3** - YAML front matter parsing

All dependencies are managed via Go modules.

## Differences from Node.js Version

The Go implementation maintains full compatibility with the Node.js version:

- Same configuration file format (`.config/code-editor-agent.jsonc`)
- Same rule file format (Markdown with YAML front matter)
- Same cache file format (`.claude/agents/code-editor/rules-cache-generated.json`)
- Identical CLI interface and command structure
- Same rule matching and priority filtering algorithm

You can use the Go binary as a drop-in replacement for the Node.js version.

## Testing

```bash
# Run integration tests using Makefile
make test

# Or run the test script directly
sh test.sh

# Or run tests from the test directory
cd ../test
CMD="../go/code-editor-agent" sh test.sh
```

## Development

```bash
# Run without building
go run . cmd init

# Install dependencies
go mod tidy

# Format code
make fmt

# Run linters
make lint
```

## Project Structure

```
go/
├── main.go                 # Entry point, CLI routing
├── config/
│   └── config.go          # Config loading and validation
├── commands/
│   ├── generate.go        # Generate command
│   ├── init.go            # Init command
│   └── load.go            # Load command
├── models/
│   └── models.go          # Data structures
├── utils/
│   └── utils.go           # Utility functions
├── go.mod                 # Go module definition
└── README.md              # This file
```
