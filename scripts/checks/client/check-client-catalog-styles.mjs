import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import process from 'node:process';

//===================================================================

const ROOT = resolve(import.meta.dirname, '../../..');
const COMPONENT_ROOT = resolve(ROOT, 'apps/client/src/components');

const roots = ['catalog', 'product-catalog', 'pharmacies'].map((name) =>
  resolve(COMPONENT_ROOT, name)
);

const violations = [];

//===================================================================

async function collectCss(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectCss(path)));
    else if (entry.name.endsWith('.module.css')) files.push(path);
  }

  return files;
}

//===================================================================

function declarations(css) {
  return new Set(
    [...css.matchAll(/([a-zA-Z-]+)\s*:\s*([^;{}]+);/g)].map(
      ([, property, value]) =>
        `${property.trim()}:${value.trim().replace(/\s+/g, ' ')}`
    )
  );
}

//===================================================================

function similarity(left, right) {
  const intersection = [...left].filter((value) => right.has(value)).length;
  const union = new Set([...left, ...right]).size;
  return union === 0 ? 0 : intersection / union;
}

//===================================================================

const files = (await Promise.all(roots.map(collectCss))).flat();
const metadata = [];
const hashes = new Map();

//===================================================================

for (const file of files) {
  const css = await readFile(file, 'utf8');
  const display = relative(ROOT, file);
  const lines = css.split(/\r?\n/).length;

  if (/!important/.test(css)) {
    violations.push(`${display}: !important is forbidden.`);
  }

  if (lines > 220) {
    violations.push(
      `${display}: stylesheet exceeds the 220-line responsibility budget (${lines}).`
    );
  }

  const media768 = css.indexOf('@media only screen and (min-width: 768px)');
  const media1440 = css.indexOf('@media only screen and (min-width: 1440px)');

  if (media768 !== -1 && media1440 !== -1 && media768 > media1440) {
    violations.push(`${display}: 768px media block must precede 1440px.`);
  }

  const hash = createHash('sha256').update(css).digest('hex');
  const duplicatePaths = hashes.get(hash) ?? [];
  duplicatePaths.push(display);
  hashes.set(hash, duplicatePaths);

  metadata.push({ display, declarations: declarations(css) });
}

for (const paths of hashes.values()) {
  if (paths.length > 1)
    violations.push(`Exact CSS duplicate: ${paths.join(', ')}`);
}

for (let index = 0; index < metadata.length; index += 1) {
  for (
    let otherIndex = index + 1;
    otherIndex < metadata.length;
    otherIndex += 1
  ) {
    const left = metadata[index];
    const right = metadata[otherIndex];
    const score = similarity(left.declarations, right.declarations);

    if (score >= 0.85) {
      violations.push(
        `Near-duplicate CSS (${(score * 100).toFixed(1)}% declarations): ${left.display}, ${right.display}`
      );
    }
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  `Client catalog style check passed (${files.length} CSS modules; exact and near-duplicate analysis complete).`
);
