import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const repositoryRoot = process.cwd();
const requestedOutput = process.argv[2] ?? '.artifacts/e-pharmacy-source';
const outputRoot = path.resolve(repositoryRoot, requestedOutput);

const excludedDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  '.vercel',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);

const excludedFilePatterns = [
  /\.zip$/i,
  /\.tsbuildinfo$/i,
  /(?:^|\/)npm-debug\.log/i,
  /(?:^|\/)pnpm-debug\.log/i,
  /(?:^|\/)yarn-(?:debug|error)\.log/i,
];

//===================================================================

function isInsideOutput(absolutePath) {
  const relative = path.relative(outputRoot, absolutePath);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

//===================================================================

function shouldExcludeFile(relativePath) {
  const normalized = relativePath.replaceAll('\\', '/');
  return excludedFilePatterns.some((pattern) => pattern.test(normalized));
}

//===================================================================

async function copySourceTree(sourceDirectory, targetDirectory) {
  await mkdir(targetDirectory, { recursive: true });
  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    if (excludedDirectories.has(entry.name)) continue;

    const source = path.join(sourceDirectory, entry.name);
    const target = path.join(targetDirectory, entry.name);

    if (isInsideOutput(source)) continue;

    if (entry.isDirectory()) {
      await copySourceTree(source, target);
      continue;
    }

    if (!entry.isFile()) continue;

    const relative = path.relative(repositoryRoot, source);
    if (shouldExcludeFile(relative)) continue;

    await mkdir(path.dirname(target), { recursive: true });
    await copyFile(source, target);
  }
}

//===================================================================

if (outputRoot === repositoryRoot) {
  throw new Error('Source archive output must not replace the repository root.');
}

await rm(outputRoot, { recursive: true, force: true });
await copySourceTree(repositoryRoot, outputRoot);

const outputStats = await stat(outputRoot);
if (!outputStats.isDirectory()) throw new Error('Source archive staging failed.');

console.log(`Clean source tree prepared at ${outputRoot}`);
