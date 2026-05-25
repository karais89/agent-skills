#!/bin/bash
# session-start-test.sh - Tests for the SessionStart hook JSON payload

set -euo pipefail

has_jq=0
if command -v jq >/dev/null 2>&1; then
  has_jq=1
fi

NODE_BIN="${NODE_BIN:-}"
if [ -z "$NODE_BIN" ]; then
  for candidate in node node.exe "/mnt/c/Program Files/nodejs/node.exe" "/c/Program Files/nodejs/node.exe"; do
    if command -v "$candidate" >/dev/null 2>&1; then
      NODE_BIN="$candidate"
      break
    fi
    if [ -x "$candidate" ]; then
      NODE_BIN="$candidate"
      break
    fi
  done
fi

if [ -z "$NODE_BIN" ]; then
  echo "SKIP: node is required for session-start-test.sh" >&2
  exit 0
fi

payload="$(bash hooks/session-start.sh)"

 "$NODE_BIN" - "$payload" "$has_jq" <<'NODE'
const payload = JSON.parse(process.argv[2]);
const hasJq = process.argv[3] === '1';

if (hasJq) {
  if (payload.priority !== 'IMPORTANT') {
    throw new Error(`expected IMPORTANT priority, got ${payload.priority}`);
  }

  if (!payload.message.includes('agent-skills loaded.')) {
    throw new Error('message is missing startup preface');
  }

  if (!payload.message.includes('# Using Agent Skills')) {
    throw new Error('message is missing using-agent-skills content');
  }
} else {
  if (payload.priority !== 'INFO') {
    throw new Error(`expected INFO priority when jq is missing, got ${payload.priority}`);
  }

  if (!payload.message.includes('jq is required')) {
    throw new Error('message is missing jq fallback guidance');
  }
}

console.log('session-start JSON payload OK');
NODE
