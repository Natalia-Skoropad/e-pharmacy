import { readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

//===================================================================

const roots = process.argv.slice(2);

if (roots.length === 0) {
  console.error('Provide at least one directory containing .test.ts files.');
  process.exit(1);
}

//===================================================================

async function findTests(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const tests = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);

    if (entry.isDirectory()) {
      tests.push(...(await findTests(path)));
    } else if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      tests.push(path);
    }
  }

  return tests;
}

//===================================================================

const tests = (await Promise.all(roots.map((root) => findTests(resolve(root)))))
  .flat()
  .sort();

if (tests.length === 0) {
  console.error(`No .test.ts files found in: ${roots.join(', ')}`);
  process.exit(1);
}

//===================================================================

const result = spawnSync(
  process.execPath,
  ['--experimental-strip-types', '--test', ...tests],
  { stdio: 'inherit' }
);

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

//===================================================================

process.exit(result.status ?? 1);
