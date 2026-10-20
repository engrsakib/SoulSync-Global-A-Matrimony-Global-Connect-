import { readFileSync } from 'node:fs';

const commitMsgFile = process.argv[2];
if (!commitMsgFile) {
  console.error('Missing commit message file path');
  process.exit(1);
}

const message = readFileSync(commitMsgFile, 'utf8').trim();
const conventional =
  /^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([\w\-./]+\))?!?: .+/;

if (!conventional.test(message)) {
  console.error(
    'Commit message must follow Conventional Commits, e.g. "feat(api): add tenant listing"',
  );
  process.exit(1);
}
