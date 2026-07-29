import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

//===================================================================

const rawArguments = process.argv.slice(2);
const roots = [];
let matchSuffixes = ['.test.ts', '.test.tsx'];

//===================================================================

for (const argument of rawArguments) {
  if (argument.startsWith('--match=')) {
    matchSuffixes = argument
      .slice('--match='.length)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    continue;
  }

  roots.push(argument);
}

if (roots.length === 0) {
  console.error('Provide at least one directory containing test files.');
  process.exit(1);
}

if (matchSuffixes.length === 0) {
  console.error('Provide at least one non-empty --match suffix.');
  process.exit(1);
}

//===================================================================

async function findTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const tests = [];

  for (const entry of entries) {
    const targetPath = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      tests.push(...(await findTests(targetPath)));
    } else if (
      entry.isFile() &&
      matchSuffixes.some((suffix) => entry.name.endsWith(suffix))
    ) {
      tests.push(targetPath);
    }
  }

  return tests;
}

//===================================================================

const tests = (await Promise.all(roots.map((root) => findTests(resolve(root)))))
  .flat()
  .sort();

if (tests.length === 0) {
  console.error(
    `No test files matching ${matchSuffixes.join(', ')} found in: ${roots.join(', ')}`
  );
  process.exit(1);
}

//===================================================================

const resolverRegisterUrl = new URL(
  './register-typescript-resolver.mjs',
  import.meta.url
).href;

//===================================================================

const result = spawnSync(
  process.execPath,
  ['--import', resolverRegisterUrl, '--test', ...tests],
  { stdio: 'inherit' }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

//===================================================================

process.exit(result.status ?? 1);
