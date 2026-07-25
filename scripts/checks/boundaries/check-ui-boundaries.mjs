import { access, readFile, readdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';

//===================================================================

const ROOT = resolve(import.meta.dirname, '..', '..', '..');
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

//===================================================================

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', '.turbo', 'dist'].includes(entry.name)) {
        continue;
      }
      files.push(...(await collectFiles(absolutePath)));
    } else if (SOURCE_EXTENSIONS.has(extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

//===================================================================

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

//===================================================================

function formatPath(path) {
  return relative(ROOT, path).replaceAll('\\', '/');
}

//===================================================================

const errors = [];
const allSourceFiles = [
  ...(await collectFiles(resolve(ROOT, 'apps'))),
  ...(await collectFiles(resolve(ROOT, 'packages'))),
];

//===================================================================

for (const file of allSourceFiles) {
  const source = await readFile(file, 'utf8');
  const path = formatPath(file);

  if (
    /from\s+['"]@e-pharmacy\/ui['"]|import\(['"]@e-pharmacy\/ui['"]\)/.test(
      source
    )
  ) {
    errors.push(
      `${path} imports the intentionally restricted UI root entrypoint`
    );
  }

  if (
    /@e-pharmacy\/ui\/(?:src|common|form-fields|modals)(?:\/|['"])/.test(source)
  ) {
    errors.push(`${path} imports a deep or removed UI entrypoint`);
  }
}

//===================================================================

const lowerLayerRoots = [
  'packages/api-client',
  'packages/config',
  'packages/types',
  'packages/utils',
  'packages/validation',
  'apps/api',
  'apps/client/src/lib',
  'apps/pharmacy/src/lib',
].map((path) => resolve(ROOT, path));

//===================================================================

for (const directory of lowerLayerRoots) {
  if (!(await exists(directory))) continue;

  for (const file of await collectFiles(directory)) {
    const source = await readFile(file, 'utf8');
    if (/@e-pharmacy\/ui(?:\/|['"])/.test(source)) {
      errors.push(
        `${formatPath(file)} creates a forbidden lower-layer dependency on UI`
      );
    }
  }
}

//===================================================================

for (const legacyDirectory of [
  'packages/ui/src/common',
  'packages/ui/src/form-fields',
  'packages/ui/src/modals',
  'packages/ui/src/forms/WorkingHoursInput',
  'packages/ui/src/forms/TextEditor',
  'packages/ui/src/primitives/ButtonLink',
]) {
  const absolutePath = resolve(ROOT, legacyDirectory);
  if (await exists(absolutePath)) {
    errors.push(`${legacyDirectory} must not exist`);
  }
}

//===================================================================

const uiSourceFiles = await collectFiles(resolve(ROOT, 'packages/ui/src'));
const forbiddenFeatureNames =
  /\b(?:EntityComments|OrderCancellationModal|SalesValueChart|ClientStatistics|OrderStatistics|AllProductStatistics|OwnProductStatistics|ProductRequestStatistics)\b/;

//===================================================================

for (const file of uiSourceFiles) {
  if (file.includes(`${join('src', 'a11y')}`)) continue;
  const source = await readFile(file, 'utf8');
  if (forbiddenFeatureNames.test(source)) {
    errors.push(`${formatPath(file)} contains pharmacy domain feature logic`);
  }
}

//===================================================================

const primitivesIndex = await readFile(
  resolve(ROOT, 'packages/ui/src/primitives/index.ts'),
  'utf8'
);

const navigationIndex = await readFile(
  resolve(ROOT, 'packages/ui/src/navigation/index.ts'),
  'utf8'
);

const formsIndex = await readFile(
  resolve(ROOT, 'packages/ui/src/forms/index.ts'),
  'utf8'
);

//===================================================================

if (/LinkButton|ButtonLink/.test(primitivesIndex)) {
  errors.push(
    'packages/ui/src/primitives/index.ts must remain framework-neutral'
  );
}

if (!/LinkButton/.test(navigationIndex)) {
  errors.push('packages/ui/src/navigation/index.ts must export LinkButton');
}

if (/WorkingHoursInput|TextEditor/.test(formsIndex)) {
  errors.push(
    'packages/ui/src/forms/index.ts exports a domain or legacy form component'
  );
}

if (!/MarkdownTextarea/.test(formsIndex)) {
  errors.push('packages/ui/src/forms/index.ts must export MarkdownTextarea');
}

if (errors.length > 0) {
  console.error('UI boundary check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `UI boundary check passed (${allSourceFiles.length} source files scanned).`
  );
}
