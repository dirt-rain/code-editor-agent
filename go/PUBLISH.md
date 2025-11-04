# Publishing the Go Binary

There are several ways to distribute the Go version of code-editor-agent:

## 1. GitHub Releases (Recommended)

### Manual Release

1. Build binaries for all platforms:
   ```bash
   make cross-compile
   ```

2. Create a new release on GitHub:
   - Go to: https://github.com/dirt-rain/code-editor-agent/releases/new
   - Tag: `v0.0.3` (or next version)
   - Upload the generated binaries:
     - `code-editor-agent-linux-amd64`
     - `code-editor-agent-linux-arm64`
     - `code-editor-agent-darwin-amd64`
     - `code-editor-agent-darwin-arm64`
     - `code-editor-agent-windows-amd64.exe`

3. Users can download with:
   ```bash
   # Linux/macOS
   curl -L https://github.com/dirt-rain/code-editor-agent/releases/download/v0.0.3/code-editor-agent-linux-amd64 -o code-editor-agent
   chmod +x code-editor-agent
   sudo mv code-editor-agent /usr/local/bin/
   ```

### Automated Release with GoReleaser

1. Install GoReleaser:
   ```bash
   go install github.com/goreleaser/goreleaser@latest
   ```

2. Create a GitHub token with `repo` permissions
   ```bash
   export GITHUB_TOKEN="your_token_here"
   ```

3. Tag and release:
   ```bash
   git tag -a v0.0.3 -m "Release v0.0.3"
   git push origin v0.0.3
   goreleaser release --clean
   ```

This automatically:
- Builds for all platforms
- Creates GitHub release
- Uploads binaries
- Generates checksums
- Creates changelog

## 2. Homebrew (macOS/Linux)

Create a Homebrew tap for easy installation on macOS/Linux:

1. Create a formula file in a separate repo (e.g., `homebrew-tap`):
   ```ruby
   # Formula/code-editor-agent.rb
   class CodeEditorAgent < Formula
     desc "Context-aware file-specific rules for Claude Code agents"
     homepage "https://github.com/dirt-rain/code-editor-agent"
     url "https://github.com/dirt-rain/code-editor-agent/releases/download/v0.0.3/code-editor-agent-darwin-amd64"
     sha256 "checksum_here"
     version "0.0.3"

     def install
       bin.install "code-editor-agent-darwin-amd64" => "code-editor-agent"
     end

     test do
       system "#{bin}/code-editor-agent", "--version"
     end
   end
   ```

2. Users install with:
   ```bash
   brew tap dirt-rain/tap
   brew install code-editor-agent
   ```

## 3. Go Install (Direct from source)

Users with Go installed can install directly:

```bash
go install github.com/dirt-rain/code-editor-agent/go@latest
```

Note: This requires:
- Tagging a release
- Having `go.mod` in the `go/` subdirectory
- Users having Go installed

## 4. Install Script (Universal)

Create an install script that detects OS/arch and downloads the right binary:

```bash
# install.sh
curl -sSL https://raw.githubusercontent.com/dirt-rain/code-editor-agent/main/go/install.sh | sh
```

See `install.sh` for the implementation.

## 5. Docker Image

For containerized environments:

```dockerfile
FROM golang:1.21 AS builder
WORKDIR /build
COPY go/ .
RUN go build -o code-editor-agent .

FROM alpine:latest
COPY --from=builder /build/code-editor-agent /usr/local/bin/
ENTRYPOINT ["code-editor-agent"]
```

Publish to Docker Hub or GitHub Container Registry:
```bash
docker build -t dirt-rain/code-editor-agent:latest .
docker push dirt-rain/code-editor-agent:latest
```

## 6. Package Managers

### AUR (Arch Linux)
Create a PKGBUILD and submit to AUR.

### Snap (Ubuntu/Linux)
Package as a snap:
```bash
snapcraft
snapcraft push code-editor-agent_0.0.3_amd64.snap
```

### Chocolatey (Windows)
Package for Chocolatey package manager.

## Comparison with NPM

| Feature | NPM | Go Releases |
|---------|-----|-------------|
| Distribution | npm registry | GitHub Releases / Homebrew |
| Installation | `npm install -g` | Download binary or `brew install` |
| Runtime needed | Node.js | None |
| Binary size | ~20MB | ~6MB |
| Startup time | ~100ms | ~5ms |
| Updates | `npm update` | Re-download or `brew upgrade` |

## Recommended Workflow

For code-editor-agent, I recommend:

1. **Primary**: GitHub Releases with GoReleaser (automated)
2. **Secondary**: Homebrew tap (for macOS/Linux users)
3. **Tertiary**: Keep NPM version for Node.js users

This gives users flexibility:
- `npm install -g code-editor-agent` (Node.js version)
- `brew install dirt-rain/tap/code-editor-agent` (Go version)
- Manual download from GitHub Releases

## Version Management

To publish a new version:

1. Update version in code (if you track it)
2. Update CHANGELOG.md
3. Commit changes
4. Tag release:
   ```bash
   git tag -a v0.0.3 -m "Release v0.0.3"
   git push origin v0.0.3
   ```
5. GoReleaser handles the rest (if configured in CI/CD)

Or manually:
```bash
make cross-compile
# Upload to GitHub Releases manually
```
