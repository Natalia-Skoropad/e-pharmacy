import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

export const SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES = new Set([
  '.artifacts',
  '.git',
  '.next',
  '.turbo',
  '.vercel',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);

export const SOURCE_ARCHIVE_EXCLUDED_FILE_PATTERNS = [
  /\.zip$/i,
  /\.tsbuildinfo$/i,
  /(?:^|\/)npm-debug\.log/i,
  /(?:^|\/)pnpm-debug\.log/i,
  /(?:^|\/)yarn-(?:debug|error)\.log/i,
];

//===================================================================

function isPathInside(parentPath, candidatePath) {
  const relative = path.relative(parentPath, candidatePath);

  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
}

//===================================================================

export function shouldExcludeSourceArchiveFile(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');

  return SOURCE_ARCHIVE_EXCLUDED_FILE_PATTERNS.some((pattern) =>
    pattern.test(normalized)
  );
}

//===================================================================

export async function prepareSourceArchive({
  repositoryRoot = process.cwd(),
  outputPath = '.artifacts/e-pharmacy-source',
} = {}) {
  const resolvedRepositoryRoot = path.resolve(repositoryRoot);
  const outputRoot = path.resolve(resolvedRepositoryRoot, outputPath);

  if (outputRoot === resolvedRepositoryRoot) {
    throw new Error('Source archive output must not replace the repository root.');
  }

  async function copySourceTree(sourceDirectory, targetDirectory) {
    await mkdir(targetDirectory, { recursive: true });
    const entries = await readdir(sourceDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES.has(entry.name)) continue;

      const source = path.join(sourceDirectory, entry.name);
      const target = path.join(targetDirectory, entry.name);

      if (isPathInside(outputRoot, source)) continue;

      if (entry.isDirectory()) {
        await copySourceTree(source, target);
        continue;
      }

      if (!entry.isFile()) continue;

      const relative = path.relative(resolvedRepositoryRoot, source);
      if (shouldExcludeSourceArchiveFile(relative)) continue;

      await mkdir(path.dirname(target), { recursive: true });
      await copyFile(source, target);
    }
  }

  await rm(outputRoot, { recursive: true, force: true });
  await copySourceTree(resolvedRepositoryRoot, outputRoot);

  const outputStats = await stat(outputRoot);
  if (!outputStats.isDirectory()) {
    throw new Error('Source archive staging failed.');
  }

  return outputRoot;
}

//===================================================================

const isMainModule =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMainModule) {
  const outputRoot = await prepareSourceArchive({
    outputPath: process.argv[2] ?? '.artifacts/e-pharmacy-source',
  });

  console.log(`Clean source tree prepared at ${outputRoot}`);
}
