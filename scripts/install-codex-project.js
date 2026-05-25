#!/usr/bin/env node
/*
 * Installs this repository's Codex project pack into another project.
 *
 * Profiles:
 *   skills: copy skills/ into <target>/.agents/skills/
 *   codex:  skills + SessionStart hook + .codex/agents/
 *
 * Existing unrelated files are preserved. Managed files are overwritten only
 * with --force.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const source = {
  skills: path.join(root, 'skills'),
  agents: path.join(root, '.codex', 'agents'),
  hooksConfig: path.join(root, '.codex', 'hooks.json'),
  hooksRuntime: [
    path.join(root, 'hooks', 'codex-session-start.js'),
    path.join(root, 'hooks', 'session-start.sh'),
  ],
  config: path.join(root, '.codex', 'config.toml'),
};

const HOOK_MARKER = 'codex-session-start.js';

function usage() {
  console.log(`Usage:
  npx github:karais89/agent-skills [options]
  node scripts/install-codex-project.js [options]

Options:
  --target <project>        Install into this directory. Default: current directory.
  --config                 Also install .codex/config.toml. Not included by default.
  --force                  Overwrite managed files when they differ.
  --dry-run                Print actions without writing files.
  --help                   Show this help.

Examples:
  npx github:karais89/agent-skills
  npx github:karais89/agent-skills --force
  node scripts/install-codex-project.js --target ../my-app
`);
}

function parseArgs(argv) {
  const args = {
    target: null,
    profile: 'codex',
    force: false,
    dryRun: false,
    components: new Set(),
    includeConfig: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--target') {
      args.target = argv[++i];
    } else if (arg.startsWith('--target=')) {
      args.target = arg.slice('--target='.length);
    } else if (arg === '--profile') {
      args.profile = argv[++i];
    } else if (arg.startsWith('--profile=')) {
      args.profile = arg.slice('--profile='.length);
    } else if (arg === '--skills') {
      args.components.add('skills');
    } else if (arg === '--hooks') {
      args.components.add('hooks');
    } else if (arg === '--agents') {
      args.components.add('agents');
    } else if (arg === '--config') {
      args.includeConfig = true;
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return args;
}

function normalizeRel(filePath, base) {
  return path.relative(base, filePath).split(path.sep).join('/');
}

function walkFiles(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full, base));
    } else if (entry.isFile()) {
      files.push(normalizeRel(full, base));
    }
  }
  return files.sort();
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function treesMatch(srcDir, destDir) {
  const sourceFiles = walkFiles(srcDir);
  const destFiles = walkFiles(destDir);
  if (sourceFiles.length !== destFiles.length) return false;
  for (let i = 0; i < sourceFiles.length; i += 1) {
    if (sourceFiles[i] !== destFiles[i]) return false;
    if (hashFile(path.join(srcDir, sourceFiles[i])) !== hashFile(path.join(destDir, destFiles[i]))) {
      return false;
    }
  }
  return true;
}

function filesMatch(srcFile, destFile) {
  return fs.existsSync(destFile) && hashFile(srcFile) === hashFile(destFile);
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isFile()) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

function formatTarget(target, filePath) {
  return normalizeRel(filePath, target);
}

function makeInstaller(target, options) {
  const actions = [];
  const warnings = [];

  function record(kind, message) {
    actions.push({ kind, message });
  }

  function ensureFile(srcFile, destFile, label) {
    if (fs.existsSync(destFile)) {
      if (filesMatch(srcFile, destFile)) {
        record('ok', `${label}: unchanged ${formatTarget(target, destFile)}`);
        return;
      }
      if (!options.force) {
        throw new Error(`${label}: refusing to overwrite ${formatTarget(target, destFile)}; rerun with --force`);
      }
      record('update', `${label}: overwrite ${formatTarget(target, destFile)}`);
    } else {
      record('create', `${label}: create ${formatTarget(target, destFile)}`);
    }

    if (!options.dryRun) copyRecursive(srcFile, destFile);
  }

  function ensureDirectoryUnit(srcDir, destDir, label) {
    if (fs.existsSync(destDir)) {
      if (treesMatch(srcDir, destDir)) {
        record('ok', `${label}: unchanged ${formatTarget(target, destDir)}`);
        return;
      }
      if (!options.force) {
        throw new Error(`${label}: refusing to overwrite ${formatTarget(target, destDir)}; rerun with --force`);
      }
      record('update', `${label}: replace ${formatTarget(target, destDir)}`);
      if (!options.dryRun) fs.rmSync(destDir, { recursive: true, force: true });
    } else {
      record('create', `${label}: create ${formatTarget(target, destDir)}`);
    }

    if (!options.dryRun) copyRecursive(srcDir, destDir);
  }

  function installSkills() {
    const destRoot = path.join(target, '.agents', 'skills');
    for (const entry of fs.readdirSync(source.skills, { withFileTypes: true }).filter((entry) => entry.isDirectory())) {
      ensureDirectoryUnit(
        path.join(source.skills, entry.name),
        path.join(destRoot, entry.name),
        `skill ${entry.name}`
      );
    }
  }

  function installAgents() {
    const destRoot = path.join(target, '.codex', 'agents');
    for (const entry of fs.readdirSync(source.agents, { withFileTypes: true }).filter((entry) => entry.isFile())) {
      ensureFile(
        path.join(source.agents, entry.name),
        path.join(destRoot, entry.name),
        `agent ${entry.name}`
      );
    }
  }

  function hasAgentSkillsHook(config) {
    const sessionStart = config.hooks && config.hooks.SessionStart;
    if (!Array.isArray(sessionStart)) return false;
    return sessionStart.some((entry) =>
      JSON.stringify(entry).includes(HOOK_MARKER)
    );
  }

  function installHooks() {
    for (const runtimeFile of source.hooksRuntime) {
      ensureFile(runtimeFile, path.join(target, 'hooks', path.basename(runtimeFile)), `hook ${path.basename(runtimeFile)}`);
    }

    const sourceConfig = JSON.parse(fs.readFileSync(source.hooksConfig, 'utf8'));
    const destConfigPath = path.join(target, '.codex', 'hooks.json');

    if (!fs.existsSync(path.join(target, '.git'))) {
      warnings.push('SessionStart hook uses git rev-parse --show-toplevel; run inside a git repository or adjust .codex/hooks.json.');
    }

    if (!fs.existsSync(destConfigPath)) {
      record('create', `hook config: create ${formatTarget(target, destConfigPath)}`);
      if (!options.dryRun) {
        fs.mkdirSync(path.dirname(destConfigPath), { recursive: true });
        fs.copyFileSync(source.hooksConfig, destConfigPath);
      }
      return;
    }

    let destConfig;
    try {
      destConfig = JSON.parse(fs.readFileSync(destConfigPath, 'utf8'));
    } catch (error) {
      throw new Error(`hook config: ${formatTarget(target, destConfigPath)} is not valid JSON: ${error.message}`);
    }

    if (hasAgentSkillsHook(destConfig)) {
      record('ok', `hook config: already contains agent-skills SessionStart hook`);
      return;
    }

    const sourceSessionStart = sourceConfig.hooks && sourceConfig.hooks.SessionStart;
    if (!Array.isArray(sourceSessionStart)) {
      throw new Error('source hook config is missing hooks.SessionStart');
    }

    destConfig.hooks = destConfig.hooks || {};
    destConfig.hooks.SessionStart = Array.isArray(destConfig.hooks.SessionStart)
      ? destConfig.hooks.SessionStart
      : [];
    destConfig.hooks.SessionStart.push(...sourceSessionStart);

    record('update', `hook config: append agent-skills SessionStart hook to ${formatTarget(target, destConfigPath)}`);
    if (!options.dryRun) {
      fs.writeFileSync(destConfigPath, `${JSON.stringify(destConfig, null, 2)}\n`);
    }
  }

  function installConfig() {
    ensureFile(source.config, path.join(target, '.codex', 'config.toml'), 'Codex config');
  }

  return {
    installSkills,
    installAgents,
    installHooks,
    installConfig,
    actions,
    warnings,
  };
}

function resolveComponents(args) {
  if (args.components.size > 0) {
    return args.components;
  }
  if (args.profile === 'skills') {
    return new Set(['skills']);
  }
  if (args.profile === 'codex') {
    return new Set(['skills', 'hooks', 'agents']);
  }
  throw new Error(`Unknown profile: ${args.profile}`);
}

function validateSourceFiles() {
  for (const [name, value] of Object.entries(source)) {
    const values = Array.isArray(value) ? value : [value];
    for (const filePath of values) {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing source ${name}: ${filePath}`);
      }
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }
  validateSourceFiles();

  const target = args.target ? path.resolve(args.target) : process.cwd();
  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    throw new Error(`Target project directory does not exist: ${target}`);
  }
  if (target === root) {
    throw new Error('Refusing to install into this source repository; run Codex from this repo directly instead.');
  }

  const components = resolveComponents(args);
  const installer = makeInstaller(target, args);

  if (components.has('skills')) installer.installSkills();
  if (components.has('hooks')) installer.installHooks();
  if (components.has('agents')) installer.installAgents();
  if (args.includeConfig) installer.installConfig();

  console.log(`Agent Skills Codex install ${args.dryRun ? 'plan' : 'complete'}: ${target}`);
  for (const action of installer.actions) {
    console.log(`  ${action.kind.padEnd(6)} ${action.message}`);
  }
  for (const warning of installer.warnings) {
    console.warn(`  warn   ${warning}`);
  }
}

try {
  main();
} catch (error) {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
}
