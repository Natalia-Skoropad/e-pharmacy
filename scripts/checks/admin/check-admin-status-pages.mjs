import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';

//===================================================================

const root = new URL('../../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const admin = (path) => read(`apps/admin/${path}`);

const required = [
  'src/app/loading.tsx',
  'src/app/not-found.tsx',
  'src/app/error.tsx',
  'src/app/global-error.tsx',
  'src/lib/status-pages/status-page-image.ts',
  'src/lib/errors/report-render-error.ts',
  'src/lib/errors/report-render-error.test.ts',
  'src/app/error.react.test.tsx',
];

for (const path of required) {
  assert.ok(
    admin(path).trim(),
    `Admin status-page file must exist and be non-empty: ${path}`
  );
}

const loading = admin('src/app/loading.tsx');
const notFound = admin('src/app/not-found.tsx');
const error = admin('src/app/error.tsx');
const globalError = admin('src/app/global-error.tsx');
const diagnostic = admin('src/lib/errors/report-render-error.ts');
const imageContract = admin('src/lib/status-pages/status-page-image.ts');

//===================================================================

assert.doesNotMatch(
  loading,
  /['"]use client['"]/,
  'loading.tsx must remain a Server Component'
);

assert.match(
  loading,
  /import\s*\{\s*PageLoader\s*\}\s*from ['"]@e-pharmacy\/ui\/status-pages['"]/,
  'loading.tsx must use the shared PageLoader public entrypoint'
);

assert.match(
  loading,
  /<PageLoader\s+label=['"]Loading admin cabinet\.\.\.['"]\s*\/>/,
  'loading.tsx must keep the admin-specific loader label'
);

assert.doesNotMatch(
  notFound,
  /['"]use client['"]/,
  'not-found.tsx must remain a Server Component'
);

assert.match(
  notFound,
  /NotFoundPage\s+as\s+SharedNotFoundPage/,
  'not-found.tsx must use the shared NotFoundPage'
);

assert.match(notFound, /homeHref=\{ADMIN_ROUTES\.DASHBOARD\}/);
assert.match(notFound, /image=\{STATUS_PAGE_IMAGE\}/);
assert.match(notFound, /variant=['"]brand['"]/);
assert.match(notFound, /landmark=['"]main['"]/);

assert.doesNotMatch(
  notFound,
  /secondaryAction\s*=/,
  'Stage 2 admin 404 must not link to future business modules'
);

assert.match(
  error,
  /^\s*['"]use client['"];?/,
  'error.tsx must be a Client Component'
);

assert.match(error, /ErrorPage\s+as\s+SharedErrorPage/);
assert.match(error, /reportRenderError\(error, ['"]route-boundary['"]\)/);
assert.match(error, /onRetry=\{reset\}/);
assert.match(error, /homeHref=\{ADMIN_ROUTES\.DASHBOARD\}/);
assert.match(error, /image=\{STATUS_PAGE_IMAGE\}/);

assert.match(
  globalError,
  /^\s*['"]use client['"];?/,
  'global-error.tsx must be a Client Component'
);

assert.match(globalError, /reportRenderError\(error, ['"]root-layout['"]\)/);
assert.match(globalError, /<html\b/);
assert.match(globalError, /<body\b/);

assert.match(
  globalError,
  /<meta\s+name=['"]robots['"]\s+content=['"]noindex, nofollow['"]\s*\/>/,
  'global-error.tsx must preserve noindex, nofollow without root metadata'
);

assert.match(globalError, /onRetry=\{reset\}/);
assert.match(globalError, /image=\{STATUS_PAGE_IMAGE\}/);

assert.doesNotMatch(
  globalError,
  /AdminProviders|ToastProvider|AuthProvider/,
  'global-error.tsx must not depend on application providers'
);

for (const stylesheet of ['tokens', 'reset', 'base', 'utilities']) {
  assert.ok(
    globalError.includes(`import '@e-pharmacy/ui/styles/${stylesheet}.css'`),
    `global-error.tsx must import ${stylesheet}.css directly`
  );
}
assert.match(globalError, /import ['"]\.\/styles\.css['"]/);

//===================================================================

assert.match(
  imageContract,
  /src:\s*['"]\/images\/status\/status-pills\.png['"]/
);

assert.match(imageContract, /alt:\s*['"]['"]/);
assert.match(imageContract, /width:\s*749/);
assert.match(imageContract, /height:\s*508/);
assert.match(imageContract, /priority:\s*true/);

const imageUrl = new URL(
  'apps/admin/public/images/status/status-pills.png',
  root
);

assert.ok(existsSync(imageUrl), 'Admin status-page illustration must exist');

assert.ok(
  statSync(imageUrl).size > 0,
  'Admin status-page illustration must not be empty'
);

//===================================================================

assert.match(diagnostic, /application:\s*['"]admin['"]/);
assert.match(diagnostic, /category:\s*['"]render_error['"]/);

assert.doesNotMatch(
  diagnostic,
  /error\.(?:message|stack)|JSON\.stringify\(error\)|console\.error\(error\)/,
  'Render-error diagnostics must not expose raw error details'
);

const boundarySources = [loading, notFound, error, globalError];
const forbiddenRuntimeLogic =
  /\b(?:fetch|localApiRequest|XMLHttpRequest|WebSocket)\s*\(|axios|API_BASE_URL|BACKEND_URL|accessToken|refreshToken|Authorization|document\s*\.\s*cookie|localStorage|sessionStorage|indexedDB/;

for (const source of boundarySources) {
  assert.doesNotMatch(
    source,
    forbiddenRuntimeLogic,
    'Admin status boundaries must not own auth/network/token logic'
  );

  assert.doesNotMatch(
    source,
    /(?:from|import\s+)\s*['"][^'"]*apps\/(?:pharmacy|client)|from\s+['"]@\/(?:\.\.\/)*apps\/(?:pharmacy|client)/,
    'Admin status boundaries must not import another application'
  );
}

//===================================================================

const scripts = JSON.parse(read('package.json')).scripts;

assert.equal(
  scripts['check:admin-status-pages'],
  'node scripts/checks/admin/check-admin-status-pages.mjs'
);

const adminCheck = scripts['check:admin'].split(/\s*&&\s*/);
const statusCommand = 'pnpm check:admin-status-pages';
const providersCommand = 'pnpm check:admin-providers';
const adminLint = 'pnpm --filter @e-pharmacy/admin lint';

assert.equal(
  adminCheck.filter((step) => step === statusCommand).length,
  1,
  'check:admin-status-pages must run exactly once in check:admin'
);

assert.ok(
  adminCheck.indexOf(statusCommand) > adminCheck.indexOf(providersCommand),
  'Status-page check must follow the existing stage-1 structural checks'
);

assert.ok(
  adminCheck.indexOf(statusCommand) < adminCheck.indexOf(adminLint),
  'Status-page check must run before lint/type-check/build'
);

const deploy = scripts['check:before-deploy'].split(/\s*&&\s*/);

assert.equal(
  deploy.filter((step) => step === statusCommand).length,
  1,
  'check:admin-status-pages must run exactly once in check:before-deploy'
);

assert.ok(
  deploy.indexOf(statusCommand) < deploy.indexOf('pnpm lint'),
  'Status-page check must run in the structural section before workspace lint'
);

assert.ok(
  !deploy.includes('pnpm check:admin'),
  'check:before-deploy must not duplicate the full admin check'
);

//===================================================================

console.log('Admin status-pages check passed.');
