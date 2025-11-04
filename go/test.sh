#!/bin/sh

set -e

# Build the Go binary first
echo "Building Go binary..."
go build -o code-editor-agent .

# Run the shared test suite with the Go binary
echo "Running tests with Go implementation..."
cd ../test
CMD="../go/code-editor-agent" sh test.sh
