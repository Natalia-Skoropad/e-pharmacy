import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

//===================================================================

const read = (path) =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

//===================================================================

const routes = read('apps/api/src/routes/pharmacies/pharmacy.routes.ts');

const controller = read(
  'apps/api/src/controllers/pharmacies/pharmacy-public.controller.ts'
);

//===================================================================

test('public photo-source route registers a defined, explicitly imported controller', () => {
  const publicControllerImports = [
    ...routes.matchAll(
      /import\s*\{([^}]*)\}\s*from\s*['"]\.\.\/\.\.\/controllers\/pharmacies\/pharmacy-public\.controller['"];?/g
    ),
  ];

  assert.equal(
    publicControllerImports.length,
    1,
    'Public pharmacy handlers should share one named import'
  );

  const importedNames = publicControllerImports[0][1]
    .split(',')
    .map((name) =>
      name
        .trim()
        .split(/\s+as\s+/)
        .at(-1)
    )
    .filter(Boolean);

  assert.ok(
    importedNames.includes('getPharmacyPhotoSource'),
    'photo-source route handler must be imported before Express evaluates the route'
  );

  assert.match(
    controller,
    /export\s+async\s+function\s+getPharmacyPhotoSource\s*\(/
  );

  assert.match(
    routes,
    /pharmacyRoutes\.get\(\s*'\/:pharmacyId\/photo-source',\s*validate\(\{\s*params: pharmacyIdParamsSchema\s*\}\),\s*ctrlWrapper\(getPharmacyPhotoSource\)/
  );
});

//===================================================================

test('every ctrlWrapper route handler is present in the route module imports', () => {
  const importedNames = new Set(
    [
      ...routes.matchAll(
        /import\s+(?:type\s+)?\{([^}]*)\}\s*from\s*['"][^'"]+['"];?/g
      ),
    ]
      .flatMap(([, names]) => names.split(','))
      .map((name) =>
        name
          .trim()
          .split(/\s+as\s+/)
          .at(-1)
      )
      .filter(Boolean)
  );

  const handlers = [
    ...routes.matchAll(/ctrlWrapper\(\s*([A-Za-z_$][\w$]*)\s*\)/g),
  ].map(([, name]) => name);

  assert.ok(handlers.length > 0, 'Expected pharmacy route handlers');

  assert.deepEqual(
    [...new Set(handlers.filter((name) => !importedNames.has(name)))],
    [],
    'Every ctrlWrapper handler must be in scope when Express builds the router'
  );
});
