import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const argumentsList = process.argv.slice(2);
const requestedDirectory =
  argumentsList.find((argument) => !argument.startsWith('--')) ?? 'src';

const testRoot = path.resolve(process.cwd(), requestedDirectory);

//===================================================================

async function collectTestFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTestFiles(absolutePath)));
      continue;
    }

    if (entry.name.endsWith('.test.ts')) files.push(absolutePath);
  }

  return files;
}

//===================================================================

const testFiles = (await collectTestFiles(testRoot)).sort();

//===================================================================

if (testFiles.length === 0) {
  console.error(`No .test.ts files found under ${requestedDirectory}`);
  process.exitCode = 1;
} else {
  const requireFromPackage = createRequire(
    path.join(process.cwd(), 'package.json')
  );

  const tsxCliPath = requireFromPackage.resolve('tsx/cli');
  const result = spawnSync(
    process.execPath,
    [tsxCliPath, '--test', ...testFiles],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    }
  );

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}
