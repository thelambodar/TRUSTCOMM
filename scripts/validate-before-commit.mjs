#!/usr/bin/env node

/**
 * TRUSTCOMM / AURA-TRUST — Pre-Commit Validation Script
 * SOA IDEATHON 2026 – Problem Statement S26
 *
 * Runs applicable validation checks before commit:
 * 1. TypeScript type-checking
 * 2. Vite + esbuild build
 * 3. Git diff checks
 * 4. Secret scan (basic pattern matching)
 * 5. Project memory file existence check
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const PASS = '\x1b[32m✓ PASS\x1b[0m';
const FAIL = '\x1b[31m✗ FAIL\x1b[0m';
const SKIP = '\x1b[33m⊘ SKIP\x1b[0m';
const WARN = '\x1b[33m⚠ WARN\x1b[0m';

let exitCode = 0;
const results = [];

function run(label, cmd) {
  try {
    execSync(cmd, { stdio: 'pipe', cwd: ROOT, timeout: 120000 });
    results.push({ label, status: 'PASS' });
    console.log(`  ${PASS}  ${label}`);
    return true;
  } catch (err) {
    results.push({ label, status: 'FAIL', error: err.stderr?.toString().substring(0, 200) || '' });
    console.log(`  ${FAIL}  ${label}`);
    exitCode = 1;
    return false;
  }
}

function check(label, condition) {
  if (condition) {
    results.push({ label, status: 'PASS' });
    console.log(`  ${PASS}  ${label}`);
  } else {
    results.push({ label, status: 'FAIL' });
    console.log(`  ${FAIL}  ${label}`);
    exitCode = 1;
  }
  return condition;
}

console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║  TRUSTCOMM S26 — Pre-Commit Validation Gate         ║');
console.log('╚══════════════════════════════════════════════════════╝\n');

// 1. TypeScript Type Checking
console.log('── TypeScript ──');
run('tsc --noEmit (type check)', 'npx tsc --noEmit');

// 2. Build
console.log('\n── Build ──');
run('Vite frontend build', 'npx vite build');
run('esbuild server bundle', 'npx esbuild backend/src/api/server.ts --bundle --platform=node --format=cjs --packages=external --outfile=dist/server.cjs');

// 3. Git checks
console.log('\n── Git Safety ──');
run('git diff --check (whitespace)', 'git diff --check');

// 4. Secret Scan (basic)
console.log('\n── Secret Scan ──');
const SECRET_PATTERNS = [
  /AKIA[0-9A-Z]{16}/,                          // AWS Access Key
  /-----BEGIN (RSA |EC )?PRIVATE KEY-----/,      // Private Key PEM
  /firebase.*['\"][A-Za-z0-9_-]{30,}['\"]*/i,   // Firebase-like keys
  /ghp_[A-Za-z0-9]{36}/,                         // GitHub PAT
  /sk-[A-Za-z0-9]{32,}/,                         // OpenAI-style key
];

let secretFound = false;
function scanDir(dir, depth = 0) {
  if (depth > 5) return;
  const ignoreDirs = ['node_modules', '.git', 'dist', 'build', 'coverage', '.project-memory-private'];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoreDirs.includes(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath, depth + 1);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.env', '.yaml', '.yml', '.toml'].includes(ext)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          for (const pattern of SECRET_PATTERNS) {
            if (pattern.test(content)) {
              console.log(`  ${FAIL}  Potential secret found in: ${path.relative(ROOT, fullPath)}`);
              secretFound = true;
            }
          }
        } catch { /* ignore unreadable files */ }
      }
    }
  }
}
scanDir(ROOT);
check('No secrets detected in tracked files', !secretFound);

// 5. Project Memory Integrity
console.log('\n── Project Memory ──');
const requiredMemoryFiles = [
  'docs/project-memory/PROJECT_CONTEXT.md',
  'docs/project-memory/CURRENT_CHECKPOINT.md',
  'docs/project-memory/ARCHITECTURE_STATE.md',
  'docs/project-memory/ISSUES.md',
  'docs/project-memory/DECISIONS.md',
  'docs/project-memory/CHANGELOG.md',
  'docs/project-memory/NEXT_STEPS.md',
  'docs/project-memory/VALIDATION_STATUS.md',
];

for (const file of requiredMemoryFiles) {
  const fullPath = path.join(ROOT, file);
  check(`${file} exists`, fs.existsSync(fullPath));
}

// 6. .gitignore checks
console.log('\n── .gitignore Safety ──');
const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf-8');
check('.env* in .gitignore', gitignore.includes('.env*'));
check('node_modules/ in .gitignore', gitignore.includes('node_modules/'));
check('.project-memory-private/ in .gitignore', gitignore.includes('.project-memory-private/'));

// Summary
console.log('\n═══════════════════════════════════════════════════════');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`  Results: ${passed} passed, ${failed} failed`);

if (exitCode !== 0) {
  console.log(`\n  \x1b[31mCOMMIT BLOCKED — Fix failures before committing.\x1b[0m\n`);
} else {
  console.log(`\n  \x1b[32mALL GATES PASSED — Safe to commit.\x1b[0m\n`);
}

process.exit(exitCode);
