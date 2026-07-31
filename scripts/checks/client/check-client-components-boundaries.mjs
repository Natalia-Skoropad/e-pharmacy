import { readdir, readFile } from 'node:fs/promises';
import { extname, relative, resolve } from 'node:path';
import process from 'node:process';

//===================================================================

const ROOT = resolve(import.meta.dirname, '../../..');
const COMPONENT_ROOT = resolve(ROOT, 'apps/client/src/components');
const LAYERS = ['common', 'home', 'info', 'layout'];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);
const violations = [];

//===================================================================

async function collect(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collect(path)));
    else if (
      SOURCE_EXTENSIONS.has(extname(entry.name)) &&
      !entry.name.includes('.test.')
    )
      files.push(path);
  }

  return files;
}

//===================================================================

for (const layer of LAYERS) {
  const files = await collect(resolve(COMPONENT_ROOT, layer));
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const display = relative(ROOT, file);

    if (
      layer === 'common' &&
      /from ['"]@\/components\/(?:home|info|layout|product-catalog|pharmacies|cart|checkout|profile)\//.test(
        source
      )
    ) {
      violations.push(
        `${display}: common must not import feature or layout internals.`
      );
    }

    if (
      layer === 'home' &&
      /from ['"]@\/lib\/api\/(?:browser|server)|useClientAuthCapabilities|router\.push\(/.test(
        source
      )
    ) {
      violations.push(
        `${display}: home presentation must not own API or route-authorization lifecycle.`
      );
    }

    if (
      layer === 'info' &&
      /from ['"]@\/(?:providers|hooks|components\/cart)|useClientAuthCapabilities/.test(
        source
      )
    ) {
      violations.push(
        `${display}: info components must remain independent of auth and cart state.`
      );
    }

    if (
      layer === 'info' &&
      /(?:InfoPage|InfoNavigation)\.tsx$/.test(file) &&
      /^['"]use client['"];?/m.test(source)
    ) {
      violations.push(
        `${display}: static info renderers must remain server-compatible.`
      );
    }

    if (
      layer === 'layout' &&
      /from ['"]@\/components\/(?:product-catalog|pharmacies|checkout|profile)\//.test(
        source
      )
    ) {
      violations.push(
        `${display}: layout must not import feature page internals.`
      );
    }
  }
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log('Client component boundary check passed.');
