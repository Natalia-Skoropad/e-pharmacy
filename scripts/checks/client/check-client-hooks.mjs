import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();
const clientSourceRoot = path.join(root, 'apps/client/src');
const hooksRoot = path.join(clientSourceRoot, 'hooks');

const ignoredDirectories = new Set([
  '.next',
  '.turbo',
  'coverage',
  'dist',
  'node_modules',
]);

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

async function collectSourceFiles(directory) {
  const files = [];

  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignoredDirectories.has(entry.name)) continue;

    const target = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(target)));
    } else if (/\.[cm]?[jt]sx?$/.test(entry.name)) {
      files.push(target);
    }
  }

  return files;
}

//===================================================================

async function read(relativePath) {
  return readFile(path.join(root, relativePath), 'utf8');
}

//===================================================================

const hookFiles = await collectSourceFiles(hooksRoot);

//===================================================================

for (const file of hookFiles) {
  const relative = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');

  assert.doesNotMatch(
    source,
    /from\s+['"](?:next\/headers|next\/server|server-only|@\/lib\/api\/server)/,
    `${relative} must remain browser/application infrastructure.`
  );

  if (/export function use[A-Z]/.test(source)) {
    assert.match(
      source,
      /export function use[A-Z][A-Za-z0-9]*\([^)]*\)(?::|[\s\S]*?\):)\s*[A-Z][A-Za-z0-9<>|\[\] ]*\s*\{/,
      `${relative} must declare an explicit public return type.`
    );
  }
}

for (const removedPath of [
  'apps/client/src/hooks/useFavoriteRefresh.ts',
  'apps/client/src/hooks/useFavoriteStatusRefresh.ts',
  'apps/client/src/hooks/hooks-lifecycle-contracts.test.ts',
  'apps/client/src/lib/cart/useCartMutations.ts',
]) {
  assert.equal(
    await exists(removedPath),
    false,
    `${removedPath} must stay deleted.`
  );
}

const favoriteActions = await read(
  'apps/client/src/hooks/useFavoriteActions.ts'
);

for (const contract of [
  'useClientSessionScope',
  'AbortController',
  'toggleFavorite',
  'unavailableMessage',
  'clientAccountRequiredMessage',
]) {
  assert.match(favoriteActions, new RegExp(contract));
}

assert.doesNotMatch(
  favoriteActions,
  /setIsFavorite|canUseFavorites|Favorites are available only/
);

const reviewForm = await read('apps/client/src/hooks/useReviewForm.ts');

for (const contract of [
  'scopeKey: string',
  'useClientSessionScope',
  'AbortController',
  'ownerKey',
  'canCreateReview',
  'isAuthUnavailable',
]) {
  assert.match(reviewForm, new RegExp(contract));
}

assert.doesNotMatch(reviewForm, /reviewValues:\s*reviewValues|canSubmitReview/);

const sources = await Promise.all(
  (await collectSourceFiles(clientSourceRoot)).map(async (file) => ({
    relative: path.relative(root, file).replaceAll('\\', '/'),
    source: await readFile(file, 'utf8'),
  }))
);

const favoriteCollectionConsumers = sources.filter(
  ({ relative, source }) =>
    !relative.includes('/lib/api/browser/') &&
    /\bgetFavorite(?:Product|Pharmacy)Ids\b/.test(source)
);

assert.deepEqual(
  favoriteCollectionConsumers.map(({ relative }) => relative),
  ['apps/client/src/providers/FavoritesProvider/FavoritesProvider.tsx'],
  'Favorite collection reads must have one provider owner, never one owner per card.'
);

for (const behavioralTest of [
  'apps/client/src/hooks/client-auth-capabilities.test.ts',
  'apps/client/src/hooks/review-form-store.test.ts',
  'apps/client/src/providers/FavoritesProvider/favorite-collection-request-registry.test.ts',
  'apps/client/src/providers/ClientProviders.react.test.tsx',
]) {
  assert.equal(
    await exists(behavioralTest),
    true,
    `Missing client hook/provider behavioral test: ${behavioralTest}.`
  );
}

const sharedHooksSources = await collectSourceFiles(
  path.join(root, 'packages/hooks/src')
);

for (const file of sharedHooksSources) {
  const source = await readFile(file, 'utf8');
  assert.doesNotMatch(
    source,
    /apps\/client|@\/hooks|useClientAuthCapabilities|useFavoriteActions|useReviewForm/,
    `${path.relative(root, file)} must not absorb client application hooks.`
  );
}

console.log(
  `Client hooks check passed (${hookFiles.length} hook modules, identity-scoped mutations, one favorite collection owner, behavioral companions present).`
);
