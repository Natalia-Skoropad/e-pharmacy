import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

//===================================================================

const root = new URL('../../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, root), 'utf8');
const admin = (path) => read(`apps/admin/${path}`);

const required = [
  'package.json',
  'tsconfig.json',
  'eslint.config.mjs',
  'next.config.ts',
  '.env.example',
  'README.md',
  'src/app/icon.svg',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/app/styles.css',
  'src/app/robots.ts',
  'src/providers/AdminProviders.tsx',
  'src/providers/index.ts',
  'src/lib/routes/admin-routes.ts',
  'src/lib/routes/index.ts',
];

for (const path of required) {
  assert.ok(
    admin(path).trim(),
    `Admin file must exist and be non-empty: ${path}`
  );
}

const layout = admin('src/app/layout.tsx');
const page = admin('src/app/page.tsx');

const forbidden =
  /\b(?:fetch|localApiRequest)\s*\(|API_BASE_URL|Authorization|accessToken|refreshToken|document\s*\.\s*cookie|localStorage|sessionStorage|@\/lib\/api/;
for (const [name, source] of [
  ['layout', layout],
  ['page', page],
]) {
  assert.doesNotMatch(
    source,
    /['"]use client['"]/,
    `${name} must remain a Server Component`
  );

  assert.doesNotMatch(
    source,
    forbidden,
    `${name} must not contain network/auth logic`
  );
}

//===================================================================

assert.match(layout, /export const metadata\s*:\s*Metadata/);

assert.match(
  layout,
  /robots\s*:\s*\{\s*index\s*:\s*false\s*,\s*follow\s*:\s*false/
);

for (const file of ['tokens', 'reset', 'base', 'utilities']) {
  assert.ok(layout.includes(`import '@e-pharmacy/ui/styles/${file}.css'`));
}

assert.match(layout, /import ['"]\.\/styles\.css['"]/);

assert.match(
  layout,
  /import\s*\{\s*AdminProviders\s*\}\s*from ['"]@\/providers['"]/
);

assert.match(layout, /<AdminProviders>\{children\}<\/AdminProviders>/);
assert.doesNotMatch(layout, /ToastProvider|AuthProvider/);

assert.match(
  page,
  /import\s*\{\s*redirect\s*\}\s*from ['"]next\/navigation['"]/
);

assert.match(page, /redirect\(ADMIN_ROUTES\.DASHBOARD\)/);
assert.doesNotMatch(page, /return\s*\(?\s*</);
assert.match(admin('src/lib/routes/admin-routes.ts'), /ROOT:\s*['"]\/['"]/);

assert.match(
  admin('src/lib/routes/admin-routes.ts'),
  /DASHBOARD:\s*['"]\/admin\/dashboard['"]/
);

assert.match(
  admin('src/lib/routes/index.ts'),
  /export\s*\{\s*ADMIN_ROUTES\s*\}/
);

assert.match(admin('src/app/robots.ts'), /userAgent:\s*['"]\*['"]/);
assert.match(admin('src/app/robots.ts'), /disallow:\s*['"]\/['"]/);

assert.ok(
  !existsSync(new URL('apps/admin/src/app/sitemap.ts', root)),
  'Admin must not publish a sitemap'
);

assert.doesNotMatch(
  admin('.env.example'),
  /NEXT_PUBLIC_(?:API|BACKEND)(?:_BASE)?_URL/
);

//===================================================================

const pkg = JSON.parse(admin('package.json'));

assert.equal(pkg.name, '@e-pharmacy/admin');
assert.equal(pkg.private, true);
assert.match(pkg.scripts.dev, /run-with-bff-secret\.mjs next dev --port 3001$/);
assert.equal(pkg.scripts.start, 'next start --port 3001');

for (const name of ['build', 'lint', 'type-check', 'test', 'test:react']) {
  assert.ok(pkg.scripts[name], `Missing admin script: ${name}`);
}

const config = JSON.parse(admin('tsconfig.json')).compilerOptions;

assert.equal(config.strict, true);
assert.equal(config.noEmit, true);
assert.equal(config.moduleResolution, 'bundler');
assert.equal(config.jsx, 'react-jsx');
assert.deepEqual(config.paths['@/*'], ['./src/*']);
assert.ok(config.plugins.some((plugin) => plugin.name === 'next'));
assert.match(read('pnpm-lock.yaml'), /^  apps\/admin:\s*$/m);

const scripts = JSON.parse(read('package.json')).scripts;
const deploy = scripts['check:before-deploy'].split(/\s*&&\s*/);

for (const name of ['admin-app-shell', 'admin-providers']) {
  const command = `pnpm check:${name}`;

  assert.equal(
    deploy.filter((step) => step === command).length,
    1,
    `${command} must run once as a separate command`
  );

  assert.ok(
    deploy.indexOf(command) < deploy.indexOf('pnpm lint'),
    `${command} must run before workspace checks`
  );
}

assert.ok(
  !deploy.includes('pnpm check:admin'),
  'Do not duplicate admin build/lint in deploy checks'
);

assert.ok(
  scripts['test:react']
    .split(/\s*&&\s*/)
    .includes('pnpm --filter @e-pharmacy/admin test:react')
);

//===================================================================

console.log('Admin app shell check passed.');
