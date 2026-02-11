# Contributing to KivotOS Repo

We use a simplified TOML-based system to manage packages.

## Adding a New Package

1. Create a new file in `packages/<package-name>.toml`.
2. Use the following template:

```toml
name = "package-name"
repo = "github:owner/repo"  # or codeberg:owner/repo
version = "latest"          # "latest" tracks upstream releases
type = "cargo"              # cargo, make, or custom
build = "cargo build --release --locked"
binary = "target/release/binary-name"
description = "Short description"
license = "MIT"

[depends]
build = ["rustc", "cargo", "pkg-config", "libssl-dev"]
runtime = ["libssl3"]

[install]
# Map build artifacts to destination paths
"target/release/binary-name" = "/usr/bin/binary-name"
"assets/icon.png" = "/usr/share/icons/hicolor/48x48/apps/package.png"
```

## Package Types

- **cargo**: Builds a Rust project using `cargo`.
- **make**: Builds using `make`.
- **custom**: Runs a custom script specified in `build` field.

## Workflow

1. **Update**: A scheduled workflow (`update.yml`) checks for new versions of packages defined in `packages/*.toml` and updates `packages.lock`.
2. **Build**: When `packages.lock` changes, the `build.yml` workflow is triggered to build the updated packages and publish them to the APT repository.

## Local Testing

To test the build script locally:
```bash
./scripts/yazi_build.sh  # for yazi
```
To check for updates:
```bash
python3 scripts/manager.py update
```
