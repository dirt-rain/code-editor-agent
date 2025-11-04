.PHONY: build clean install test all cross-compile

BINARY_NAME=code-editor-agent
INSTALL_PATH=/usr/local/bin

build:
	go build -o $(BINARY_NAME) .

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
	GOOS=linux GOARCH=amd64 go build -o $(BINARY_NAME)-linux-amd64 .
	GOOS=linux GOARCH=arm64 go build -o $(BINARY_NAME)-linux-arm64 .
	GOOS=darwin GOARCH=amd64 go build -o $(BINARY_NAME)-darwin-amd64 .
	GOOS=darwin GOARCH=arm64 go build -o $(BINARY_NAME)-darwin-arm64 .
	GOOS=windows GOARCH=amd64 go build -o $(BINARY_NAME)-windows-amd64.exe .

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
