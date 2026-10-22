import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

// Source-only guard: runs without Next, MongoDB or network access.
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const read = (relative) => readFile(path.join(root, relative), 'utf8');

const app = 'apps/admin/src';
const section = `${app}/components/pharmacies`;

const shell = await read(
  `${section}/PharmacyDetailsPageContent/PharmacyDetailsPageContent.tsx`
);

const actions = await read(
  `${section}/PharmacyDetailsPageContent/PharmacyModerationActions.tsx`
);

const options = await read(
  `${app}/lib/pharmacies/pharmacy-moderation-actions.ts`
);

const routes = await read('apps/api/src/routes/admin.routes.ts');
const backend = await read('apps/api/src/services/admin/pharmacies/admin.service.ts');

const registry = await read(
  'apps/api/src/services/admin/pharmacies/admin-pharmacy-registry-read.service.ts'
);

//===================================================================

assert.match(options, /owner\.status !== 'blocked'/);
assert.match(backend, /owner\.status === USER_STATUSES\.BLOCKED/);

assert.match(
  shell,
  /canAdmin\(access, ADMIN_PERMISSIONS\.pharmacies\.moderate\)/
);

assert.match(shell, /detail && canModerate/);
assert.match(actions, /<ReasonModal/);

assert.match(
  routes,
  /'\/pharmacies\/:pharmacyId\/moderation-decisions',\s*requireAdminPermission\(ADMIN_PERMISSIONS\.pharmacies\.moderate\)/
);

assert.match(registry, /safePage !== page/);

for (const tab of ['documents', 'comments', 'activity']) {
  assert.ok(
    shell.includes(`activeTab === '${tab}' ? (`),
    `Lazy ${tab} tab must own its own loading state`
  );
}

assert.match(shell, /DEFERRED_TABS\[activeTab\]/);

assert.doesNotMatch(
  shell,
  /getAdminPharmacyReviews|getAdminPharmacyOrders|getAdminPharmacyClients|getAdminPharmacyProducts\(/
);

const uiDirectory = path.join(root, section);
let scanned = 0;

async function scan(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      await scan(file);
      continue;
    }

    if (!entry.isFile() || !/\.(?:tsx?|module\.css)$/.test(entry.name))
      continue;

    if (/\.test\.tsx?$/.test(entry.name)) continue;

    scanned++;
    const src = await readFile(file, 'utf8');
    const label = path.relative(root, file);

    assert.ok(src.trim().length > 20, `Empty/no-op source file: ${label}`);

    assert.doesNotMatch(
      src,
      /(?:linear|radial|conic)-gradient\s*\(/i,
      `Gradient forbidden: ${label}`
    );

    assert.doesNotMatch(
      src,
      /from\s*['"](?:@\/apps\/|\.\.\/\.\.\/\.\.\/\.\.\/api\/src\/)/,
      `Cross-app import boundary: ${label}`
    );

    assert.doesNotMatch(
      src,
      /\b(?:fetch|localApiRequest)\s*\(/,
      `Component must use API browser layer: ${label}`
    );

    assert.doesNotMatch(
      src,
      /(?:function|const|class)\s+(?:ReasonModal|DocumentsPanel|ActivityHistory|CommentsList|StatsGrid)\b/,
      `Duplicate canonical UI: ${label}`
    );

    assert.doesNotMatch(
      src,
      /^\s*export\s*\{\s*default\s*\}\s*from\s*['"][^'"]+['"];?\s*$/m,
      `Pure proxy wrapper: ${label}`
    );
  }
}

await scan(uiDirectory);

assert.ok(scanned >= 15, `Unexpected pharmacy UI count: ${scanned}`);

const bff = await read(`${app}/lib/api/routes/admin-api-routes.ts`);

assert.doesNotMatch(
  bff,
  /pharmacyReviews:|pharmacyOrders:|pharmacyClients:|pharmacyProducts:|pharmacyProductRequests:/
);

//===================================================================

console.log(
  `Stage 14.17 pharmacy hardening checks passed (${scanned} UI source/styles files; no proxy, duplicate shared UI, gradient or future API routes).`
);
