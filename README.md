# KivotOS APT Repository

Personal APT repository for Debian Trixie (amd64) with curated CLI tools.

**Maintainer:** Dinh Manh Dung (dungdinhmanh0209@gmail.com)

---

## 📦 Available Packages

| Package | Description | Source |
|---------|-------------|--------|
| **yazi** | Blazing fast terminal file manager | [sxyazi/yazi](https://github.com/sxyazi/yazi) |
| **hellwal** | Color palette generator (Pywal-like) in C++ | [danihek/hellwal](https://github.com/danihek/hellwal) |
| **wallust** | Generate color palettes from images | [explosion-mental/wallust](https://codeberg.org/explosion-mental/wallust) |
| **matugen** | Material You color generation tool | [InioX/matugen](https://github.com/InioX/matugen) |

---

## 🚀 Quick Start

### 1) Import repository GPG key

```bash
curl -fsSL https://kivot-os.github.io/KivotOS-repo/pubkey.gpg \
| sudo gpg --dearmor -o /usr/share/keyrings/kivotos.gpg
```

### 2) Add sources list (trixie/main)

```bash
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/kivotos.gpg] \
https://kivot-os.github.io/KivotOS-repo/ trixie main" \
| sudo tee /etc/apt/sources.list.d/kivotos.list
```

### 3) Update & install

```bash
sudo apt update
sudo apt install yazi hellwal wallust matugen
```

---

## 🛠️ Troubleshooting

### Reset apt lists

```bash
sudo rm -rf /var/lib/apt/lists/*
sudo mkdir -p /var/lib/apt/lists/partial
sudo apt update
```

---

## 🗑️ Remove the repository

```bash
sudo rm /etc/apt/sources.list.d/kivotos.list
sudo rm /usr/share/keyrings/kivotos.gpg
sudo apt update
```

---

## 📄 License

This repository configuration is provided as-is. Each package retains its original license.

---

**Repository:** https://github.com/kivot-os/KivotOS-repo  
**APT URL:** https://kivot-os.github.io/KivotOS-repo/
