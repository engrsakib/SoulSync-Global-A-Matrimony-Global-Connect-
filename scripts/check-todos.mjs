import { execSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { relative, resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const PATTERN = /\b(TODO:|FIXME:|@todo\b)/i;

const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  '.turbo',
  'coverage',
  '.git',
]);

const IGNORE_FILES = new Set(['pnpm-lock.yaml', 'check-todos.mjs']);

const IGNORE_PATH_FRAGMENTS = ['packages/db/src/generated'];

function shouldIgnore(relativePath) {
  const parts = relativePath.split(/[/\\]/);
  if (parts.some((part) => IGNORE_DIRS.has(part))) {
    return true;
  }
  if (IGNORE_FILES.has(parts.at(-1) ?? '')) {
    return true;
  }
  return IGNORE_PATH_FRAGMENTS.some((fragment) => relativePath.includes(fragment));
}

function listStagedFiles() {
  const output = execSync('git diff --cached --name-only --diff-filter=ACMR', {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function listTrackedFiles() {
  const output = execSync('git ls-files', { cwd: ROOT, encoding: 'utf8' });
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function scanFile(absolutePath, relativePath) {
  let stat;
  try {
    stat = statSync(absolutePath);
  } catch {
    return [];
  }
  if (!stat.isFile()) {
    return [];
  }

  const content = readFileSync(absolutePath, 'utf8');
  const hits = [];
  const lines = content.split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    if (PATTERN.test(lines[index] ?? '')) {
      hits.push(`${relativePath}:${index + 1}`);
    }
  }
  return hits;
}

const stagedMode = process.argv.includes('--staged');
const files = stagedMode ? listStagedFiles() : listTrackedFiles();

const violations = [];
for (const file of files) {
  const relativePath = relative(ROOT, resolve(ROOT, file));
  if (shouldIgnore(relativePath)) {
    continue;
  }
  violations.push(...scanFile(resolve(ROOT, file), relativePath));
}

if (violations.length > 0) {
  console.error('Unresolved TODO/FIXME comments found:');
  for (const violation of violations) {
    console.error(`  ${violation}`);
  }
  process.exit(1);
}

if (!stagedMode) {
  console.log('No unresolved TODO/FIXME comments found.');
}
