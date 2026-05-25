#!/usr/bin/env node
/*
 * Mirrors root skills/ into .agents/skills/ for Codex repository-scoped
 * discovery. Use --check in CI to verify the mirror is current.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'skills');
const targetDir = path.join(root, '.agents', 'skills');
const checkOnly = process.argv.includes('--check');

function assertInsideRoot(dirPath) {
  const rel = path.relative(root, dirPath);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Refusing to operate outside repository root: ${dirPath}`);
  }
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
      files.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return files.sort();
}

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function compareTrees() {
  const sourceFiles = walkFiles(sourceDir);
  const targetFiles = walkFiles(targetDir);
  const all = new Set([...sourceFiles, ...targetFiles]);
  const diffs = [];

  for (const rel of [...all].sort()) {
    const sourcePath = path.join(sourceDir, rel);
    const targetPath = path.join(targetDir, rel);
    if (!fs.existsSync(sourcePath)) {
      diffs.push(`extra in .agents/skills: ${rel}`);
    } else if (!fs.existsSync(targetPath)) {
      diffs.push(`missing from .agents/skills: ${rel}`);
    } else if (hashFile(sourcePath) !== hashFile(targetPath)) {
      diffs.push(`content differs: ${rel}`);
    }
  }

  return diffs;
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry));
    }
  } else if (stat.isFile()) {
    fs.copyFileSync(src, dest);
  }
}

function main() {
  if (!fs.existsSync(sourceDir)) {
    throw new Error(`Missing source skills directory: ${sourceDir}`);
  }

  assertInsideRoot(targetDir);

  if (checkOnly) {
    const diffs = compareTrees();
    if (diffs.length > 0) {
      console.error('Codex skill mirror is out of sync:');
      for (const diff of diffs) console.error(`  - ${diff}`);
      process.exit(1);
    }
    console.log('Codex skill mirror OK');
    return;
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(targetDir, { recursive: true });
  copyRecursive(sourceDir, targetDir);
  console.log('Mirrored skills/ to .agents/skills/');
}

main();
