# KivotOS Makefile - Build orchestration for APT repository
# Usage: make <target> [PACKAGE=<name>]

# Configuration
PACKAGES_DIR := packages
BUILD_DIR := build
DIST_DIR := dist
LOCK_FILE := packages.lock

# Tools
PYTHON := python3
CARGO := cargo
GIT := git
MAKE := make

# Colors for output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# Default target
.PHONY: all help list clean build install

all: build

help:
	@echo "KivotOS Build System"
	@echo ""
	@echo "Targets:"
	@echo "  list          - List all packages"
	@echo "  build         - Build all packages (or PACKAGE=<name>)"
	@echo "  clean         - Clean build artifacts"
	@echo "  install-deps  - Install build dependencies"
	@echo ""
	@echo "Examples:"
	@echo "  make build              # Build all packages"
	@echo "  make build PACKAGE=yazi # Build only yazi"
	@echo "  make list               # Show available packages"

# List all packages
list:
	@echo "$(BLUE)Available packages:$(RESET)"
	@for pkg in $(PACKAGES_DIR)/*.toml; do \
		name=$$(basename $$pkg .toml); \
		echo "  - $$name"; \
	done

# Clean build artifacts
clean:
	@echo "$(YELLOW)Cleaning build artifacts...$(RESET)"
	rm -rf $(BUILD_DIR) $(DIST_DIR)
	@echo "$(GREEN)Cleaned!$(RESET)"

# Install build dependencies
install-deps:
	@echo "$(BLUE)Installing build dependencies...$(RESET)"
	sudo apt-get update
	sudo apt-get install -y build-essential git curl jq
	# Install Rust if not present
	@if ! command -v cargo &> /dev/null; then \
		echo "$(YELLOW)Installing Rust...$(RESET)"; \
		curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y; \
		source $$HOME/.cargo/env; \
	fi
	@echo "$(GREEN)Dependencies installed!$(RESET)"

# Build all or specific package
build: $(BUILD_DIR)
ifdef PACKAGE
	@$(MAKE) build-single PACKAGE=$(PACKAGE)
else
	@for pkg in $(PACKAGES_DIR)/*.toml; do \
		name=$$(basename $$pkg .toml); \
		$(MAKE) build-single PACKAGE=$$name || exit 1; \
	done
	@echo "$(GREEN)All packages built successfully!$(RESET)"
endif

# Build single package
build-single: $(BUILD_DIR)/$(PACKAGE)
	@echo "$(BLUE)Building $(PACKAGE)...$(RESET)"
	@$(MAKE) -C $(BUILD_DIR)/$(PACKAGE) build
	@echo "$(GREEN)$(PACKAGE) built successfully!$(RESET)"

# Create build directory for package
$(BUILD_DIR)/%: $(PACKAGES_DIR)/%.toml
	@mkdir -p $@
	@echo "$(YELLOW)Setting up $*...$(RESET)"
	@$(PYTHON) scripts/setup-build.py $< $@

# Create directories
$(BUILD_DIR) $(DIST_DIR):
	@mkdir -p $@

# Debug: Show package info
info:
ifdef PACKAGE
	@$(PYTHON) scripts/package-info.py $(PACKAGES_DIR)/$(PACKAGE).toml
else
	@echo "Usage: make info PACKAGE=<name>"
endif
