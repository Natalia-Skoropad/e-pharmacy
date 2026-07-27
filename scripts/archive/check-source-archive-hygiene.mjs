import { mkdtemp, readFile, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES,
  SOURCE_ARCHIVE_EXCLUDED_FILE_PATTERNS,
  prepareSourceArchive,
} from './prepare-source-archive.mjs';

//===================================================================

const repositoryRoot = path.resolve(
  fileURLToPath(new URL('../../', import.meta.url))
);

const gitignore = await readFile(
  path.join(repositoryRoot, '.gitignore'),
  'utf8'
);

const requiredIgnoredPaths = [
  'node_modules',
  '.artifacts',
  '.turbo',
  '.next',
  'dist',
  'coverage',
  '*.zip',
  '*.tsbuildinfo',
];

const requiredStagedFiles = [
  'package.json',
  'pnpm-lock.yaml',
  'packages/config/package.json',
  'apps/api/package.json',
  'apps/client/package.json',
  'apps/pharmacy/package.json',
];

const failures = [];

//===================================================================

for (const ignoredPath of requiredIgnoredPaths) {
  if (!gitignore.includes(ignoredPath)) {
    failures.push(`.gitignore is missing ${ignoredPath}.`);
  }
}

for (const directory of [
  '.artifacts',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]) {
  if (!SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES.has(directory)) {
    failures.push(`Source archive policy is missing ${directory}.`);
  }
}

//===================================================================

function matchesExcludedFile(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');

  return SOURCE_ARCHIVE_EXCLUDED_FILE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(normalized);
  });
}

//===================================================================

async function collectStagedArchiveViolations(
  directory,
  relativeDirectory = ''
) {
  const entries = await readdir(directory, { withFileTypes: true });
  const violations = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDirectory, entry.name);
    const normalized = relativePath.replaceAll('\\', '/');

    if (entry.isDirectory()) {
      if (SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES.has(entry.name)) {
        violations.push(`forbidden directory: ${normalized}`);
        continue;
      }

      violations.push(
        ...(await collectStagedArchiveViolations(
          path.join(directory, entry.name),
          relativePath
        ))
      );
      continue;
    }

    if (entry.isFile() && matchesExcludedFile(normalized)) {
      violations.push(`forbidden file: ${normalized}`);
    }
  }

  return violations;
}

//===================================================================

const temporaryRoot = await mkdtemp(
  path.join(os.tmpdir(), 'e-pharmacy-source-hygiene-')
);

try {
  const stagedRoot = await prepareSourceArchive({
    repositoryRoot,
    outputPath: path.join(temporaryRoot, 'source'),
  });

  for (const requiredFile of requiredStagedFiles) {
    try {
      const fileStats = await stat(path.join(stagedRoot, requiredFile));
      if (!fileStats.isFile()) {
        failures.push(`Staged source entry is not a file: ${requiredFile}.`);
      }
    } catch {
      failures.push(`Staged source tree is missing ${requiredFile}.`);
    }
  }

  const contentViolations = await collectStagedArchiveViolations(stagedRoot);
  failures.push(...contentViolations);
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

//===================================================================

if (failures.length > 0) {
  console.error(
    ['Source archive hygiene check failed:', ...failures.map((item) => `- ${item}`)].join(
      '\n'
    )
  );
  process.exit(1);
}

//===================================================================

console.log(
  'Source archive hygiene check passed (policy and staged content verified).'
);
