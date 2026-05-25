# Codex setup

This repository is packaged for Codex in three complementary ways:

- Repo-scoped skills in `.agents/skills/`, which Codex discovers when you launch from this repository.
- Project guidance and subagents in `AGENTS.md` and `.codex/agents/`.
- An installable Codex plugin via `plugins/agent-skills/.codex-plugin/plugin.json` and `.agents/plugins/marketplace.json`.

## Local repository use

Clone the repository and start Codex from the repo root:

```bash
git clone https://github.com/karais89/agent-skills.git
cd agent-skills
codex
```

Codex reads `AGENTS.md` as durable project guidance and scans `.agents/skills/` for repo-local skills. Use `/skills` or `$skill-name` for explicit invocation, or describe the task and let Codex choose from skill descriptions.

When editing skills, update `skills/` as the source directory, then mirror it for Codex:

```bash
node scripts/sync-codex-skills.js
node scripts/sync-codex-skills.js --check
```

## Install as a Codex plugin

The repository includes a Codex plugin at `plugins/agent-skills`. Add the repository as a marketplace source, then install `agent-skills` from the plugin browser:

```bash
codex plugin marketplace add karais89/agent-skills
```

Inside Codex, open `/plugins`, choose the `Agent Skills for Codex` marketplace, and install `agent-skills`.

The plugin bundles:

- `plugins/agent-skills/skills/` through `plugins/agent-skills/.codex-plugin/plugin.json`
- Codex lifecycle context through the default `hooks/hooks.json`
- Install-surface metadata through the plugin manifest

Plugin hooks must be reviewed and trusted before Codex runs them. Open `/hooks` after installation if Codex reports untrusted hooks.

## Custom subagents

Project-scoped custom agents live in `.codex/agents/`:

- `code-reviewer`: read-only staff-level review
- `security-auditor`: read-only security review
- `test-engineer`: test strategy and behavior-focused test implementation

Ask Codex to spawn them explicitly when useful, for example:

```text
Review this branch against main. Spawn code-reviewer, security-auditor, and test-engineer in parallel, wait for all results, then summarize blockers.
```

## Hooks

Project hooks live in `.codex/hooks.json`. Plugin hooks use the default `plugins/agent-skills/hooks/hooks.json` file so the plugin manifest stays compatible with the current Codex validator.

Both paths end at `hooks/codex-session-start.js`, either directly or through the compatibility wrapper in `hooks/session-start.sh`. The Codex hook emits `hookSpecificOutput.additionalContext`. It deliberately keeps startup context concise and points Codex at `using-agent-skills` instead of injecting the full meta-skill into every session.

## Validation

Run the full local validation set before publishing changes:

```bash
node scripts/validate-skills.js
node scripts/validate-codex.js
bash hooks/session-start-test.sh
bash hooks/simplify-ignore-test.sh
```

`validate-codex.js` checks the plugin manifest, marketplace metadata, custom agents, hook configs, skill mirror, and SessionStart hook behavior under normal, malformed-input, and missing-meta-skill scenarios.
