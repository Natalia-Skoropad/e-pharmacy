import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

//===================================================================

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (['node_modules', 'dist', '.turbo', '.next'].includes(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...(await collectSourceFiles(absolutePath)));
    else if (/\.(?:ts|tsx|mjs)$/.test(entry.name)) files.push(absolutePath);
  }

  return files;
}

//===================================================================

async function findMatches(directories, pattern) {
  const matches = [];

  for (const directory of directories) {
    for (const file of await collectSourceFiles(directory)) {
      const source = await readFile(file, 'utf8');
      if (pattern.test(source)) {
        matches.push(path.relative(repositoryRoot, file).replaceAll('\\', '/'));
      }
      pattern.lastIndex = 0;
    }
  }

  return matches;
}

//===================================================================

const apiClientSource = path.join(repositoryRoot, 'packages/api-client/src');
const apiClientViolations = await findMatches(
  [apiClientSource],
  /(?:from\s+|import\s*\()['"](?:@e-pharmacy\/(?:next-api|ui|auth)|next(?:\/|['"]|$)|server-only|client-only|@\/|apps\/)/m
);

assert.deepEqual(
  apiClientViolations,
  [],
  `API-client must remain framework/application neutral:\n${apiClientViolations.join('\n')}`
);

const reverseDependencyViolations = await findMatches(
  [
    path.join(repositoryRoot, 'apps/api/src'),
    path.join(repositoryRoot, 'packages/types/src'),
    path.join(repositoryRoot, 'packages/validation/src'),
  ],
  /@e-pharmacy\/api-client|packages\/api-client/
);

assert.deepEqual(
  reverseDependencyViolations,
  [],
  `Backend/types/validation must not depend on API-client:\n${reverseDependencyViolations.join('\n')}`
);

console.log(
  `API-client boundary check passed (${(await collectSourceFiles(apiClientSource)).length} package source files scanned).`
);
