# Contributing to KivotOS Repo

We use a simplified TOML-based system to manage packages.

## Adding a New Package

1. Create a new file in `packages/<package-name>.toml`.
2. Use one of the following templates based on build type:

### Template: cargo (Rust project)

The `cargo` type automatically tries `cargo deb` first (if the project supports it), then falls back to `cargo build`:

```toml
name = "package-name"
repo = "github:owner/repo"  # or codeberg:owner/repo
version = "latest"          # "latest" tracks upstream releases
type = "cargo"
build = "cargo build --release"  # Fallback if cargo-deb fails
binary = "package-name"
description = "Short description"
license = "MIT"
homepage = "https://github.com/owner/repo"

[depends]
build = ["rustc", "cargo", "pkg-config", "libssl-dev"]
runtime = ["libssl3"]

[distro]
codenames = ["trixie"]
arch = "amd64"

[control]
maintainer = "Your Name <email@example.com>"
section = "utils"
priority = "optional"

[install]
"target/release/package-name" = "/usr/bin/package-name"
```

### Template: make (Makefile project)

```toml
name = "package-name"
repo = "github:owner/repo"
version = "latest"
type = "make"
build = "make all"
binary = "package-name"
description = "Short description"
license = "MIT"

[depends]
build = ["build-essential", "gcc", "g++"]
runtime = []

[distro]
codenames = ["trixie"]
arch = "amd64"

[control]
maintainer = "Your Name <email@example.com>"
section = "utils"

[install]
"target/release/package-name" = "/usr/bin/package-name"
```

### Template: custom (Custom build script)

Use this when the project has a custom build script or creates non-standard outputs (e.g., zip files).

```toml
name = "package-name"
repo = "github:owner/repo"
version = "latest"
type = "custom"
build = "cd src && ./scripts/build.sh"
# Optional: post-build hook to extract/process build outputs
post_build = "cd src && unzip -o package-*.zip && cp package/binary target/release/"
binary = "package-name"
description = "Short description"
license = "MIT"

[depends]
build = ["rustc", "cargo", "git"]
runtime = []
optional = ["optional-dep1", "optional-dep2"]  # Suggested packages

[distro]
codenames = ["trixie"]
arch = "amd64"

[control]
maintainer = "Your Name <email@example.com>"
section = "utils"
priority = "optional"

[install]
"target/release/package-name" = "/usr/bin/package-name"
"completions/package.bash" = "/usr/share/bash-completion/completions/package-name"
```

## Package Types

| Type | Description | Use When |
|------|-------------|----------|
| **cargo** | Build Rust project with `cargo build` | Standard Rust project |
| **cargo-deb** | Build using `cargo deb` | Project has Cargo.toml with deb metadata |
| **make** | Build using `make` | Project uses Makefile |
| **custom** | Run custom commands | Project has custom build script or unusual output |

## Package Fields Reference

### Required Fields

- `name`: Package name (lowercase, no spaces)
- `repo`: Repository in format `github:owner/repo` or `codeberg:owner/repo`
- `version`: Version string or `"latest"` to track upstream
- `type`: One of `cargo`, `cargo-deb`, `make`, `custom`
- `description`: Short package description
- `license`: SPDX license identifier

### Optional Fields

- `build`: Build command (required for `cargo`, `make`, `custom`)
- `post_build`: Command to run after build (e.g., extract from zip)
- `binary`: Primary binary name
- `homepage`: Project homepage URL

### [depends] Section

- `build`: Build dependencies (installed before building)
- `runtime`: Runtime dependencies (added to deb Depends:)
- `optional`: Optional/suggested packages for enhanced functionality

### [distro] Section

- `codenames`: List of distro codenames (e.g., `["trixie"]`)
- `arch`: Target architecture (e.g., `"amd64"`)

### [control] Section

- `maintainer`: Package maintainer name and email
- `section`: Package section (e.g., `utils`, `devel`)
- `priority`: Package priority (`optional`, `standard`, `important`)
- `homepage`: Package homepage (if different from project homepage)

### [install] Section

Maps source files to destination paths in the package:
```toml
[install]
"target/release/myapp" = "/usr/bin/myapp"
"assets/icon.png" = "/usr/share/icons/hicolor/48x48/apps/myapp.png"
"completions/myapp.bash" = "/usr/share/bash-completion/completions/myapp"
```

## Workflow

1. **Update** (`.github/workflows/update.yml`): Scheduled workflow checks for new versions of packages and updates `packages.lock`.

2. **Build** (`.github/workflows/build.yml`): Triggered when `packages.lock` or `packages/*.toml` changes:
   - Builds packages in parallel matrix jobs
   - Creates APT repository with `aptly`
   - Signs packages with GPG
   - Generates directory index HTML
   - Deploys to GitHub Pages

## Local Testing

### Check for updates
```bash
python3 scripts/manager.py update
```

### Generate build matrix
```bash
python3 scripts/manager.py matrix
```

### Test build locally
For cargo projects:
```bash
cd /tmp
git clone https://github.com/owner/repo
cd repo
cargo build --release
```

## Tips

- Use `"latest"` for `version` to automatically track upstream releases
- For Rust projects using `cargo-deb`, use `type = "cargo-deb"` for automatic packaging
- If a project outputs a zip or tarball, use `type = "custom"` with `post_build` to extract it
- Include shell completions in `[install]` if the project provides them
- Add optional dependencies for enhanced functionality (e.g., yazi's optional tools)
