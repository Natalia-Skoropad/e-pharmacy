import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const layoutRoot = path.join(root, 'apps/pharmacy/src/components/layout');

const ignored = new Set([
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'coverage',
]);

//===================================================================

async function assertMissing(relativePath, message) {
  try {
    await access(path.join(root, relativePath));
  } catch {
    return;
  }

  assert.fail(message);
}

//===================================================================

async function listFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;

    const target = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listFiles(target)));
      continue;
    }

    if (/\.(?:ts|tsx|css)$/.test(entry.name)) files.push(target);
  }

  return files;
}

//===================================================================

function isTestFile(file) {
  return /\.(?:test|react\.test|integration\.test)\.(?:ts|tsx)$/.test(file);
}

//===================================================================

const files = await listFiles(layoutRoot);
const violations = [];

//===================================================================

for (const file of files) {
  if (isTestFile(file)) continue;

  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');

  if (/from\s+['"]@\/lib\/api\/browser['"]/.test(source)) {
    violations.push(
      `${relative}: layout must import a narrow browser API adapter instead of the browser barrel`
    );
  }

  if (
    /from\s+['"](?:@e-pharmacy\/next-api\/server|@\/lib\/api\/server|[^'"]*apps\/api)/.test(
      source
    )
  ) {
    violations.push(
      `${relative}: layout must not import server/backend modules`
    );
  }

  if (/\bfetch\s*\(/.test(source)) {
    violations.push(`${relative}: layout must not perform direct fetch calls`);
  }

  if (
    /\b(?:accessToken|refreshToken|Authorization)\b|document\.cookie/.test(
      source
    )
  ) {
    violations.push(`${relative}: layout must not own auth token/cookie state`);
  }

  if (/\b(?:getMyPharmacyProfile|bankDetails|documents)\b/.test(source)) {
    violations.push(
      `${relative}: layout must not depend on full pharmacy profile data`
    );
  }

  if (/\.SideMenu-module__/.test(source)) {
    violations.push(
      `${relative}: layout CSS must not depend on generated shared SideMenu CSS-module internals`
    );
  }
}

//===================================================================

const sidebar = await readFile(
  path.join(layoutRoot, 'PharmacySidebar/PharmacySidebar.tsx'),
  'utf8'
);

assert.match(
  sidebar,
  /from ['"]@\/lib\/api\/browser\/orders\.api['"]/,
  'PharmacySidebar must depend on the narrow orders browser adapter'
);

const [header, mobileMenu, shell, breadcrumbEvent, navigation] =
  await Promise.all([
    readFile(
      path.join(layoutRoot, 'PharmacyHeader/PharmacyHeader.tsx'),
      'utf8'
    ),
    readFile(
      path.join(layoutRoot, 'PharmacyMobileMenu/PharmacyMobileMenu.tsx'),
      'utf8'
    ),
    readFile(path.join(layoutRoot, 'PharmacyShell/PharmacyShell.tsx'), 'utf8'),
    readFile(
      path.join(root, 'apps/pharmacy/src/lib/layout/breadcrumb-label-event.ts'),
      'utf8'
    ),
    readFile(
      path.join(root, 'apps/pharmacy/src/lib/layout/navigation.ts'),
      'utf8'
    ),
  ]);

assert.match(
  header,
  /getPharmacyNavigationItemByPathname\(pathname\)/,
  'PharmacyHeader must derive section presentation from canonical navigation metadata'
);

assert.doesNotMatch(
  header,
  /label\s*===\s*['"](?:Dashboard|Orders|Clients|Own products|All products|Product requests|Pharmacy profile)['"]/,
  'PharmacyHeader must not use breadcrumb display labels as route identity'
);

assert.match(
  header,
  /usePharmacyLogoutController\(logout\)/,
  'PharmacyHeader must own the single pharmacy logout controller'
);

assert.doesNotMatch(
  mobileMenu,
  /getSharedLoginUrl|usePharmacyLogoutController|setIsLogoutLoading/,
  'PharmacyMobileMenu must consume the Header-owned logout lifecycle instead of owning another one'
);

assert.match(
  mobileMenu,
  /items=\{PHARMACY_NAVIGATION\}/,
  'PharmacyMobileMenu must render the canonical pharmacy navigation config'
);

assert.match(
  sidebar,
  /items=\{PHARMACY_NAVIGATION\}/,
  'PharmacySidebar must render the canonical pharmacy navigation config'
);

assert.match(
  navigation,
  /export const PHARMACY_NAVIGATION/,
  'Pharmacy navigation metadata must remain owned by lib/layout/navigation'
);

assert.match(
  shell,
  /subscribeToPharmacyBreadcrumbLabels/,
  'PharmacyShell must consume the canonical breadcrumb-label subscription contract'
);

assert.doesNotMatch(
  shell,
  /pharmacy:breadcrumb-current-label/,
  'PharmacyShell must not redefine the breadcrumb CustomEvent name'
);

assert.match(
  breadcrumbEvent,
  /const BREADCRUMB_LABEL_EVENT = 'pharmacy:breadcrumb-current-label'/,
  'breadcrumb-label-event.ts must remain the single owner of the breadcrumb event name'
);

await assertMissing(
  'apps/pharmacy/src/components/layout/PharmacyMobileMenu/index.ts',
  'PharmacyMobileMenu is an internal Header child and must not keep an unused public barrel'
);

assert.deepEqual(violations, [], violations.join('\n'));

console.log(
  `Pharmacy-layout check passed (${files.length} layout source/style files scanned).`
);
