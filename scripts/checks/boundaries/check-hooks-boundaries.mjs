import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const repositoryRoot = process.cwd();
const hooksRoot = path.join(repositoryRoot, 'packages/hooks/src');

const scannedRoots = [
  path.join(repositoryRoot, 'apps'),
  path.join(repositoryRoot, 'packages'),
];

const ignoredDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);

const forbiddenHooksImportPatterns = [
  /(?:from|import\s*)\s*['"](?:@e-pharmacy\/(?:ui|api-client|next-api)|next(?:\/|['"])|@\/|\.\.\/\.\.\/apps\/)/,
  /(?:products|orders|clients|pharmacies|checkout|favorites|reviews|cart)/i,
];

//===================================================================

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(absolutePath)));
      continue;
    }

    if (entry.isFile() && /\.[cm]?[jt]sx?$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

//===================================================================

const failures = [];
const hooksFiles = await listSourceFiles(hooksRoot);

//===================================================================

for (const file of hooksFiles) {
  const source = await readFile(file, 'utf8');
  const relative = path.relative(repositoryRoot, file).replaceAll('\\', '/');

  for (const pattern of forbiddenHooksImportPatterns) {
    if (pattern.test(source)) {
      failures.push(
        `${relative}: forbidden app, domain, Next, API, or UI dependency.`
      );
      break;
    }
  }

  if (
    /use(?:Effect|LayoutEffect|State|Reducer|Ref|Callback|Memo)\s*\(/.test(
      source
    )
  ) {
    const firstStatement = source.trimStart().split(/\r?\n/, 1)[0];
    if (
      firstStatement !== "'use client';" &&
      firstStatement !== '"use client";'
    ) {
      failures.push(
        `${relative}: public/browser hook module must start with 'use client'.`
      );
    }
  }
}

//===================================================================

for (const root of scannedRoots) {
  const files = await listSourceFiles(root);

  for (const file of files) {
    const relative = path.relative(repositoryRoot, file).replaceAll('\\', '/');
    const source = await readFile(file, 'utf8');

    if (
      relative.startsWith('apps/api/') &&
      /@e-pharmacy\/hooks|packages\/hooks/.test(source)
    ) {
      failures.push(`${relative}: backend must not import React hooks.`);
    }

    if (/@e-pharmacy\/hooks\/src(?:\/|['"])/.test(source)) {
      failures.push(
        `${relative}: deep imports from @e-pharmacy/hooks/src are forbidden.`
      );
    }
  }
}

//===================================================================

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}
//===================================================================

console.log(
  `Hooks boundary check passed (${hooksFiles.length} hook source files scanned).`
);
