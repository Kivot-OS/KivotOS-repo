# Summary of Changes - KivotOS APT Repository

This document summarizes all changes made during the setup and refinement of the KivotOS APT repository.

## 1. Package Additions

### Added matugen package (packages/matugen.toml)
```toml
name = "matugen"
repo = "github:InioX/matugen"
version = "latest"
type = "cargo"
binary = "matugen"
description = "Material You color generation tool"
license = "GPL-2.0"
```

### Updated yazi package (packages/yazi.toml)
- Added optional dependencies: ffmpeg, p7zip, jq, poppler-utils, fd-find, ripgrep, fzf, zoxide, imagemagick
- Added post_build hook to extract binaries from zip:
```toml
post_build = "cd src && unzip -o yazi-*.zip && cp yazi-*/yazi yazi-*/ya target/release/"
```

### Updated wallust package (packages/wallust.toml)
- Changed from `type = "make"` to `type = "cargo"`
- Simplified install section to only include the binary

## 2. Workflow Fixes (.github/workflows/build.yml)

### URL Format Fix
- **Issue**: Repo URLs like `github:username/repo` failed with "Port number was not a decimal number"
- **Fix**: Added URL conversion logic:
```bash
if [[ "$REPO_URL" == github:* ]]; then
   REPO_URL="https://github.com/${REPO_URL#github:}"
elif [[ "$REPO_URL" == codeberg:* ]]; then
   REPO_URL="https://codeberg.org/${REPO_URL#codeberg:}"
fi
```

### Custom Type Clone Fix
- **Issue**: Custom build type didn't clone the repository
- **Fix**: Added git clone for type="custom" before running build command

### Rust Toolchain Fix
- **Issue**: Cargo.lock version 4 not supported by Debian's old cargo
- **Fix**: Use `dtolnay/rust-toolchain@stable` for latest Rust toolchain

### Cargo PATH Fix
- **Issue**: Cargo from rustup not found in PATH for make type
- **Fix**: Source cargo env and add to PATH:
```bash
source $HOME/.cargo/env 2>/dev/null || true
export PATH="$HOME/.cargo/bin:$PATH"
```

### Aptly Configuration Fix
- **Issue**: `ERROR: published local storage public not configured`
- **Fix**: Create `~/.aptly.conf` with FileSystemPublishEndpoints:
```json
{
  "rootDir": ".aptly",
  "downloadConcurrency": 4,
  "FileSystemPublishEndpoints": {
    "public": {
      "rootDir": "./public",
      "linkMethod": "copy"
    }
  }
}
```

### GPG Configuration Fix
- **Issue**: `Inappropriate ioctl for device` when signing
- **Fix**: Configure GPG for loopback pinentry mode:
```bash
mkdir -p ~/.gnupg && chmod 700 ~/.gnupg
printf 'pinentry-mode loopback\nbatch\n' > ~/.gnupg/gpg.conf
printf 'allow-loopback-pinentry\n' > ~/.gnupg/gpg-agent.conf
gpgconf --kill gpg-agent || true
```

### Merge cargo-deb into cargo
- **Change**: Removed separate `cargo-deb` type
- **New behavior**: `cargo` type auto-detects cargo-deb support:
```bash
if cargo install cargo-deb 2>/dev/null && cargo deb 2>/dev/null; then
  echo "Successfully built with cargo-deb"
else
  echo "Falling back to cargo build"
  cargo build --release
fi
```

### Added post_build Hook
- **Purpose**: Allow custom commands after build (e.g., extract from zip)
- **Implementation**: Run if `matrix.post_build` is defined

### Added Automatic .deb Packaging
- **For**: Custom type packages that don't create .deb
- **Logic**: If no .deb found after build, create one from install mappings

### Added Directory Index Generation
- **Purpose**: Create index.html for browsing on GitHub Pages
- **Implementation**: Generate HTML index for each directory in public/

## 3. Workflow Trigger Fix (.github/workflows/update.yml)

### Removed gh workflow run
- **Issue**: `GITHUB_TOKEN` cannot trigger other workflows (HTTP 403)
- **Fix**: Removed `gh workflow run build.yml` - build triggers automatically on push to main

## 4. Documentation Updates

### README.md
- Added maintainer: Dinh Manh Dung (dungdinhmanh0209@gmail.com)
- Removed optional dependencies section (to be added to debian control instead)

### CONTRIBUTING.md
Complete rewrite with:
- Templates for all package types (cargo, make, custom)
- Package fields reference table
- Package types comparison table
- Workflow explanation
- Local testing instructions
- Tips section

## 5. All Commits

1. `a6f0d0b` - fix: workflow build errors and update trigger
2. `f2b6b8b` - fix: install cargo for make type
3. `7987fa2` - fix: use dtolnay/rust-toolchain@stable
4. `68accaf` - fix: add cargo to PATH for make type
5. `06c1ab0` - fix(wallust): change type to cargo
6. `abaa693` - fix: add aptly config
7. `7a2e96c` - fix: configure GPG for loopback
8. `23489fc` - fix: update GPG config
9. `3548c22` - feat: add directory index HTML
10. `0186d7a` - feat: add post_build hook
11. `4a858bf` - refactor: merge cargo-deb into cargo

## Package Types Summary

| Type | Build Command | Use When |
|------|--------------|----------|
| cargo | Auto-detects cargo-deb, falls back to cargo build | Rust projects |
| make | make + cargo build (if needed) | Makefile projects |
| custom | Custom build script + post_build hook | Special build requirements |

## Files Changed

- `.github/workflows/build.yml` - Major refactoring
- `.github/workflows/update.yml` - Removed workflow trigger
- `packages/matugen.toml` - New package
- `packages/yazi.toml` - Added optional deps and post_build
- `packages/wallust.toml` - Changed type from make to cargo
- `README.md` - Added maintainer
- `CONTRIBUTING.md` - Complete documentation rewrite
