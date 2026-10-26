#!/usr/bin/env bash
# Stop the processes started by start.sh.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$ROOT/.pids" ]; then
  kill $(cat "$ROOT/.pids") 2>/dev/null || true
  rm -f "$ROOT/.pids"
  echo "stopped."
else
  echo "no .pids file; nothing to stop."
fi
