import { access, readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import process from 'node:process';

//===================================================================

const ROOT = resolve(import.meta.dirname, '../../..');
const COMPONENT_ROOT = resolve(ROOT, 'apps/client/src/components');

const AUDITED_ROOTS = ['common', 'home', 'info', 'layout'].map((name) =>
  resolve(COMPONENT_ROOT, name)
);

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

for (const root of AUDITED_ROOTS) {
  for (const file of await collect(root)) {
    const display = relative(ROOT, file);
    if (extname(file) !== '.ts' && extname(file) !== '.tsx') continue;
    const source = await readFile(file, 'utf8');

    if (/^export\s+(?:\*|\{[^}]+\})\s+from\s+['"]@e-pharmacy\//m.test(source)) {
      violations.push(
        `${display}: local shared-package re-export wrapper is forbidden.`
      );
    }

    if (file.endsWith('/index.ts')) {
      const meaningfulLines = source
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      if (meaningfulLines.length <= 1) {
        violations.push(
          `${display}: one-line nested barrel adds no public API value.`
        );
      }
    }
  }
}

for (const removedPath of [
  'common/DeliveryInfoCard',
  'common/PaymentInfoCard',
  'home/index.ts',
  'info/index.ts',
]) {
  const target = resolve(COMPONENT_ROOT, removedPath);
  try {
    await access(target);
    violations.push(
      `${relative(ROOT, target)}: deprecated wrapper/barrel path still exists.`
    );
  } catch {
    // Expected: removed path does not exist.
  }
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Client component public API check passed.');
