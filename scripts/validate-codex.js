#!/usr/bin/env node
/*
 * Validates the Codex-specific packaging and simulates SessionStart hook output.
 */

'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
let failures = 0;

function fail(message) {
  failures += 1;
  console.error(`  x ${message}`);
}

function pass(message) {
  console.log(`  ok ${message}`);
}

function readJson(relPath) {
  const fullPath = path.join(root, relPath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, 'utf8'));
  } catch (error) {
    fail(`${relPath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function assert(condition, message) {
  if (condition) pass(message);
  else fail(message);
}

function fileExists(relPath) {
  return fs.existsSync(path.join(root, relPath));
}

function validatePluginManifest() {
  const manifest = readJson('.codex-plugin/plugin.json');
  if (!manifest) return;
  assert(manifest.name === 'agent-skills', 'Codex plugin name is agent-skills');
  assert(manifest.skills === './skills/', 'Codex plugin points at ./skills/');
  assert(!Object.prototype.hasOwnProperty.call(manifest, 'hooks'), 'Codex plugin relies on default hooks/hooks.json for compatibility');
  assert(!Object.prototype.hasOwnProperty.call(manifest, 'commands'), 'Codex plugin omits Claude-only commands field');
  assert(!Object.prototype.hasOwnProperty.call(manifest, 'agents'), 'Codex plugin omits unsupported agents field');
}

function validateMarketplace() {
  const marketplace = readJson('.agents/plugins/marketplace.json');
  if (!marketplace) return;
  const plugin = marketplace.plugins && marketplace.plugins.find((entry) => entry.name === 'agent-skills');
  assert(Boolean(plugin), 'Repo Codex marketplace exposes agent-skills');
  if (!plugin) return;
  assert(plugin.source && plugin.source.source === 'local', 'Marketplace uses a local source');
  assert(plugin.source && plugin.source.path === './', 'Marketplace points at repository root plugin');
  assert(plugin.policy && plugin.policy.installation === 'AVAILABLE', 'Marketplace installation policy is AVAILABLE');
  assert(plugin.policy && plugin.policy.authentication === 'ON_INSTALL', 'Marketplace authentication policy is ON_INSTALL');
  assert(plugin.category === 'Productivity', 'Marketplace category is set');
}

function validateCodexAgents() {
  const agents = [
    '.codex/agents/code-reviewer.toml',
    '.codex/agents/security-auditor.toml',
    '.codex/agents/test-engineer.toml',
  ];
  for (const relPath of agents) {
    if (!fileExists(relPath)) {
      fail(`${relPath} exists`);
      continue;
    }
    const content = fs.readFileSync(path.join(root, relPath), 'utf8');
    assert(/\bname\s*=/.test(content), `${relPath} defines name`);
    assert(/\bdescription\s*=/.test(content), `${relPath} defines description`);
    assert(/\bdeveloper_instructions\s*=/.test(content), `${relPath} defines developer_instructions`);
  }
}

function validateHooks() {
  for (const relPath of ['.codex/hooks.json', 'hooks/hooks.json']) {
    const config = readJson(relPath);
    if (!config) continue;
    const sessionStart = config.hooks && config.hooks.SessionStart;
    assert(Array.isArray(sessionStart) && sessionStart.length > 0, `${relPath} defines SessionStart hooks`);
    const firstCommand = sessionStart && sessionStart[0] && sessionStart[0].hooks && sessionStart[0].hooks[0];
    assert(Boolean(firstCommand && firstCommand.command && /codex-session-start\.js|session-start\.sh/.test(firstCommand.command)), `${relPath} invokes a Codex-compatible SessionStart hook`);
  }
}

function validateSkillMirror() {
  const result = childProcess.spawnSync(process.execPath, ['scripts/sync-codex-skills.js', '--check'], {
    cwd: root,
    encoding: 'utf8'
  });
  if (result.status === 0) {
    pass('skills/ and .agents/skills/ are in sync');
  } else {
    fail(`skills mirror is out of sync\n${result.stdout}${result.stderr}`);
  }
}

function runHook(input, env = {}) {
  const result = childProcess.spawnSync(process.execPath, ['hooks/codex-session-start.js'], {
    cwd: root,
    input,
    encoding: 'utf8',
    env: { ...process.env, ...env }
  });
  if (result.status !== 0) {
    throw new Error(result.stderr || `hook exited ${result.status}`);
  }
  return JSON.parse(result.stdout);
}

function simulateHooks() {
  try {
    const startup = runHook(JSON.stringify({
      hook_event_name: 'SessionStart',
      source: 'startup'
    }));
    assert(startup.hookSpecificOutput && startup.hookSpecificOutput.hookEventName === 'SessionStart', 'SessionStart simulation returns Codex hookSpecificOutput');
    assert(startup.hookSpecificOutput.additionalContext.includes('using-agent-skills'), 'SessionStart context points to using-agent-skills');
    assert(!Object.prototype.hasOwnProperty.call(startup, 'priority'), 'SessionStart output does not use Claude priority payload');

    const invalidInput = runHook('not-json');
    assert(invalidInput.hookSpecificOutput && invalidInput.hookSpecificOutput.additionalContext.includes('Agent Skills'), 'Hook tolerates malformed stdin');

    const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-skills-missing-'));
    const missingSkill = runHook('{}', { AGENT_SKILLS_ROOT: tempRoot });
    assert(Boolean(missingSkill.systemMessage), 'Hook reports a clear message when meta-skill is missing');
    fs.rmSync(tempRoot, { recursive: true, force: true });
  } catch (error) {
    fail(`Hook simulation failed: ${error.message}`);
  }
}

function main() {
  console.log('Codex packaging validation');
  validatePluginManifest();
  validateMarketplace();
  validateCodexAgents();
  validateHooks();
  validateSkillMirror();
  simulateHooks();

  if (failures > 0) {
    console.error(`\nFAILED: ${failures} Codex validation issue(s)`);
    process.exit(1);
  }

  console.log('\nCodex packaging validation PASSED');
}

main();
