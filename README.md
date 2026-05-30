# KivotOS APT Repository

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Build](https://github.com/Kivot-OS/KivotOS-repo/actions/workflows/build.yml/badge.svg)](https://github.com/Kivot-OS/KivotOS-repo/actions/workflows/build.yml)
[![Release](https://img.shields.io/github/v/release/Kivot-OS/KivotOS-repo)](https://github.com/Kivot-OS/KivotOS-repo/releases)

Personal APT repository for Debian Trixie (amd64) with curated CLI tools.
Packages are built from source and published to Cloudflare R2.

**Maintainer:** Dinh Manh Dung (dungdinhmanh0209@gmail.com)

---

## Quick Start

### 1) Import GPG key

```bash
curl -fsSL https://kivotos-repo.dungdinhmanh0209.workers.dev/pubkey.gpg \
| sudo gpg --dearmor -o /etc/apt/keyrings/kivotos.gpg
```

### 2) Add sources list

```bash
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/kivotos.gpg] \
https://kivotos-repo.dungdinhmanh0209.workers.dev trixie main" \
| sudo tee /etc/apt/sources.list.d/kivotos.list
```

### 3) Update and install

```bash
sudo apt update
sudo apt install yazi hellwal wallust matugen
```

---

## Packages

| Package | Type | Upstream | Description |
|---------|------|----------|-------------|
| `awww` | cargo | [awww](https://github.com/awww) | -- |
| `hellwal` | cargo | [hellwal](https://github.com/hellwal) | -- |
| `mangowc` | make | [mangowc](https://codeberg.org/mangowc) | -- |
| `matugen` | cargo | [matugen](https://github.com/matugen) | Material You color generator |
| `wallust` | cargo | [wallust](https://github.com/wallust) | -- |
| `yazi` | cargo | [yazi](https://github.com/yazi) | Terminal file manager |

---

## Development

The repo uses GitHub Actions for CI:

- **Build** — packages are built per commit on `main` using matrix strategy (cargo deb, nfpm, make)
- **Publish** — `.deb` artifacts are signed with GPG and published to Cloudflare R2 via aptly
- **Triage** — new issues are auto-labeled by rules and AI fallback
- **Release** — pushing `v*` tags triggers AI-generated release notes
- **CI reports** — build failures create labeled issues with error categorization, git blame, commit diff, and AI analysis

---

## Troubleshooting

### Reset apt lists

```bash
sudo rm -rf /var/lib/apt/lists/*
sudo mkdir -p /var/lib/apt/lists/partial
sudo apt update
```

---

## Remove the repository

```bash
sudo rm /etc/apt/sources.list.d/kivotos.list
sudo rm /usr/share/keyrings/kivotos.gpg
sudo apt update
```

---

## License

This repository configuration is provided as-is. Each package retains its original license.

---

**Repository:** https://github.com/Kivot-OS/KivotOS-repo

**APT URL:** https://kivotos-repo.dungdinhmanh0209.workers.dev/

**Worker source:** https://github.com/Kivot-OS/kivotos-repo-worker
