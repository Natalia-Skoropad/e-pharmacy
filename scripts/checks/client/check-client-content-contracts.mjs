import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

//===================================================================

const ROOT = resolve(import.meta.dirname, '../../..');

const INFO_CONFIG_ROOT = resolve(
  ROOT,
  'apps/client/src/components/info/config'
);

const violations = [];
const entries = await readdir(INFO_CONFIG_ROOT);

const documentFiles = entries.filter((name) =>
  /^(?:delivery-payment|personal-data-notice|return-policy|user-agreement)\.ts$/.test(
    name
  )
);

const seenIds = new Set();

//===================================================================

for (const name of documentFiles) {
  const source = await readFile(resolve(INFO_CONFIG_ROOT, name), 'utf8');
  if (!/as const satisfies InfoPageData;/.test(source))
    violations.push(`${name}: config must satisfy InfoPageData.`);

  if (/updatedAt:\s*['"]/.test(source))
    violations.push(`${name}: updatedAt must be structured.`);

  if (!/iso:\s*['"]\d{4}-\d{2}(?:-\d{2})?['"]/.test(source))
    violations.push(`${name}: updatedAt.iso must be ISO-compatible.`);

  for (const field of [
    'version',
    'effectiveAt',
    'contentOwner',
    'approvalStatus',
    'legalEntity',
    'supportRoute',
    'reviewId',
  ]) {
    if (!new RegExp(`${field}:`).test(source))
      violations.push(`${name}: metadata.${field} is missing.`);
  }

  for (const match of source.matchAll(/\bid:\s*['"]([a-z0-9-]+)['"]/g)) {
    const scoped = `${name}:${match[1]}`;
    if (seenIds.has(scoped))
      violations.push(`${name}: duplicate explicit id ${match[1]}.`);
    seenIds.add(scoped);
  }

  if (/toLowerCase\(\).*replace\(/s.test(source))
    violations.push(`${name}: visible titles must not generate anchor IDs.`);
}

//===================================================================

const homeSources = await Promise.all([
  readFile(resolve(ROOT, 'apps/client/src/app/page.tsx'), 'utf8'),

  readFile(
    resolve(ROOT, 'apps/client/src/components/home/config/content.ts'),
    'utf8'
  ),

  readFile(resolve(ROOT, 'apps/client/src/lib/seo/metadata-copy.ts'), 'utf8'),
]);

const home = homeSources.join('\n');

for (const claim of [
  /Buy product/i,
  /Your medication delivered/i,
  /Order products online/i,
  /Quick online orders/i,
  /repeat purchases/i,
]) {
  if (claim.test(home))
    violations.push(`Home content contains misleading claim: ${claim}.`);
}

const footer = await readFile(
  resolve(ROOT, 'apps/client/src/components/layout/Footer/Footer.tsx'),
  'utf8'
);

for (const placeholder of ['facebook.com/', 'instagram.com/', 'youtube.com/']) {
  if (footer.includes(placeholder))
    violations.push(`Footer contains placeholder social URL: ${placeholder}`);
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(
  `Client content contract check passed (${documentFiles.length} documents checked).`
);
