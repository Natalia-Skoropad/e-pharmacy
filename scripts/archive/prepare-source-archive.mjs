import {
  copyFile,
  lstat,
  mkdir,
  readdir,
  readlink,
  rm,
  symlink,
} from 'node:fs/promises';

import path from 'node:path';

//===================================================================

export const SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES = new Set([
  '.artifacts',
  '.git',
  '.next',
  '.turbo',
  '.vercel',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);

export const SOURCE_ARCHIVE_EXCLUDED_FILE_PATTERNS = [
  /(^|\/)\.env(?:\..*)?$/i,
  /(^|\/)(?:npm|pnpm|yarn)-debug\.log(?:\..*)?$/i,
  /(^|\/)\.DS_Store$/,
  /(^|\/)Thumbs\.db$/i,
  /\.tsbuildinfo$/i,
  /\.zip$/i,
];

//===================================================================

function normalizeRelativePath(value) {
  return value.replaceAll('\\', '/');
}

//===================================================================

function isExcludedFile(relativePath) {
  const normalized = normalizeRelativePath(relativePath);

  return SOURCE_ARCHIVE_EXCLUDED_FILE_PATTERNS.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(normalized);
  });
}

//===================================================================

function isInside(parentPath, candidatePath) {
  const relative = path.relative(parentPath, candidatePath);
  return (
    relative === '' ||
    (!relative.startsWith('..') && !path.isAbsolute(relative))
  );
}

//===================================================================

async function copySourceTree({
  sourceRoot,
  destinationRoot,
  currentDirectory,
}) {
  const entries = await readdir(currentDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(currentDirectory, entry.name);

    if (isInside(destinationRoot, sourcePath)) continue;

    const relativePath = path.relative(sourceRoot, sourcePath);
    const destinationPath = path.join(destinationRoot, relativePath);

    if (entry.isDirectory()) {
      if (SOURCE_ARCHIVE_EXCLUDED_DIRECTORIES.has(entry.name)) continue;

      await mkdir(destinationPath, { recursive: true });
      await copySourceTree({
        sourceRoot,
        destinationRoot,
        currentDirectory: sourcePath,
      });
      continue;
    }

    if (entry.isFile()) {
      if (isExcludedFile(relativePath)) continue;

      await mkdir(path.dirname(destinationPath), { recursive: true });
      await copyFile(sourcePath, destinationPath);
      continue;
    }

    if (entry.isSymbolicLink()) {
      const target = await readlink(sourcePath);
      const resolvedTarget = path.resolve(path.dirname(sourcePath), target);

      if (!isInside(sourceRoot, resolvedTarget)) {
        throw new Error(
          `Source archive cannot include an external symlink: ${normalizeRelativePath(relativePath)}.`
        );
      }

      await mkdir(path.dirname(destinationPath), { recursive: true });
      await symlink(target, destinationPath);
    }
  }
}

//===================================================================

export async function prepareSourceArchive({ repositoryRoot, outputPath }) {
  const sourceRoot = path.resolve(repositoryRoot);
  const destinationRoot = path.resolve(outputPath);

  const sourceStats = await lstat(sourceRoot);
  if (!sourceStats.isDirectory()) {
    throw new Error(`Repository root is not a directory: ${sourceRoot}`);
  }

  if (destinationRoot === sourceRoot) {
    throw new Error(
      'Source archive staging path cannot equal the repository root.'
    );
  }

  await rm(destinationRoot, { recursive: true, force: true });
  await mkdir(destinationRoot, { recursive: true });

  await copySourceTree({
    sourceRoot,
    destinationRoot,
    currentDirectory: sourceRoot,
  });

  return destinationRoot;
}
