#!/bin/bash
#
# Build script for mangowc.
#
# Debian Trixie ships pixman/wayland that are too old for wlroots 0.19, and
# does not ship wlroots 0.19 or scenefx at all — so we vendor those four deps
# into a local prefix, then build mangowc against that prefix.
#
# Invoked from CI with cwd = src/ (mangowc source root).
# Output: src/build/mangowc, src/build/mmsg (picked up by nfpm).
#
set -euo pipefail

PIXMAN_VERSION="0.43.4"
WAYLAND_VERSION="1.23.1"
LIBINPUT_VERSION="1.27.1"
WLROOTS_VERSION="0.19.2"
SCENEFX_VERSION="0.4.1"

SRC_DIR="$(pwd)"
ROOT_DIR="$(cd .. && pwd)"
DEPS_DIR="$ROOT_DIR/build/deps"
LOCAL_PREFIX="$ROOT_DIR/build/local"
mkdir -p "$DEPS_DIR" "$LOCAL_PREFIX"

export PKG_CONFIG_PATH="$LOCAL_PREFIX/lib/pkgconfig:$LOCAL_PREFIX/lib/x86_64-linux-gnu/pkgconfig:${PKG_CONFIG_PATH:-}"
export LD_LIBRARY_PATH="$LOCAL_PREFIX/lib:$LOCAL_PREFIX/lib/x86_64-linux-gnu:${LD_LIBRARY_PATH:-}"

echo "=== Pinned dependency versions ==="
echo "  pixman:   $PIXMAN_VERSION"
echo "  wayland:  $WAYLAND_VERSION"
echo "  libinput: $LIBINPUT_VERSION"
echo "  wlroots:  $WLROOTS_VERSION"
echo "  scenefx:  $SCENEFX_VERSION"
echo "  prefix:   $LOCAL_PREFIX"
echo ""

# Stamp file lets a cache-restored prefix skip the rebuild.
build_dep() {
  local name="$1" version="$2" url="$3" tag="$4"
  shift 4
  local meson_args=("$@")

  echo ""
  echo "=== $name $version ==="
  cd "$DEPS_DIR"

  if [ ! -d "$name" ]; then
    git clone --depth=1 -b "$tag" "$url" "$name"
  else
    echo "  (cached: skipping clone)"
  fi
  cd "$name"

  local stamp="$LOCAL_PREFIX/.${name}-${version}.stamp"
  if [ -f "$stamp" ]; then
    echo "  (stamp present: skipping rebuild)"
    return 0
  fi

  rm -rf build
  meson setup build --prefix="$LOCAL_PREFIX" --buildtype=release "${meson_args[@]}"
  ninja -C build
  ninja -C build install
  touch "$stamp"
}

build_dep pixman "$PIXMAN_VERSION" \
  "https://gitlab.freedesktop.org/pixman/pixman.git" "pixman-$PIXMAN_VERSION"

build_dep wayland "$WAYLAND_VERSION" \
  "https://gitlab.freedesktop.org/wayland/wayland.git" "$WAYLAND_VERSION" \
  -Ddocumentation=false -Dtests=false

build_dep libinput "$LIBINPUT_VERSION" \
  "https://gitlab.freedesktop.org/libinput/libinput.git" "$LIBINPUT_VERSION" \
  -Ddebug-gui=false -Dtests=false -Dlibwacom=false -Ddocumentation=false

build_dep wlroots "$WLROOTS_VERSION" \
  "https://gitlab.freedesktop.org/wlroots/wlroots.git" "$WLROOTS_VERSION" \
  -Dbackends=drm,libinput -Drenderers=gles2 -Dexamples=false -Dxwayland=enabled

build_dep scenefx "$SCENEFX_VERSION" \
  "https://github.com/wlrfx/scenefx.git" "$SCENEFX_VERSION"

echo ""
echo "=== Building mangowc ==="
cd "$SRC_DIR"

rm -rf build
meson setup build --prefix=/usr --buildtype=release
ninja -C build

echo ""
echo "✅ Build complete:"
ls -lh build/mangowc build/mmsg
