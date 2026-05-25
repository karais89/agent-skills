#!/usr/bin/env node
/*
 * Codex SessionStart hook for agent-skills.
 *
 * Emits Codex-shaped JSON that adds concise context without injecting the full
 * meta-skill into every session. Full skill instructions remain available via
 * Codex progressive disclosure from .agents/skills or the plugin skills path.
 */

'use strict';

const fs = require('fs');
const path = require('path');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function parseInput(raw) {
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function findRoot() {
  const explicit = process.env.AGENT_SKILLS_ROOT || process.env.PLUGIN_ROOT || process.env.CLAUDE_PLUGIN_ROOT;
  if (explicit) return path.resolve(explicit);
  return path.resolve(__dirname, '..');
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function main() {
  const input = parseInput(readStdin());
  const root = findRoot();
  const metaSkillCandidates = [
    path.join(root, '.agents', 'skills', 'using-agent-skills', 'SKILL.md'),
    path.join(root, 'skills', 'using-agent-skills', 'SKILL.md'),
  ];
  const metaSkillPath = metaSkillCandidates.find(fileExists);
  const eventName = input.hook_event_name || 'SessionStart';

  if (!metaSkillPath) {
    process.stdout.write(JSON.stringify({
      systemMessage: 'agent-skills: using-agent-skills was not found; installed skills may still be available individually.',
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: 'Agent Skills context could not locate using-agent-skills. Continue with any available skills and repository instructions.'
      }
    }));
    return;
  }

  const relativeMetaSkill = path.relative(root, metaSkillPath).split(path.sep).join('/');
  const additionalContext = [
    'Agent Skills is available in this workspace.',
    'Use Codex skill discovery and progressive disclosure rather than pasting every skill into context.',
    `For task-to-skill routing, invoke or read ${relativeMetaSkill}.`,
    'For specialist review, use project subagents code-reviewer, security-auditor, and test-engineer when the user asks for parallel review or explicit subagent validation.',
    'Do not skip a skill workflow when its description clearly matches the user task.'
  ].join(' ');

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext
    }
  }));
}

main();
