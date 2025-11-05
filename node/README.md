# Code Editor Agent (Node.js)

A separate Claude Code agent dedicated to code editing, designed to minimize context pollution in the main session

## Quick Start

### Installation

```sh
npm install -D code-editor-agent
```

### Basic Setup

1. Configure `.claude/settings.json`:
   ```json
   {
     "permissions": {
       "allow": ["Bash(npx code-editor-agent:*)"]
     }
   }
   ```

2. Initialize the agent:
   ```sh
   npx code-editor-agent cmd init
   ```

3. Start using the agent in Claude Code!

For detailed setup instructions, see the [main README](https://github.com/dirt-rain/code-editor-agent#quick-start).

## Development and Contributing

PRs are welcome! Please feel free to submit any issues or feature requests.

## License

WTFPL
