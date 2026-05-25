#!/bin/bash
# session-start-test.sh - Tests for the Codex SessionStart hook JSON payload

set -euo pipefail

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

payload="$(printf '%s' '{"hook_event_name":"SessionStart","source":"startup"}' | bash hooks/session-start.sh)"

"$NODE_BIN" - "$payload" <<'NODE'
const payload = JSON.parse(process.argv[2]);

if (Object.prototype.hasOwnProperty.call(payload, 'priority')) {
  throw new Error('Codex hook output must not use legacy priority payloads');
}

if (!payload.hookSpecificOutput) {
  throw new Error('missing hookSpecificOutput');
}

if (payload.hookSpecificOutput.hookEventName !== 'SessionStart') {
  throw new Error(`expected SessionStart event, got ${payload.hookSpecificOutput.hookEventName}`);
}

if (!payload.hookSpecificOutput.additionalContext.includes('using-agent-skills')) {
  throw new Error('additionalContext should point to using-agent-skills');
}

console.log('Codex session-start JSON payload OK');
NODE
