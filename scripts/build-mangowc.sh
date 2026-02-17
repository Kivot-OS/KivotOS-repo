#!/bin/bash
set -e

# Pinned dependency versions - update manually after testing
WLROOTS_VERSION="0.19.2"
SCENEFX_VERSION="0.4.1"

echo "=== Using pinned dependency versions ==="
echo "  wlroots: $WLROOTS_VERSION"
echo "  scenefx: $SCENEFX_VERSION"

# Setup build directories
BUILD_DIR="$(pwd)/../build"
DEPS_DIR="$BUILD_DIR/deps"
mkdir -p "$DEPS_DIR"

# Use local prefix to avoid sudo - install dependencies into build directory
LOCAL_PREFIX="$BUILD_DIR/local"
mkdir -p "$LOCAL_PREFIX"

export PKG_CONFIG_PATH="$LOCAL_PREFIX/lib/pkgconfig:$LOCAL_PREFIX/lib/x86_64-linux-gnu/pkgconfig:$PKG_CONFIG_PATH"
export LD_LIBRARY_PATH="$LOCAL_PREFIX/lib:$LOCAL_PREFIX/lib/x86_64-linux-gnu:$LD_LIBRARY_PATH"

# 1. Build wlroots
echo ""
echo "=== Building wlroots $WLROOTS_VERSION ==="
cd "$DEPS_DIR"

if [ ! -d "wlroots" ]; then
    git clone -b "$WLROOTS_VERSION" https://gitlab.freedesktop.org/wlroots/wlroots.git
fi
cd wlroots

rm -rf build
meson setup build \
    --prefix="$LOCAL_PREFIX" \
    --buildtype=release \
    -Dbackends=drm,libinput \
    -Drenderers=gles2,vulkan \
    -Dexamples=false \
    -Dxwayland=enabled

ninja -C build
ninja -C build install

# 2. Build scenefx
echo ""
echo "=== Building scenefx $SCENEFX_VERSION ==="
cd "$DEPS_DIR"

if [ ! -d "scenefx" ]; then
    git clone -b "$SCENEFX_VERSION" https://github.com/wlrfx/scenefx.git
fi
cd scenefx

rm -rf build
meson setup build \
    --prefix="$LOCAL_PREFIX" \
    --buildtype=release

ninja -C build
ninja -C build install

# 3. Build MangoWC
echo ""
echo "=== Building MangoWC ==="
cd "$(pwd)/../../src"

rm -rf build
meson setup build \
    --prefix=/usr \
    --buildtype=release

ninja -C build

# Copy binaries to expected location for packaging
echo ""
echo "=== Copying binaries ==="
cp build/mangowc "$BUILD_DIR/" 2>/dev/null || true
cp build/mmsg "$BUILD_DIR/" 2>/dev/null || true

echo ""
echo "Build complete!"
ls -la "$BUILD_DIR/"mangowc "$BUILD_DIR/"mmsg 2>/dev/null || ls -la build/mangowc build/mmsg 2>/dev/null
