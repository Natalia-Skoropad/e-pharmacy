import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();

//===================================================================

async function collectFiles(directory, predicate = () => true) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (['node_modules', '.next', '.turbo', 'dist'].includes(entry.name))
      continue;
    const absolute = path.join(directory, entry.name);

    if (entry.isDirectory())
      files.push(...(await collectFiles(absolute, predicate)));
    else if (predicate(absolute)) files.push(absolute);
  }

  return files;
}

//===================================================================

function relative(file) {
  return path.relative(root, file).replaceAll('\\', '/');
}

//===================================================================

const tsFiles = await collectFiles(root, (file) =>
  /\.[cm]?[jt]sx?$/.test(file)
);

const violations = [];

//===================================================================

for (const file of tsFiles) {
  const rel = relative(file);
  const source = await readFile(file, 'utf8');

  if (
    rel.startsWith('apps/api/') &&
    /@e-pharmacy\/next-api|packages\/next-api/.test(source)
  ) {
    violations.push(`${rel}: backend must not import packages/next-api`);
  }

  if (/@e-pharmacy\/next-api\/src/.test(source)) {
    violations.push(`${rel}: deep next-api import is forbidden`);
  }

  if (
    rel.startsWith('packages/next-api/src/browser/') &&
    !rel.endsWith('.test.ts') &&
    /server-only|next\/server|from ['"]node:/.test(source)
  ) {
    violations.push(`${rel}: browser entrypoint imports server-only code`);
  }

  if (
    rel.startsWith('packages/next-api/src/contracts/') &&
    !rel.endsWith('.test.ts') &&
    /server-only|client-only|next\/server|from ['"]node:/.test(source)
  ) {
    violations.push(`${rel}: contracts entrypoint must remain runtime-neutral`);
  }

  if (
    rel.startsWith('apps/') &&
    source.includes("'use client'") &&
    /@e-pharmacy\/next-api\/(server|proxy)/.test(source)
  ) {
    violations.push(`${rel}: client component imports server/proxy entrypoint`);
  }

  if (
    /apps\/(client|pharmacy)\/src\/lib\/api\/browser\//.test(rel) &&
    /API_BASE_URL|NEXT_PUBLIC_API_URL|localhost:4000/.test(source)
  ) {
    violations.push(
      `${rel}: browser API module references backend origin directly`
    );
  }

  if (
    /proxy(Auth|Backend|OptionalAuth|PublicBackend)Request/.test(source) &&
    !rel.startsWith('packages/next-api/')
  ) {
    violations.push(`${rel}: low-level proxy implementation is internal`);
  }

  if (/@e-pharmacy\/next-api\/observability/.test(source)) {
    violations.push(
      `${rel}: observability is not a public next-api entrypoint`
    );
  }

  if (
    rel.includes('/src/app/api/') &&
    /@e-pharmacy\/next-api\/proxy/.test(source) &&
    /runtime\s*=\s*['"]edge['"]/.test(source)
  ) {
    violations.push(`${rel}: Node-only proxy route cannot use Edge runtime`);
  }
}

//===================================================================

const packageJson = JSON.parse(
  await readFile(path.join(root, 'packages/next-api/package.json'), 'utf8')
);

const exportsList = Object.keys(packageJson.exports ?? {}).sort();
const expectedExports = ['./browser', './contracts', './proxy', './server'];

//===================================================================

if (JSON.stringify(exportsList) !== JSON.stringify(expectedExports)) {
  violations.push(
    `packages/next-api/package.json: expected exports ${expectedExports.join(', ')}`
  );
}

//===================================================================

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

//===================================================================

console.log(
  `Next API boundary check passed (${tsFiles.length} source files scanned).`
);
