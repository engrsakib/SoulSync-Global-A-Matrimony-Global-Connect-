import { existsSync } from 'node:fs';
import path from 'node:path';

/**
 * Windows cmd.exe rejects command lines longer than 8191 characters.
 * lint-staged's own limit does not include the `.cmd` shim path or quoting,
 * so large commits (many Markdown files) still fail. Keep each spawned
 * command well under that limit, and do not append every path to checks
 * that already read the git index themselves.
 *
 * ESLint flat config is resolved from one directory per process. A commit
 * that touches more than one package must run ESLint once per package config,
 * or the repo root (which has no config) makes the whole run fail.
 */
const MAX_COMMAND_LENGTH = 4000;
const ROOT = process.cwd();
const ESLINT_CONFIG_NAMES = ['eslint.config.mjs', 'eslint.config.js', 'eslint.config.cjs'];

function quotePath(file) {
  return `"${file.replaceAll('\\', '/').replaceAll('"', '\\"')}"`;
}

function findEslintConfig(file) {
  let dir = path.dirname(path.resolve(file));
  const root = path.resolve(ROOT);

  while (dir === root || dir.startsWith(root + path.sep)) {
    for (const name of ESLINT_CONFIG_NAMES) {
      const candidate = path.join(dir, name);
      if (existsSync(candidate)) {
        return candidate;
      }
    }
    if (dir === root) {
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      break;
    }
    dir = parent;
  }

  return null;
}

function eslintCommands(files) {
  const groups = new Map();

  for (const file of files) {
    const config = findEslintConfig(file);
    if (!config) {
      continue;
    }
    const group = groups.get(config) ?? [];
    group.push(file);
    groups.set(config, group);
  }

  const commands = [];
  for (const [config, group] of groups) {
    commands.push(
      ...chunkedCommand(`eslint --max-warnings=0 --fix --config ${quotePath(config)}`, group),
    );
  }
  return commands;
}

function chunkedCommand(command, files) {
  const commands = [];
  let current = [];
  let length = command.length;

  for (const file of files) {
    const part = quotePath(file);
    const nextLength = length + 1 + part.length;
    if (current.length > 0 && nextLength > MAX_COMMAND_LENGTH) {
      commands.push(`${command} ${current.join(' ')}`);
      current = [];
      length = command.length;
    }
    current.push(part);
    length += 1 + part.length;
  }

  if (current.length > 0) {
    commands.push(`${command} ${current.join(' ')}`);
  }

  return commands;
}

export default {
  '*.{ts,tsx,js,mjs}': (files) => [
    ...eslintCommands(files),
    ...chunkedCommand('prettier --write', files),
  ],
  '*.{json,md,yml,yaml,prisma}': (files) => chunkedCommand('prettier --write', files),
  '*': () => 'node scripts/check-todos.mjs --staged',
};
