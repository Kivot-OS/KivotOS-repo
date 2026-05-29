FROM ghcr.io/kivot-os/base:latest AS builder

ENV DEBIAN_FRONTEND=noninteractive

# Build toolchain
RUN apt-get update -q && apt-get install -y --no-install-recommends \
    build-essential \
    devscripts \
    debhelper \
    dh-make \
    fakeroot \
    dpkg-dev \
    \
    # Version control
    git \
    jq \
    \
    # Rust
    cargo \
    rustc \
    rust-src \
    \
    # C/C++
    g++ \
    clang \
    lld \
    cmake \
    meson \
    ninja-build \
    pkg-config \
    \
    # Compression
    zstd \
    lz4 \
    xz-utils \
    \
    # Python
    python3 \
    python3-pip \
    python3-apt \
    \
    # Kernel build
    bc \
    bison \
    flex \
    libssl-dev \
    libelf-dev \
    libncurses-dev \
    cpio \
    kmod \
    \
    # GPU driver build
    libdrm-dev \
    libgbm-dev \
    libgudev-dev \
    libegl1-mesa-dev \
    libgl1-mesa-dev \
    mesa-common-dev \
    \
    # Qt/Kirigami (for GUI tools)
    qtbase5-dev \
    qt6-base-dev \
    libkf6kirigami2-dev \
    \
    # sched_ext / BPF
    libbpf-dev \
    libbpf1 \
    llvm \
    \
    # Packaging tools
    nfpm \
    aptly \
    rclone \
    \
    # Utilities
    rsync \
    wget \
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/*

# Rust nightly cho awww package
RUN rustup toolchain install nightly || true

WORKDIR /workspace
