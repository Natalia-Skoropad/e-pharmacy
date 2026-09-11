import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

//===================================================================

function collectSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) return collectSourceFiles(path);
    if (!/\.(?:ts|tsx)$/.test(entry.name)) return [];

    return [path];
  });
}

//===================================================================

test('pharmacy lib does not depend on app, components, or providers', () => {
  const libDirectory = join(process.cwd(), 'src', 'lib');

  const forbiddenImport =
    /from\s+['"]@\/(?:app|components|providers)(?:\/|['"])/;

  const violations = collectSourceFiles(libDirectory).filter((file) =>
    forbiddenImport.test(readFileSync(file, 'utf8'))
  );

  assert.deepEqual(violations, []);
});
