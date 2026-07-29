import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { prepareSourceArchive } from './prepare-source-archive.mjs';
import {
  createSourceArchiveZip,
  verifySourceArchiveZip,
} from './source-archive-zip.mjs';

//===================================================================

const repositoryRoot = path.resolve(
  fileURLToPath(new URL('../../', import.meta.url))
);

const outputPath = path.resolve(
  repositoryRoot,
  process.argv[2] ?? '.artifacts/e-pharmacy-source.zip'
);

const stagingPath = path.resolve(
  repositoryRoot,
  process.argv[3] ?? '.artifacts/e-pharmacy-source'
);

const requiredFiles = [
  'package.json',
  'pnpm-lock.yaml',
  'apps/api/package.json',
  'apps/client/package.json',
  'apps/pharmacy/package.json',
  'packages/config/package.json',
];

//===================================================================

const stagedRoot = await prepareSourceArchive({
  repositoryRoot,
  outputPath: stagingPath,
});

const created = await createSourceArchiveZip(stagedRoot, outputPath);
const verified = await verifySourceArchiveZip(outputPath, {
  requiredFiles,
});

console.log(
  `Clean source ZIP created at ${created.outputPath} (${created.fileCount} files; ${verified.entryCount} verified entries).`
);
