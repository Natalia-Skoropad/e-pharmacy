import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const clientRoot = path.join(root, 'apps/client/src');
const ignored = new Set([
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);

//===================================================================

async function listSourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await listSourceFiles(target)));
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) files.push(target);
  }
  return files;
}

//===================================================================

async function exists(relativePath) {
  try {
    await access(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

//===================================================================

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

//===================================================================

for (const removedPath of [
  'apps/client/src/hooks/useFavoriteRefresh.ts',
  'apps/client/src/hooks/useFavoriteStatusRefresh.ts',
  'apps/client/src/hooks/hooks-lifecycle-contracts.test.ts',
]) {
  assert.equal(
    await exists(removedPath),
    false,
    `${removedPath} must be deleted.`
  );
}

const sources = await Promise.all(
  (await listSourceFiles(clientRoot)).map(async (file) => ({
    relative: path.relative(root, file).replaceAll('\\', '/'),
    source: await readFile(file, 'utf8'),
  }))
);

const favoriteIdConsumers = sources.filter(
  ({ relative, source }) =>
    !relative.includes('/lib/api/browser/') &&
    /\bgetFavorite(?:Product|Pharmacy)Ids\b/.test(source)
);
assert.deepEqual(
  favoriteIdConsumers.map(({ relative }) => relative),
  ['apps/client/src/providers/FavoritesProvider/FavoritesProvider.tsx']
);

const favoritesProvider = await read(
  'apps/client/src/providers/FavoritesProvider/FavoritesProvider.tsx'
);

for (const contract of [
  'useClientSessionScope',
  'activeCollectionRef',
  'activeMutationsRef',
  'loadCollection',
  'toggleFavorite',
  'AbortController',
]) {
  assert.match(favoritesProvider, new RegExp(contract));
}

const favoriteActions = await read(
  'apps/client/src/hooks/useFavoriteActions.ts'
);

assert.doesNotMatch(favoriteActions, /setIsFavorite|canUseFavorites/);
assert.match(favoriteActions, /unavailableMessage/);
assert.match(favoriteActions, /clientAccountRequiredMessage/);

const reviewForm = await read('apps/client/src/hooks/useReviewForm.ts');
for (const contract of [
  'scopeKey: string',
  'useClientSessionScope',
  'activeControllerRef',
  'AbortController',
  'isUnavailable',
]) {
  assert.match(reviewForm, new RegExp(contract));
}

assert.doesNotMatch(reviewForm, /reviewValues:\s/);
assert.doesNotMatch(reviewForm, /canSubmitReview/);

const cartProvider = await read(
  'apps/client/src/providers/CartProvider/CartProvider.tsx'
);

assert.match(cartProvider, /useClientSessionScope/);
assert.match(cartProvider, /ownerKeyRef\.current !== ownerKey/);

const sessionScope = await read(
  'apps/client/src/providers/AuthProvider/ClientSessionScope.tsx'
);

assert.match(sessionScope, /ClientSessionScopeBoundary/);
assert.match(sessionScope, /key=\{authIdentity\}/);

const authProvider = await read(
  'apps/client/src/providers/AuthProvider/AuthProvider.tsx'
);

assert.match(authProvider, /ClientSessionScopeProvider/);

console.log(
  'Client user-state check passed (keyed session boundary, one favorite collection owner, scoped reviews, cart remount on session change).'
);
