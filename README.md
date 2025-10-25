# KivotOS APT Repository

### Packages: yazi-fm, yazi-cli, hellwal, wallust
### Supported: Debian trixie / amd64
### Features: Source packages with binary releases

## 🚀 Quick Installation

### 1) Import repository key
```bash
curl -fsSL https://dungdinhmanh.github.io/KivotOS-repo/pubkey.gpg \
| sudo gpg --dearmor -o /usr/share/keyrings/kivotos.gpg
```

### 2) Add repository (trixie/main)
```bash
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/kivotos.gpg] \
https://dungdinhmanh.github.io/KivotOS-repo/ trixie main" \
| sudo tee /etc/apt/sources.list.d/kivotos.list
```

### 3) Update & install
```bash
sudo apt update
sudo apt install yazi-cli yazi-fm hellwal wallust
```

## 📦 Package Information

| Package | Description | Type | Homepage |
|---------|-------------|------|----------|
| **yazi-cli, yazi-fm** | Blazing fast TUI file manager | Rust | [GitHub](https://github.com/sxyazi/yazi) |
| **hellwal** | Color palette generator (Pywal-like) | C++ | [GitHub](https://github.com/danihek/hellwal) |
| **wallust** | Generate color palettes for wallpapers | Rust | [Codeberg](https://codeberg.org/explosion-mental/wallust) |

## 🔧 Advanced Usage

### Source Packages
This repository provides source packages for transparency and customization:
- **Small size**: 90% smaller than binary packages
- **Transparent**: Full source code available
- **Customizable**: Build with your own options
- **Secure**: GPG signed source packages

### Binary Releases
Pre-built binary packages are available on [GitHub Releases](https://github.com/dungdinhmanh/KivotOS-repo/releases):
- **Fast installation**: No compilation required
- **Multiple architectures**: amd64 support
- **Automatic updates**: Via APT

## 🛠️ Building from Source

If you prefer to build from source:
```bash
# Install build dependencies
sudo apt install build-essential rustc cargo cmake pkg-config

# Clone and build
git clone https://github.com/sxyazi/yazi.git
cd yazi
cargo build --release
```
# Troubleshooting
```bash
# Reset apt lists if signature split errors occur
sudo rm -rf /var/lib/apt/lists/*
sudo mkdir -p /var/lib/apt/lists/partial
sudo apt update
```

# Removed the repo
```bash
sudo rm /etc/apt/sources.list.d/kivotos.list
sudo rm /usr/share/keyrings/kivotos.gpg
sudo apt update
```
