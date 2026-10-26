#!/usr/bin/env bash
# Start Cymbal Travels backend (FastAPI :8470) and frontend (Vite :5173).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Backend
cd "$ROOT/backend"
if [ ! -d .venv ]; then
  uv venv .venv && uv pip install -r requirements.txt
fi
set -a; [ -f "$ROOT/.env" ] && . "$ROOT/.env"; set +a
.venv/bin/python -m app.main &
BACKEND_PID=$!
echo "backend pid $BACKEND_PID on :${PORT:-8470}"

# Frontend
cd "$ROOT/frontend"
[ -d node_modules ] || npm install
npm run dev &
FRONTEND_PID=$!
echo "frontend pid $FRONTEND_PID (Vite)"

echo "$BACKEND_PID $FRONTEND_PID" > "$ROOT/.pids"
echo "Open the Vite URL printed above. Ctrl-C then ./stop.sh to stop."
wait
