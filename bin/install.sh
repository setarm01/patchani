#!/usr/bin/env bash
# Downloads the github-mcp-server binary for the current platform.
# Idempotent — skips download if binary already exists and version matches.
set -euo pipefail

VERSION="1.5.0"
TARGET_DIR="$(cd "$(dirname "$0")" && pwd)"
TARGET="$TARGET_DIR/github-mcp-server"
BASE_URL="https://github.com/github/github-mcp-server/releases/download/v${VERSION}"

os=$(uname -s)
arch=$(uname -m)

case "$os" in
  Darwin) os_tag="Darwin" ;;
  Linux)  os_tag="Linux" ;;
  *) echo "Unsupported OS: $os" >&2; exit 1 ;;
esac

case "$arch" in
  arm64|aarch64) arch_tag="arm64" ;;
  x86_64)        arch_tag="x86_64" ;;
  i386|i686)     arch_tag="i386" ;;
  *) echo "Unsupported arch: $arch" >&2; exit 1 ;;
esac

ARCHIVE="github-mcp-server_${os_tag}_${arch_tag}.tar.gz"
URL="${BASE_URL}/${ARCHIVE}"

if [ -x "$TARGET" ] && "$TARGET" --version 2>/dev/null | grep -qF "$VERSION"; then
  echo "github-mcp-server v${VERSION} already installed."
  exit 0
fi

echo "Downloading github-mcp-server v${VERSION} for ${os_tag}/${arch_tag}..."
curl -fsSL "$URL" | tar -xz -C "$TARGET_DIR" github-mcp-server
chmod +x "$TARGET"
echo "Installed: $TARGET"
"$TARGET" --version
