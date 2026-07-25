import { readFile } from 'node:fs/promises';

//===================================================================

const archiveScript = await readFile(
  new URL('./prepare-source-archive.mjs', import.meta.url),
  'utf8'
);

const gitignore = await readFile(
  new URL('../../.gitignore', import.meta.url),
  'utf8'
);

const requiredDirectoryExclusions = [
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
];

const requiredFilePolicies = ['\\.zip$', '\\.tsbuildinfo$'];
const failures = [];

//===================================================================

for (const exclusion of requiredDirectoryExclusions) {
  if (!archiveScript.includes(`'${exclusion}'`)) {
    failures.push(`Source archive policy is missing ${exclusion}.`);
  }
}

for (const pattern of requiredFilePolicies) {
  if (!archiveScript.includes(pattern)) {
    failures.push(`Source archive policy is missing ${pattern}.`);
  }
}

for (const ignoredPath of [
  'node_modules',
  '.turbo',
  '.next',
  'dist',
  'coverage',
  '*.zip',
  '*.tsbuildinfo',
]) {
  if (!gitignore.includes(ignoredPath)) {
    failures.push(`.gitignore is missing ${ignoredPath}.`);
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

//===================================================================

console.log('Source archive hygiene policy check passed.');
