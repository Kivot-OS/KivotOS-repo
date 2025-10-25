#!/bin/bash
# Test script for KivotOS repository installation

set -euo pipefail

echo "🧪 Testing KivotOS repository installation..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    print_error "This script should not be run as root"
    exit 1
fi

# Check if we're on Debian/Ubuntu
if ! command -v apt &> /dev/null; then
    print_error "This script requires apt (Debian/Ubuntu)"
    exit 1
fi

# Check if we're on trixie
if ! grep -q "trixie" /etc/os-release 2>/dev/null; then
    print_warning "This repository is designed for Debian trixie"
    print_warning "Proceeding anyway..."
fi

echo "📋 System information:"
echo "  OS: $(lsb_release -d | cut -f2)"
echo "  Architecture: $(uname -m)"
echo "  User: $(whoami)"

# Test 1: Check if repository key exists
echo ""
echo "🔑 Testing repository key..."
if [[ -f "/usr/share/keyrings/kivotos.gpg" ]]; then
    print_status "Repository key found"
else
    print_warning "Repository key not found - will be imported during installation"
fi

# Test 2: Check if repository is added
echo ""
echo "📦 Testing repository configuration..."
if grep -q "kivotos" /etc/apt/sources.list.d/*.list 2>/dev/null; then
    print_status "Repository configuration found"
    grep "kivotos" /etc/apt/sources.list.d/*.list
else
    print_warning "Repository not configured - will be added during installation"
fi

# Test 3: Test package availability
echo ""
echo "🔍 Testing package availability..."
if command -v apt-cache &> /dev/null; then
    echo "Available packages:"
    apt-cache search kivotos 2>/dev/null || echo "  No packages found (repository not added yet)"
else
    print_warning "apt-cache not available"
fi

# Test 4: Check for required dependencies
echo ""
echo "🔧 Checking build dependencies..."
MISSING_DEPS=()

# Check for build tools
for dep in gcc g++ make cmake pkg-config; do
    if ! command -v "$dep" &> /dev/null; then
        MISSING_DEPS+=("$dep")
    fi
done

# Check for Rust (for yazi, wallust)
if ! command -v cargo &> /dev/null; then
    MISSING_DEPS+=("rustc")
fi

if [[ ${#MISSING_DEPS[@]} -gt 0 ]]; then
    print_warning "Missing build dependencies: ${MISSING_DEPS[*]}"
    echo "  Install with: sudo apt install ${MISSING_DEPS[*]}"
else
    print_status "All build dependencies available"
fi

# Test 5: Check disk space
echo ""
echo "💾 Checking disk space..."
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
if [[ $AVAILABLE_SPACE -lt 1000000 ]]; then  # Less than 1GB
    print_warning "Low disk space: ${AVAILABLE_SPACE}KB available"
    print_warning "Source packages require ~100MB for building"
else
    print_status "Sufficient disk space: ${AVAILABLE_SPACE}KB available"
fi

# Test 6: Check network connectivity
echo ""
echo "🌐 Testing network connectivity..."
if curl -s --max-time 10 https://dungdinhmanh.github.io/KivotOS-repo/ > /dev/null; then
    print_status "Repository accessible"
else
    print_error "Cannot access repository"
    print_error "Check your internet connection"
fi

# Test 7: Check GPG
echo ""
echo "🔐 Testing GPG..."
if command -v gpg &> /dev/null; then
    print_status "GPG available"
else
    print_warning "GPG not found - required for repository verification"
fi

echo ""
echo "📊 Test Summary:"
echo "  Repository: KivotOS APT Repository"
echo "  Packages: yazi-cli, yazi-fm, hellwal, wallust"
echo "  Architecture: amd64"
echo "  Distribution: trixie"

echo ""
echo "🚀 Ready for installation!"
echo "  Run: sudo apt update && sudo apt install yazi-cli yazi-fm"
echo ""
echo "📖 For more information, see: https://dungdinhmanh.github.io/KivotOS-repo/"
