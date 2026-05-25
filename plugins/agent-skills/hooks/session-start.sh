#!/bin/bash
# Codex SessionStart hook wrapper for agent-skills.

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

to_windows_path() {
  case "$1" in
    /mnt/[a-zA-Z]/*)
      drive="$(printf '%s' "$1" | cut -c6 | tr '[:lower:]' '[:upper:]')"
      rest="${1#/mnt/?/}"
      printf '%s:\\%s' "$drive" "$(printf '%s' "$rest" | tr '/' '\\')"
      ;;
    *)
      printf '%s' "$1"
      ;;
  esac
}

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

if [ -n "$NODE_BIN" ]; then
  ROOT_DIR="$(dirname "$SCRIPT_DIR")"
  SCRIPT_PATH="$SCRIPT_DIR/codex-session-start.js"
  if "$NODE_BIN" -e "process.exit(process.platform === 'win32' ? 0 : 1)" >/dev/null 2>&1; then
    if command -v cygpath >/dev/null 2>&1; then
      ROOT_DIR="$(cygpath -w "$ROOT_DIR")"
      SCRIPT_PATH="$(cygpath -w "$SCRIPT_PATH")"
    else
      ROOT_DIR="$(to_windows_path "$ROOT_DIR")"
      SCRIPT_PATH="$(to_windows_path "$SCRIPT_PATH")"
    fi
  fi
  AGENT_SKILLS_ROOT="$ROOT_DIR" "$NODE_BIN" "$SCRIPT_PATH"
  exit 0
fi

printf '%s\n' '{"hookSpecificOutput":{"hookEventName":"SessionStart","additionalContext":"Agent Skills is available, but node was not found so the Codex startup helper could not run. Use .agents/skills or plugin skills directly."}}'
