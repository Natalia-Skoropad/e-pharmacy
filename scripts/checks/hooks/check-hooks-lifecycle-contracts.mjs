import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const repositoryRoot = process.cwd();

const ignoredDirectories = new Set([
  '.git',
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);

const sourceRoots = {
  client: path.join(repositoryRoot, 'apps/client/src'),
  pharmacy: path.join(repositoryRoot, 'apps/pharmacy/src'),
  ui: path.join(repositoryRoot, 'packages/ui/src'),
  auth: path.join(repositoryRoot, 'packages/auth/src'),
  hooks: path.join(repositoryRoot, 'packages/hooks/src'),
};

const debounceConsumers = [
  'apps/client/src/components/product-catalog/ProductCatalogFiltersForm/ProductCatalogFiltersForm.tsx',
  'apps/client/src/components/pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm.tsx',
  'apps/pharmacy/src/components/orders/OrdersPageContent/OrdersPageContent.tsx',
  'apps/pharmacy/src/components/clients/ClientsPageContent/ClientsPageContent.tsx',
  'apps/pharmacy/src/components/product-requests/ProductRequestsPageContent/ProductRequestsPageContent.tsx',
  'apps/pharmacy/src/components/products/OwnProductsPageContent/OwnProductsPageContent.tsx',
  'apps/pharmacy/src/components/all-products/AllProductsPageContent/AllProductsPageContent.tsx',
];

const mutationContracts = [
  [
    'apps/client/src/hooks/useFavoriteActions.ts',
    ['activeControllerRef', 'toggleFavoriteInStore'],
  ],
  [
    'apps/client/src/hooks/useReviewForm.ts',
    ['submitLockRef', 'activeControllerRef', 'useClientSessionScope'],
  ],
  [
    'apps/client/src/components/checkout/hooks/useCheckoutSubmit.ts',
    ['submitLockRef'],
  ],
  [
    'apps/client/src/providers/CartProvider/CartProvider.tsx',
    ['createCartMutationQueue', 'pendingItemIdsRef', 'clearingRef'],
  ],
];

//===================================================================

async function listSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (ignoredDirectories.has(entry.name)) continue;

    const absolutePath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(absolutePath)));
      continue;
    }

    if (
      entry.isFile() &&
      /\.[cm]?[jt]sx?$/.test(entry.name) &&
      !/\.test\.[cm]?[jt]sx?$/.test(entry.name)
    ) {
      files.push(absolutePath);
    }
  }

  return files;
}

//===================================================================

async function readRepositoryFile(relativePath) {
  return readFile(path.join(repositoryRoot, relativePath), 'utf8');
}

//===================================================================

function countMatches(source, pattern) {
  return [...source.matchAll(pattern)].length;
}

//===================================================================

const failures = [];
const sourcesByArea = new Map();
const allSourceFiles = [];

//===================================================================

for (const [area, root] of Object.entries(sourceRoots)) {
  const files = await listSourceFiles(root);
  const entries = [];

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    entries.push({ file, source });
    allSourceFiles.push({ area, file, source });
  }

  sourcesByArea.set(area, entries);
}

//===================================================================
// Overlay ownership and behavior tests.

const overlayManager = await readRepositoryFile(
  'packages/ui/src/internal/overlay/overlay-manager.ts'
);

const overlayTest = await readRepositoryFile(
  'packages/ui/src/internal/overlay/__tests__/overlay-manager.test.ts'
);

if (!overlayManager.includes('event.defaultPrevented')) {
  failures.push('Overlay manager must respect event.defaultPrevented.');
}

