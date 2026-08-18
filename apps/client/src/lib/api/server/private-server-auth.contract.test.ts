import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

async function collectFiles(directory: string): Promise<string[]> {
  const files: string[] = [];

  for (const entry of await readdir(directory)) {
    const target = path.join(directory, entry);
    const info = await stat(target);

    if (info.isDirectory()) files.push(...(await collectFiles(target)));
    else if (/\.(?:ts|tsx)$/.test(entry)) files.push(target);
  }

  return files;
}

//===================================================================

test('private App Router files do not perform public or direct backend server reads', async () => {
  const privateRoot = path.resolve(process.cwd(), 'src/app/(private)');
  const files = await collectFiles(privateRoot);

  for (const file of files) {
    const source = await readFile(file, 'utf8');

    assert.doesNotMatch(
      source,
      /@\/lib\/api\/server|@e-pharmacy\/next-api\/server|publicBackendApiRequest|authenticatedBackendApiRequest/,
      `${path.relative(process.cwd(), file)} must not add a private SSR read without a dedicated authenticated reader and backend session policy.`
    );
  }
});
