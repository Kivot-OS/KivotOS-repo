# KivotOS APT Repository

Personal APT repository for Debian Trixie (amd64) with curated CLI tools.

**Maintainer:** Dinh Manh Dung (dungdinhmanh0209@gmail.com)

---

##  Quick Start

### 1) Import repository GPG key

```bash
curl -fsSL https://kivotos-repo.dungdinhmanh0209.workers.dev/pubkey.gpg \
| sudo gpg --dearmor -o /etc/apt/keyrings/kivotos.gpg
```

### 2) Add sources list (trixie/main)

```bash
echo "deb [arch=amd64 signed-by=/etc/apt/keyrings/kivotos.gpg] \
https://kivotos-repo.dungdinhmanh0209.workers.dev trixie main" \
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
**APT URL:** https://kivotos-repo.dungdinhmanh0209.workers.dev/  
**Worker source:** https://github.com/kivot-os/kivotos-repo-worker
