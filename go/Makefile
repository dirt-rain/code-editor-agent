.PHONY: build clean install test all cross-compile release

BINARY_NAME=code-editor-agent
INSTALL_PATH=/usr/local/bin
VERSION?=dev
COMMIT=$(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")
DATE=$(shell date -u +"%Y-%m-%dT%H:%M:%SZ")
LDFLAGS=-ldflags "-s -w -X main.version=$(VERSION) -X main.commit=$(COMMIT) -X main.date=$(DATE)"

build:
	go build $(LDFLAGS) -o $(BINARY_NAME) .

clean:
	rm -f $(BINARY_NAME)
	rm -f $(BINARY_NAME)-*
	go clean

install: build
	sudo mv $(BINARY_NAME) $(INSTALL_PATH)/$(BINARY_NAME)

test: build
	@echo "Running integration tests..."
	@cd ../test && CMD="../go/code-editor-agent" sh test.sh

all: clean build

# Cross-compilation targets
cross-compile:
	GOOS=linux GOARCH=amd64 go build $(LDFLAGS) -o $(BINARY_NAME)-linux-amd64 .
	GOOS=linux GOARCH=arm64 go build $(LDFLAGS) -o $(BINARY_NAME)-linux-arm64 .
	GOOS=darwin GOARCH=amd64 go build $(LDFLAGS) -o $(BINARY_NAME)-darwin-amd64 .
	GOOS=darwin GOARCH=arm64 go build $(LDFLAGS) -o $(BINARY_NAME)-darwin-arm64 .
	GOOS=windows GOARCH=amd64 go build $(LDFLAGS) -o $(BINARY_NAME)-windows-amd64.exe .

# Release build with version
release:
	@if [ -z "$(VERSION)" ] || [ "$(VERSION)" = "dev" ]; then \
		echo "Error: VERSION must be set (e.g., make release VERSION=v0.0.3)"; \
		exit 1; \
	fi
	@echo "Building release $(VERSION)..."
	@make cross-compile VERSION=$(VERSION)
	@echo "Release $(VERSION) built successfully!"
	@echo "Binaries:"
	@ls -lh $(BINARY_NAME)-*

# Development
run:
	go run . $(ARGS)

deps:
	go mod download
	go mod tidy

fmt:
	go fmt ./...

vet:
	go vet ./...

lint: fmt vet
