#!/usr/bin/env node
/*
 * Smoke tests for scripts/install-codex-project.js.
 */

'use strict';

const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const installer = path.join(root, 'scripts', 'install-codex-project.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function run(args, options = {}) {
  return childProcess.spawnSync(process.execPath, [installer, ...args], {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });
}

function makeTarget() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'agent-skills-install-'));
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function main() {
  const targets = [];
  try {
    const fullTarget = makeTarget();
    targets.push(fullTarget);
    fs.mkdirSync(path.join(fullTarget, '.git'));

    const full = run(['--target', fullTarget, '--profile', 'codex']);
    assert(full.status === 0, `codex profile install failed:\n${full.stdout}\n${full.stderr}`);
    assert(fs.existsSync(path.join(fullTarget, '.agents', 'skills', 'using-agent-skills', 'SKILL.md')), 'skills were installed');
    assert(fs.existsSync(path.join(fullTarget, '.codex', 'agents', 'code-reviewer.toml')), 'agents were installed');
    assert(fs.existsSync(path.join(fullTarget, 'hooks', 'codex-session-start.js')), 'hook runtime was installed');
    assert(JSON.stringify(readJson(path.join(fullTarget, '.codex', 'hooks.json'))).includes('codex-session-start.js'), 'hook config was installed');
    assert(!fs.existsSync(path.join(fullTarget, '.codex', 'config.toml')), 'config is not installed by default');

    const mergedTarget = makeTarget();
    targets.push(mergedTarget);
    fs.mkdirSync(path.join(mergedTarget, '.git'));
    fs.mkdirSync(path.join(mergedTarget, '.codex'), { recursive: true });
    fs.writeFileSync(path.join(mergedTarget, '.codex', 'hooks.json'), JSON.stringify({
      hooks: {
        SessionStart: [
          {
            hooks: [
              {
                type: 'command',
                command: 'echo existing',
              },
            ],
          },
        ],
      },
    }, null, 2));

    const merged = run(['--target', mergedTarget, '--profile', 'codex']);
    assert(merged.status === 0, `hook merge install failed:\n${merged.stdout}\n${merged.stderr}`);
    const mergedHooks = readJson(path.join(mergedTarget, '.codex', 'hooks.json')).hooks.SessionStart;
    assert(mergedHooks.length === 2, 'existing hook config receives appended SessionStart entry');
    assert(JSON.stringify(mergedHooks[0]).includes('echo existing'), 'existing hook entry is preserved');
    assert(JSON.stringify(mergedHooks[1]).includes('codex-session-start.js'), 'agent-skills hook entry is appended');

    const conflictTarget = makeTarget();
    targets.push(conflictTarget);
    fs.mkdirSync(path.join(conflictTarget, '.codex', 'agents'), { recursive: true });
    fs.writeFileSync(path.join(conflictTarget, '.codex', 'agents', 'code-reviewer.toml'), 'changed = true\n');

    const conflict = run(['--target', conflictTarget, '--agents']);
    assert(conflict.status !== 0, 'conflicting managed agent file is rejected without --force');
    assert(conflict.stderr.includes('--force'), 'conflict error suggests --force');

    const forced = run(['--target', conflictTarget, '--agents', '--force']);
    assert(forced.status === 0, `force install failed:\n${forced.stdout}\n${forced.stderr}`);
    assert(fs.readFileSync(path.join(conflictTarget, '.codex', 'agents', 'code-reviewer.toml'), 'utf8').includes('name = "code-reviewer"'), 'force updates managed agent file');

    const configTarget = makeTarget();
    targets.push(configTarget);
    const config = run(['--target', configTarget, '--profile', 'skills', '--config']);
    assert(config.status === 0, `config opt-in install failed:\n${config.stdout}\n${config.stderr}`);
    assert(fs.existsSync(path.join(configTarget, '.codex', 'config.toml')), 'config installs only when requested');

    console.log('install-codex-project tests PASSED');
  } finally {
    for (const target of targets) {
      fs.rmSync(target, { recursive: true, force: true });
    }
  }
}

main();
