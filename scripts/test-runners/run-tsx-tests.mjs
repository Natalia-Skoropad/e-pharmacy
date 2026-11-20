import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const argumentsList = process.argv.slice(2);

const requestedDirectory =
  argumentsList.find((argument) => !argument.startsWith('--')) ?? 'src';

let matchSuffixes = ['.test.ts'];
let excludeSuffixes = [];

for (const argument of argumentsList) {
  if (argument.startsWith('--match=')) {
    matchSuffixes = argument
      .slice('--match='.length)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  if (argument.startsWith('--exclude=')) {
    excludeSuffixes = argument
      .slice('--exclude='.length)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }
}

// Mongo integration suites share a test database and may rebuild indexes.
// Serialize these suites and surface leaked connections as timeouts instead
// of letting the entire CI check remain stuck without a result.
const isMongoIntegrationRun = matchSuffixes.includes('.integration.test.ts');

const testRunnerOptions = isMongoIntegrationRun
  ? ['--test-concurrency=1', '--test-timeout=180000']
  : [];

//===================================================================

if (matchSuffixes.length === 0) {
  console.error('Provide at least one non-empty --match suffix.');
  process.exit(1);
}

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

    const matches = matchSuffixes.some((suffix) => entry.name.endsWith(suffix));

    const excluded = excludeSuffixes.some((suffix) =>
      entry.name.endsWith(suffix)
    );

    if (matches && !excluded) files.push(absolutePath);
  }

  return files;
}

//===================================================================

const testFiles = (await collectTestFiles(testRoot)).sort();

//===================================================================

if (testFiles.length === 0) {
  console.error(
    `No test files matching ${matchSuffixes.join(', ')} found under ${requestedDirectory}`
  );
  process.exitCode = 1;
} else {
  const requireFromPackage = createRequire(
    path.join(process.cwd(), 'package.json')
  );

  const tsxCliPath = requireFromPackage.resolve('tsx/cli');

  const result = spawnSync(
    process.execPath,
    [tsxCliPath, '--test', ...testRunnerOptions, ...testFiles],
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: false,
    }
  );

  if (result.error) throw result.error;

  process.exitCode = result.status ?? 1;
}
