import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  '..'
);

//===================================================================

async function readSource(relativePath) {
  return readFile(path.join(ROOT_DIR, relativePath), 'utf8');
}

//===================================================================

async function collectSourceFiles(relativeDir) {
  const absoluteDir = path.join(ROOT_DIR, relativeDir);
  const entries = await readdir(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(relativePath)));
    } else if (
      /\.tsx?$/.test(entry.name) &&
      !entry.name.includes('.test.') &&
      !entry.name.includes('.react.test.')
    ) {
      files.push(relativePath);
    }
  }

  return files;
}

//===================================================================

const componentFiles = (
  await Promise.all([
    collectSourceFiles('apps/pharmacy/src/components/auth'),
    collectSourceFiles('apps/pharmacy/src/components/profile'),
    collectSourceFiles('apps/pharmacy/src/components/comments'),
  ])
).flat();

for (const file of componentFiles) {
  const source = await readSource(file);
  assert.doesNotMatch(source, /\bfetch\s*\(/, `${file} uses raw fetch`);

  assert.doesNotMatch(
    source,
    /\b(?:Authorization|accessToken|refreshToken)\b/,
    `${file} accesses browser auth tokens/headers`
  );

  assert.doesNotMatch(
    source,
    /\b(?:localStorage|sessionStorage|indexedDB)\b/,
    `${file} persists private account state in browser storage`
  );

  assert.doesNotMatch(
    source,
    /(?:from|import\s*\()\s*['"][^'"]*apps\/api/,
    `${file} imports backend implementation`
  );

  assert.doesNotMatch(
    source,
    /https?:\/\//,
    `${file} contains a direct backend URL`
  );
}

const authProvider = await readSource(
  'apps/pharmacy/src/providers/AuthProvider/AuthProvider.tsx'
);

assert.match(authProvider, /AuthProviderCore/);
assert.match(authProvider, /pharmacyAuthServices/);
assert.doesNotMatch(authProvider, /\buseState\b|accessToken|refreshToken/);

const profileProvider = await readSource(
  'apps/pharmacy/src/providers/PharmacyProfileProvider/PharmacyProfileProvider.tsx'
);

assert.match(profileProvider, /getCurrentPharmacySummary/);
assert.doesNotMatch(profileProvider, /getMyPharmacyProfile/);
assert.doesNotMatch(profileProvider, /bankDetails|documents|pendingModeration/);

const profilePage = await readSource(
  'apps/pharmacy/src/components/profile/PharmacyProfilePageContent/PharmacyProfilePageContent.tsx'
);

assert.match(profilePage, /<TabPanel/);
assert.match(profilePage, /idBase=\{PROFILE_TABS_ID_BASE\}/);
assert.doesNotMatch(profilePage, /role=["']tabpanel["']/);

const commentsResource = await readSource(
  'apps/pharmacy/src/components/comments/EntityComments/useEntityCommentsResource.ts'
);

assert.match(commentsResource, /activeCreateControllerRef/);
assert.match(commentsResource, /activeDeleteControllerRef/);
assert.match(commentsResource, /clientRequestId/);

const notesRoute = await readSource(
  'apps/api/src/routes/pharmacy-note.routes.ts'
);

assert.match(notesRoute, /authenticate/);
assert.match(notesRoute, /authorizeRoles\(USER_ROLES\.PHARMACY\)/);

const browserApiFiles = [
  'apps/pharmacy/src/lib/api/browser/auth.api.ts',
  'apps/pharmacy/src/lib/api/browser/pharmacy.api.ts',
  'apps/pharmacy/src/lib/api/browser/pharmacy-notes.api.ts',
  'apps/pharmacy/src/lib/api/browser/orders.api.ts',
];

for (const file of browserApiFiles) {
  const source = await readSource(file);
  assert.match(source, /localApiRequest/);
  assert.doesNotMatch(source, /\bfetch\s*\(|Authorization|https?:\/\//);
}

const privateBffFiles = [
  'apps/pharmacy/src/app/api/pharmacies/me/profile/route.ts',
  'apps/pharmacy/src/app/api/pharmacy-notes/[entityType]/[entityId]/route.ts',
  'apps/pharmacy/src/app/api/pharmacy-notes/[entityType]/[entityId]/[noteId]/route.ts',
];

for (const file of privateBffFiles) {
  const source = await readSource(file);
  assert.match(
    source,
    /createPrivateProxyRoute/,
    `${file} must use the private BFF proxy`
  );
}

console.log(
  `Pharmacy account component check passed (${componentFiles.length} source files scanned).`
);
