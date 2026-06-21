#!/bin/zsh
set -e

ROOT="${0:A:h}"
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

if ! nc -z 127.0.0.1 8080 >/dev/null 2>&1; then
  echo "The backend is not running. Start the backend first."
  read "?Press Enter to close."
  exit 1
fi

cd "$ROOT"
echo "Starting the SafeHer frontend on port 8081..."
echo "Open http://127.0.0.1:8081/ in your browser."
npm run dev -- --host 127.0.0.1 --port 8081
