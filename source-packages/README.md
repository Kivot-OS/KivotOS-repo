# KivotOS Source Packages

This directory contains source packages for KivotOS APT repository.

## Structure

Each package consists of three files:
- `.dsc` - Package description file
- `.tar.gz` - Original source code
- `.debian.tar.gz` - Debian-specific changes

## Benefits

- **Small size**: Source packages are 90% smaller than binary packages
- **Transparency**: Users can audit source code
- **Flexibility**: Can build for different architectures
- **Professional**: Follows Debian standards

## Usage

Users can install packages normally:
```bash
sudo apt update
sudo apt install yazi-cli yazi-fm
```

APT will automatically:
1. Download source package
2. Build binary locally
3. Install package