if (
  /addEventListener\(\s*['"]keydown['"]\s*,\s*handleDocumentKeyDown\s*,\s*true\s*\)/.test(
    overlayManager
  )
) {
  failures.push('Overlay Escape listener must not run in capture phase.');
}

const keydownHandlerStart = overlayManager.indexOf(
  'function handleDocumentKeyDown'
);

const keydownHandlerEnd = overlayManager.indexOf(
  '//===================================================================',
  keydownHandlerStart
);

const keydownHandler = overlayManager.slice(
  keydownHandlerStart,
  keydownHandlerEnd
);

const closeDisabledIndex = keydownHandler.indexOf(
  'if (!topOverlay.closeOnEscapeRef.current) return;'
);

const preventDefaultIndex = keydownHandler.indexOf('event.preventDefault();');

if (
  keydownHandlerStart === -1 ||
  closeDisabledIndex === -1 ||
  preventDefaultIndex === -1 ||
  closeDisabledIndex > preventDefaultIndex
) {
  failures.push(
    'closeOnEscape=false must return before preventing or stopping Escape.'
  );
}

for (const requiredBehavior of [
  'dispatchBubblingKeyboardEvent',
  'inner widgets own Escape',
  'nested overlays close only the top layer',
  'scroll locking and background inertness remain stack-safe',
  'unmount cancels queued initial focus work',
]) {
  if (!overlayTest.includes(requiredBehavior)) {
    failures.push(`Overlay behavior test is missing: ${requiredBehavior}.`);
  }
}

//===================================================================
// User/session scoped async state.

const favoriteSources = sourcesByArea
  .get('client')
  .filter(({ file }) => file.includes(`${path.sep}hooks${path.sep}`))
  .map(({ source }) => source)
  .join('\n');

if (
  /favorite(?:Product|Pharmacy)?IdsPromise|favorite\w*Promise\s*=/.test(
    favoriteSources
  )
) {
  failures.push('Favorite ID promises must not be cached globally.');
}

const favoritesProvider = await readRepositoryFile(
  'apps/client/src/providers/FavoritesProvider/FavoritesProvider.tsx'
);

for (const contract of [
  'useClientSessionScope',
  'createFavoriteCollectionRequestRegistry',
  'activeMutationsRef',
  'AbortController',
]) {
  if (!favoritesProvider.includes(contract)) {
    failures.push(
      `FavoritesProvider is missing session-scoped async protection: ${contract}.`
    );
  }
}

const cartProvider = await readRepositoryFile(
  'apps/client/src/providers/CartProvider/CartProvider.tsx'
);

const clientSessionScope = await readRepositoryFile(
  'apps/client/src/providers/AuthProvider/ClientSessionScope.tsx'
);

for (const contract of ['ClientSessionScopeBoundary', 'key={authIdentity}']) {
  if (!clientSessionScope.includes(contract)) {
    failures.push(
      `ClientSessionScope is missing keyed lifecycle reset: ${contract}.`
    );
  }
}

for (const contract of [
  'clientOwnerKey',
  'useClientSessionScope',
  'activeLoadRef',
  'createCartMutationQueue',
  'lifecycleActiveRef',
]) {
  if (!cartProvider.includes(contract)) {
    failures.push(
      `CartProvider is missing stale-session protection: ${contract}.`
    );
  }
}

//===================================================================
// Mutation locks.

for (const [relativePath, contracts] of mutationContracts) {
  const source = await readRepositoryFile(relativePath);

  for (const contract of contracts) {
    if (!source.includes(contract)) {
      failures.push(`${relativePath} is missing mutation guard ${contract}.`);
    }
  }
}

//===================================================================
// Abortable network effects and shared debounce.

for (const { file, source } of allSourceFiles) {
  if (/\blet\s+(?:isMounted|isCancelled)\s*=\s*(?:true|false)/.test(source)) {
    failures.push(
      `${path.relative(repositoryRoot, file).replaceAll('\\', '/')}: mounted/cancelled flag must be replaced by cancellation or a version guard.`
    );
  }
}

for (const relativePath of debounceConsumers) {
  const source = await readRepositoryFile(relativePath);

  if (
    !source.includes("from '@e-pharmacy/hooks/timing'") ||
    !source.includes('useDebouncedValue(')
  ) {
    failures.push(
      `${relativePath} must use the shared useDebouncedValue hook.`
    );
  }
}

//===================================================================
// One pharmacy-profile request owner.

const pharmacySources = sourcesByArea.get('pharmacy');
const directProfileConsumers = pharmacySources
  .filter(({ source }) => /\bgetMyPharmacyProfile\s*\(/.test(source))
  .map(({ file }) => path.relative(repositoryRoot, file).replaceAll('\\', '/'));

const allowedProfileConsumers = new Set([
  'apps/pharmacy/src/lib/api/browser/pharmacy.api.ts',
  'apps/pharmacy/src/providers/PharmacyProfileProvider/PharmacyProfileProvider.tsx',
]);

for (const consumer of directProfileConsumers) {
  if (!allowedProfileConsumers.has(consumer)) {
    failures.push(
      `${consumer}: pharmacy profile must be loaded through PharmacyProfileProvider.`
    );
  }
}

if (
  !directProfileConsumers.includes(
    'apps/pharmacy/src/providers/PharmacyProfileProvider/PharmacyProfileProvider.tsx'
  )
) {
  failures.push(
    'PharmacyProfileProvider must own the pharmacy profile request.'
  );
}

//===================================================================
// Honest package tooling and repository checks.

const hooksPackage = JSON.parse(
  await readRepositoryFile('packages/hooks/package.json')
);

for (const scriptName of ['lint', 'type-check', 'test', 'test:dom', 'build']) {
  if (!hooksPackage.scripts?.[scriptName]) {
    failures.push(`packages/hooks is missing the ${scriptName} script.`);
  }
}

if (hooksPackage.scripts?.build !== 'tsc -p tsconfig.build.json') {
  failures.push(
    'packages/hooks build must emit declarations through tsconfig.build.json.'
  );
}

const rootPackage = JSON.parse(await readRepositoryFile('package.json'));
const beforeDeploy = rootPackage.scripts?.['check:before-deploy'] ?? '';

for (const checkName of [
  'check:hooks-boundaries',
  'check:hooks-public-api',
  'check:hooks-lifecycle',
]) {
  if (!beforeDeploy.includes(checkName)) {
    failures.push(`check:before-deploy must include ${checkName}.`);
  }
}

//===================================================================
// Current metrics are informational and make lifecycle drift visible in CI.

const metrics = {};

for (const [area, entries] of sourcesByArea) {
  const combined = entries.map(({ source }) => source).join('\n');
  metrics[area] = {
    useEffect: countMatches(combined, /\buseEffect\s*\(/g),
    setTimeout: countMatches(combined, /\bsetTimeout\s*\(/g),
    clearTimeout: countMatches(combined, /\bclearTimeout\s*\(/g),
    requestAnimationFrame: countMatches(
      combined,
      /\brequestAnimationFrame\s*\(/g
    ),
    cancelAnimationFrame: countMatches(
      combined,
      /\bcancelAnimationFrame\s*\(/g
    ),
    addEventListener: countMatches(combined, /\.addEventListener\s*\(/g),
    removeEventListener: countMatches(combined, /\.removeEventListener\s*\(/g),
  };
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('Hooks lifecycle contract check passed.');
console.log(JSON.stringify(metrics, null, 2));
