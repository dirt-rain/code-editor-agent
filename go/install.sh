#!/bin/sh
# Installation script for code-editor-agent (Go version)
# Usage: curl -sSL https://raw.githubusercontent.com/dirt-rain/code-editor-agent/main/go/install.sh | sh

set -e

REPO="dirt-rain/code-editor-agent"
BINARY_NAME="code-editor-agent"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

# Detect OS and architecture
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case "$OS" in
  linux*)
    OS="linux"
    ;;
  darwin*)
    OS="darwin"
    ;;
  msys*|mingw*|cygwin*)
    OS="windows"
    ;;
  *)
    echo "Unsupported OS: $OS"
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64)
    ARCH="amd64"
    ;;
  aarch64|arm64)
    ARCH="arm64"
    ;;
  *)
    echo "Unsupported architecture: $ARCH"
    exit 1
    ;;
esac

# Get latest release version
echo "Fetching latest release..."
VERSION=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$VERSION" ]; then
  echo "Failed to fetch latest version"
  exit 1
fi

echo "Latest version: $VERSION"

# Construct download URL
BINARY_URL="https://github.com/$REPO/releases/download/$VERSION/${BINARY_NAME}-${OS}-${ARCH}"

if [ "$OS" = "windows" ]; then
  BINARY_URL="${BINARY_URL}.exe"
  BINARY_NAME="${BINARY_NAME}.exe"
fi

echo "Downloading $BINARY_URL..."
TEMP_FILE=$(mktemp)
curl -sL "$BINARY_URL" -o "$TEMP_FILE"

# Make executable
chmod +x "$TEMP_FILE"

# Install to $INSTALL_DIR
echo "Installing to $INSTALL_DIR/$BINARY_NAME..."
if [ -w "$INSTALL_DIR" ]; then
  mv "$TEMP_FILE" "$INSTALL_DIR/$BINARY_NAME"
else
  sudo mv "$TEMP_FILE" "$INSTALL_DIR/$BINARY_NAME"
fi

echo "Successfully installed $BINARY_NAME $VERSION to $INSTALL_DIR"
echo "Run: $BINARY_NAME --help"
