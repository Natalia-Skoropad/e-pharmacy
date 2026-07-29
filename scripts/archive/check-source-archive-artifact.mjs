import path from 'node:path';

import { verifySourceArchiveZip } from './source-archive-zip.mjs';

//===================================================================

const archiveArgument = process.argv[2] ?? '.artifacts/e-pharmacy-source.zip';
const archivePath = path.resolve(process.cwd(), archiveArgument);

//===================================================================

const result = await verifySourceArchiveZip(archivePath, {
  requiredFiles: [
    'package.json',
    'pnpm-lock.yaml',
    'apps/api/package.json',
    'apps/client/package.json',
    'apps/pharmacy/package.json',
  ],
});

//===================================================================

console.log(
  `Final source ZIP hygiene check passed (${result.entryCount} entries): ${result.archivePath}`
);
