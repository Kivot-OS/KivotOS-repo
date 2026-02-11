#!/usr/bin/env python3
"""
Setup build directory for a package from TOML config.
Usage: setup-build.py <package.toml> <build_directory>
"""

import sys
import os
import toml
import json

def load_toml(path):
    """Load and parse TOML file."""
    with open(path, 'r') as f:
        return toml.load(f)

def generate_makefile(config, build_dir):
    """Generate a Makefile for the package build."""
    pkg_name = config['name']
    pkg_type = config.get('type', 'custom')
    repo = config.get('repo', '')
    version = config.get('version', 'latest')
    build_cmd = config.get('build', '')
    install = config.get('install', {})
    depends = config.get('depends', {})
    control = config.get('control', {})
    description = config.get('description', '')
    license = config.get('license', '')
    
    # Debian control fields with defaults
    maintainer = control.get('maintainer', 'KivotOS <kivotos@example.com>')
    section = control.get('section', 'utils')
    priority = control.get('priority', 'optional')
    homepage = control.get('homepage', '')
    
    # Build Depends: and Depends: from TOML
    build_deps = ', '.join(depends.get('build', []))
    runtime_deps = ', '.join(depends.get('runtime', []))
    
    makefile_content = f"""# Auto-generated Makefile for {pkg_name}
# Source: {repo}
# Type: {pkg_type}

PKG_NAME := {pkg_name}
VERSION := $(shell cat ../{pkg_name}.version 2>/dev/null || echo "{version}")
BUILD_DIR := .
SRC_DIR := $(BUILD_DIR)/src
DIST_DIR := $(BUILD_DIR)/dist
REPO := {repo}

# Colors
GREEN := \\033[32m
BLUE := \\033[36m
RESET := \\033[0m

.PHONY: all build clone checkout package clean

all: build

# Clone source
clone:
	@echo "$(BLUE)Cloning $(PKG_NAME)...$(RESET)"
	@git clone https://{repo.replace(':', '/').replace('github/', 'github.com/').replace('codeberg/', 'codeberg.org/')} $(SRC_DIR) 2>/dev/null || (cd $(SRC_DIR) && git fetch)

# Checkout version
checkout: clone
	@if [ "$(VERSION)" != "latest" ] && [ -n "$(VERSION)" ]; then \\
		echo "$(BLUE)Checking out $(VERSION)...$(RESET)"; \\
		cd $(SRC_DIR) && git checkout "$(VERSION)"; \\
	fi

# Build based on type
build: checkout
	@echo "$(BLUE)Building $(PKG_NAME)...$(RESET)"
	@mkdir -p $(DIST_DIR)
"""
    
    # Add build commands based on type
    if pkg_type == 'cargo-deb':
        makefile_content += """
	@cd $(SRC_DIR) && cargo install cargo-deb 2>/dev/null || true
	@cd $(SRC_DIR) && cargo deb
	@cp $(SRC_DIR)/target/debian/*.deb $(DIST_DIR)/
"""
    elif pkg_type == 'make':
        makefile_content += f"""
	@cd $(SRC_DIR) && {build_cmd or 'make'}
"""
        # Add install commands for make type
        for src, dst in install.items():
            makefile_content += f"""
	@mkdir -p $(DIST_DIR)/debian$(dirname {dst})
	@cp $(SRC_DIR)/{src} $(DIST_DIR)/debian{dst}
"""
    elif pkg_type == 'custom':
        makefile_content += f"""
	@cd $(SRC_DIR) && {build_cmd}
	@# Copy any generated .deb files
	@if ls $(SRC_DIR)/*.deb 1>/dev/null 2>&1; then \\
		cp $(SRC_DIR)/*.deb $(DIST_DIR)/; \\
	fi
	@if ls $(SRC_DIR)/target/debian/*.deb 1>/dev/null 2>&1; then \\
		cp $(SRC_DIR)/target/debian/*.deb $(DIST_DIR)/; \\
	fi
"""
    else:
        makefile_content += f"""
	@cd $(SRC_DIR) && {build_cmd}
"""
    
    makefile_content += """
	@echo "$(GREEN)$(PKG_NAME) build complete!$(RESET)"

# Package into .deb (for non-cargo-deb types)
package: build
	@if [ -z "$(wildcard $(DIST_DIR)/*.deb)" ]; then \\
		echo "$(BLUE)Packaging $(PKG_NAME)...$(RESET)"; \\
		mkdir -p $(DIST_DIR)/debian/DEBIAN; \\
		$(MAKE) control-file; \\
		dpkg-deb --build $(DIST_DIR)/debian $(DIST_DIR)/$(PKG_NAME)_$(VERSION)_amd64.deb; \\
	fi

# Generate control file
control-file:
	@cat > $(DIST_DIR)/debian/DEBIAN/control <<EOF
Package: $(PKG_NAME)
Version: $(VERSION)
Architecture: amd64
Maintainer: {maintainer}
Description: {description}
Priority: {priority}
Section: {section}
{('Homepage: ' + homepage) if homepage else ''}
{('Depends: ' + runtime_deps) if runtime_deps else ''}
EOF

clean:
	@rm -rf $(SRC_DIR) $(DIST_DIR)
	@echo "$(GREEN)Cleaned $(PKG_NAME)$(RESET)"
"""
    
    return makefile_content

def main():
    if len(sys.argv) != 3:
        print("Usage: setup-build.py <package.toml> <build_directory>")
        sys.exit(1)
    
    toml_path = sys.argv[1]
    build_dir = sys.argv[2]
    
    # Load TOML
    try:
        config = load_toml(toml_path)
    except Exception as e:
        print(f"Error loading {toml_path}: {e}")
        sys.exit(1)
    
    # Create build directory
    os.makedirs(build_dir, exist_ok=True)
    
    # Generate Makefile
    makefile = generate_makefile(config, build_dir)
    makefile_path = os.path.join(build_dir, 'Makefile')
    
    with open(makefile_path, 'w') as f:
        f.write(makefile)
    
    # Save config for reference
    config_path = os.path.join(build_dir, 'package.json')
    with open(config_path, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"Setup complete: {build_dir}")
    print(f"  - Makefile: {makefile_path}")
    print(f"  - Config: {config_path}")

if __name__ == '__main__':
    main()
