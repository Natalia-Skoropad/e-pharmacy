import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import process from 'node:process';

//===================================================================

const ROOT = resolve(import.meta.dirname, '../../..');
const COMPONENT_ROOT = resolve(ROOT, 'apps/client/src/components');

const AUDITED_ROOTS = [
  ...['common', 'home', 'info', 'layout'].map((name) =>
    resolve(COMPONENT_ROOT, name)
  ),
  resolve(COMPONENT_ROOT, 'product-catalog/ProductDetailsPageContent'),
];

const violations = [];

//===================================================================

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else files.push(path);
  }

  return files;
}

//===================================================================

const allFiles = (await Promise.all(AUDITED_ROOTS.map(collect))).flat();
const cssFiles = allFiles.filter((file) => file.endsWith('.module.css'));

const sourceFiles = allFiles.filter((file) =>
  ['.ts', '.tsx'].includes(extname(file))
);

const sourceText = (
  await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))
).join('\n');

const hashes = new Map();

//===================================================================

for (const file of cssFiles) {
  const css = await readFile(file, 'utf8');
  const display = relative(ROOT, file);

  if (/!important/.test(css))
    violations.push(
      `${display}: !important is forbidden in audited client components.`
    );

  const hash = createHash('sha256').update(css).digest('hex');
  const duplicates = hashes.get(hash) ?? [];
  duplicates.push(display);
  hashes.set(hash, duplicates);

  const selectors = [...css.matchAll(/^\s*\.([A-Za-z_][\w-]*)/gm)].map(
    (match) => match[1]
  );

  for (const selector of new Set(selectors)) {
    if (
      !new RegExp(
        `\\bcss\\.${selector}\\b|\\bcss\\[['\"]${selector}['\"]\\]`
      ).test(sourceText)
    ) {
      violations.push(
        `${display}: .${selector} is not referenced by audited component sources.`
      );
    }
  }
}

for (const duplicatePaths of hashes.values()) {
  if (duplicatePaths.length > 1)
    violations.push(`Exact CSS duplicate: ${duplicatePaths.join(', ')}`);
}

const infoCss = await readFile(
  resolve(COMPONENT_ROOT, 'info/InfoPage/InfoPage.module.css'),
  'utf8'
);

for (const selector of [
  'page',
  'layout',
  'header',
  'title',
  'description',
  'highlightCard',
  'indexCard',
]) {
  const count = (
    infoCss.match(new RegExp(`^\\.${selector}\\s*\\{`, 'gm')) ?? []
  ).length;
  if (count > 1)
    violations.push(
      `InfoPage.module.css: .${selector} has ${count} base declarations.`
    );
}

const mobileCss = await readFile(
  resolve(COMPONENT_ROOT, 'layout/MobileOffcanvas/MobileOffcanvas.module.css'),
  'utf8'
);

if (
  /@media[^{}]*min-width:\s*1440px[\s\S]*?\.backdrop[\s\S]*?display:\s*none/.test(
    mobileCss
  )
) {
  violations.push(
    'MobileOffcanvas: CSS must not hide an active modal at desktop breakpoint.'
  );
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  `Client component style check passed (${cssFiles.length} CSS modules scanned).`
);
