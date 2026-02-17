# MangoWC Package Setup for KivotOS Repo

## Overview

Successfully added MangoWC (Wayland compositor) to KivotOS APT repository with all dependencies built from source.

## Build Chain

```
pixman 0.43.4 → wayland 1.23.1 → wlroots 0.19.2 → scenefx 0.4.1 → mangowc 0.12.2
```

## Files Created/Modified

### Package Definition
- [`packages/mangowc.toml`](packages/mangowc.toml) - MangoWC package configuration

### Build Script
- [`scripts/build-mangowc.sh`](scripts/build-mangowc.sh) - Multi-stage build script

### Workflow Updates
- [`.github/workflows/build.yml`](.github/workflows/build.yml) - Added ninja build type, package deps installation
- [`scripts/manager.py`](scripts/manager.py) - Added post_build field to matrix

## Dependencies Build Order

| Order | Package | Version | Reason |
|-------|---------|---------|--------|
| 1 | pixman | 0.43.4 | wlroots requires >= 0.43.0 |
| 2 | wayland | 1.23.1 | wlroots requires >= 1.23.1 |
| 3 | wlroots | 0.19.2 | Core Wayland compositor lib |
| 4 | scenefx | 0.4.1 | Visual effects library |
| 5 | mangowc | 0.12.2 | Wayland compositor |

## Build Dependencies Added

```toml
[depends]
build = [
    "git", "meson", "ninja-build", "pkg-config", "cmake",
    "libxml2-dev", "libffi-dev",          # for wayland
    "libegl-dev", "libgles2-mesa-dev",    # for wlroots GLES2
    "libgbm-dev",                         # for wlroots DRM
    "libxcb-ewmh-dev",                    # for Xwayland
    "libwayland-dev", "wayland-protocols",
    "libinput-dev", "libdrm-dev", "libxkbcommon-dev",
    "libpixman-1-dev", "libdisplay-info-dev",
    "libliftoff-dev", "hwdata", "libseat-dev",
    "libpcre2-dev", "xwayland",
    "libxcb1-dev", "libxcb-composite0-dev",
    "libxcb-icccm4-dev", "libxcb-res0-dev",
    "libc6-dev"
]
```

## Key Implementation Details

### Local Prefix Build
All dependencies built to local prefix (`$BUILD_DIR/local`) to avoid sudo:

```bash
LOCAL_PREFIX="$BUILD_DIR/local"
export PKG_CONFIG_PATH="$LOCAL_PREFIX/lib/pkgconfig:$PKG_CONFIG_PATH"
```

### Version Pinning
MangoWC version pinned to `0.12.2` (not "latest") for reproducible builds and dpkg compliance.

### Ninja Build Type
Added `ninja` type to workflow for meson-based projects:

```yaml
elif [[ "${{ matrix.type }}" == "ninja" ]]; then
    meson setup build --prefix=/usr --buildtype=release
    ninja -C build
```

## Troubleshooting History

| Issue | Fix |
|-------|-----|
| wayland-server 1.22.0 too old | Build wayland 1.23.1 from source |
| pixman 0.42.2 too old | Build pixman 0.43.4 from source |
| EGL not found | Add `libegl-dev`, `libgles2-mesa-dev` |
| GBM not found | Add `libgbm-dev` |
| xcb-ewmh not found | Add `libxcb-ewmh-dev` |
| "latest" version invalid | Pin to `0.12.2` |
| Wrong src path | Fix relative path in script |
| ls exit code 2 | Add fallback message |

## Installation

Users can now install via:

```bash
# Add KivotOS repo
echo "deb https://kivot-os.github.io/KivotOS-repo trixie main" | sudo tee /etc/apt/sources.list.d/kivotos.list

# Install MangoWC
sudo apt update
sudo apt install mangowc
```

## References

- [MangoWC GitHub](https://github.com/DreamMaoMao/mangowc)
- [wlroots GitLab](https://gitlab.freedesktop.org/wlroots/wlroots)
- [scenefx GitHub](https://github.com/wlrfx/scenefx)
