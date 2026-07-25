import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const repositoryRoot = process.cwd();
const packageRoot = path.join(repositoryRoot, 'packages/hooks');

const packageJson = JSON.parse(
  await readFile(path.join(packageRoot, 'package.json'), 'utf8')
);

const expectedExports = {
  './dom': './src/dom/index.ts',
  './timing': './src/timing/index.ts',
};

const forbiddenPublicNames = [
  'useToast',
  'useListboxNavigation',
  'useOverlayLayer',
  'useBackdropClick',
  'useBackdropPointer',
  'useFavoriteActions',
  'useReviewForm',
  'useCheckoutSubmit',
  'useCartMutations',
  'useCurrentPharmacyStatus',
];

const ignoredDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);

//===================================================================

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(absolutePath)));
    } else if (entry.isFile()) {
      files.push(absolutePath);
    }
  }

  return files;
}

//===================================================================

const failures = [];

if (JSON.stringify(packageJson.exports) !== JSON.stringify(expectedExports)) {
  failures.push(
    'packages/hooks/package.json must expose only ./dom and ./timing.'
  );
}

if ('main' in packageJson || 'types' in packageJson) {
  failures.push(
    'packages/hooks must not advertise an implicit root entrypoint.'
  );
}

for (const [entrypoint, relativePath] of Object.entries(expectedExports)) {
  const source = await readFile(path.join(packageRoot, relativePath), 'utf8');
  const firstStatement = source.trimStart().split(/\r?\n/, 1)[0];

  if (
    firstStatement !== "'use client';" &&
    firstStatement !== '"use client";'
  ) {
    failures.push(`${entrypoint} barrel must start with 'use client'.`);
  }

  for (const forbiddenName of forbiddenPublicNames) {
    if (source.includes(forbiddenName)) {
      failures.push(`${entrypoint} must not export ${forbiddenName}.`);
    }
  }
}

const hookImplementations = [
  ['src/dom/useOutsidePointerDown.ts', 'src/dom/useOutsidePointerDown.test.ts'],
  ['src/timing/useDebouncedValue.ts', 'src/timing/useDebouncedValue.test.ts'],
];

for (const [implementation, testFile] of hookImplementations) {
  const files = await listFiles(path.join(packageRoot, path.dirname(testFile)));
  if (!files.includes(path.join(packageRoot, testFile))) {
    failures.push(`${implementation} must have ${testFile}.`);
  }
}

const consumerFiles = [
  ...(await listFiles(path.join(repositoryRoot, 'apps'))),
  ...(await listFiles(path.join(repositoryRoot, 'packages'))),
].filter((file) => /\.[cm]?[jt]sx?$/.test(file));

let outsidePointerConsumers = 0;
let debounceConsumers = 0;

for (const file of consumerFiles) {
  const relative = path.relative(repositoryRoot, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');

  if (/from\s+['"]@e-pharmacy\/hooks['"]/.test(source)) {
    failures.push(`${relative}: root @e-pharmacy/hooks imports are forbidden.`);
  }

  if (/@e-pharmacy\/hooks\/src(?:\/|['"])/.test(source)) {
    failures.push(`${relative}: deep hooks imports are forbidden.`);
  }

  if (relative.startsWith('packages/hooks/')) continue;
  if (source.includes('@e-pharmacy/hooks/dom')) outsidePointerConsumers += 1;
  if (source.includes('@e-pharmacy/hooks/timing')) debounceConsumers += 1;
}

if (outsidePointerConsumers < 2) {
  failures.push(
    'useOutsidePointerDown must have at least two independent source consumers.'
  );
}

if (debounceConsumers < 2) {
  failures.push(
    'useDebouncedValue must have at least two independent source consumers.'
  );
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(
  `Hooks public API check passed (${outsidePointerConsumers} DOM consumers, ${debounceConsumers} timing consumers).`
);
