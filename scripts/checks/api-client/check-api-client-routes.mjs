import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const repositoryRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

//===================================================================

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (['node_modules', 'dist', '.next', '.turbo'].includes(entry.name)) {
      continue;
    }

    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath)));
    } else if (/\.ts$/.test(entry.name)) {
      files.push(absolutePath);
    }
  }

  return files;
}

//===================================================================

function normalizeLocalRoute(route) {
  return route
    .replace(/^\/api/, '')
    .replace(/\$\{[^}]+\}/g, '[]')
    .replace(/\[[^\]]+\]/g, '[]')
    .replace(/\s+/g, '');
}

//===================================================================

function withoutComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
}

//===================================================================

function collectLocalRouteShapes(source) {
  const values = [];
  const code = withoutComments(source);
  const patterns = [
    /'(\/api\/[^'\n]+)'/g,
    /"(\/api\/[^"\n]+)"/g,
    /`(\/api\/[^`]+)`/g,
  ];

  for (const pattern of patterns) {
    for (const match of code.matchAll(pattern)) {
      values.push(normalizeLocalRoute(match[1]));
    }
  }

  return [...new Set(values)];
}

//===================================================================

function collectSharedAuthRoutes(source) {
  const code = withoutComments(source);
  const routes = new Map();

  for (const match of code.matchAll(/(\w+):\s*'(\/api\/[^'\n]+)'/g)) {
    routes.set(match[1], normalizeLocalRoute(match[2]));
  }

  for (const match of code.matchAll(
    /(\w+):\s*\([^)]*\)\s*=>\s*`(\/api\/[^`]+)`/g
  )) {
    routes.set(match[1], normalizeLocalRoute(match[2]));
  }

  return routes;
}

//===================================================================

function collectAppSharedAuthShapes(source, sharedAuthRoutes) {
  if (/auth:\s*localAuthApiRoutes\b/.test(source)) {
    return [...sharedAuthRoutes.values()];
  }

  const routeNames = [...source.matchAll(/localAuthApiRoutes\.(\w+)/g)].map(
    (match) => match[1]
  );

  return routeNames.map((name) => {
    const route = sharedAuthRoutes.get(name);
    assert.ok(
      route,
      `Unknown shared auth route referenced by application: ${name}`
    );
    return route;
  });
}

//===================================================================

const routeCheck = spawnSync(
  process.execPath,
  [
    path.join(
      repositoryRoot,
      'scripts/checks/routes/check-next-api-routes.mjs'
    ),
  ],
  { cwd: repositoryRoot, stdio: 'inherit' }
);

assert.equal(
  routeCheck.status,
  0,
  'Existing Next route parity check must pass.'
);

const browserApiDirectories = [
  path.join(repositoryRoot, 'apps/client/src/lib/api/browser'),
  path.join(repositoryRoot, 'apps/pharmacy/src/lib/api/browser'),
];

const literalLocalCalls = [];
const composedLocalCalls = [];

for (const directory of browserApiDirectories) {
  for (const file of await collectFiles(directory)) {
    const source = await readFile(file, 'utf8');

    if (/localApiRequest(?:<[^>]+>)?\s*\(\s*['"`]\/api\//s.test(source)) {
      literalLocalCalls.push(path.relative(repositoryRoot, file));
    }

    if (
      /\$\{[^}]*ROUTES[^}]*\}\s*\//.test(source) ||
      /ROUTES[^;\n]*\+\s*['"`]\//.test(source)
    ) {
      composedLocalCalls.push(path.relative(repositoryRoot, file));
    }
  }
}

assert.deepEqual(
  literalLocalCalls,
  [],
  `Browser API calls must use app-local route builders:\n${literalLocalCalls.join('\n')}`
);

assert.deepEqual(
  composedLocalCalls,
  [],
  `Browser API calls must not append hidden route suffixes:\n${composedLocalCalls.join('\n')}`
);

//===================================================================

const routeContracts = JSON.parse(
  await readFile(
    path.join(
      repositoryRoot,
      'scripts/checks/routes/next-api-route-contracts.json'
    ),
    'utf8'
  )
);

const contractsByApp = new Map();
for (const contract of routeContracts) {
  const appRoutes = contractsByApp.get(contract.app) ?? new Set();
  appRoutes.add(normalizeLocalRoute(`/api${contract.route}`));
  contractsByApp.set(contract.app, appRoutes);
}

const routeSources = {
  client: await readFile(
    path.join(
      repositoryRoot,
      'apps/client/src/lib/api/routes/client-api-routes.ts'
    ),
    'utf8'
  ),
  pharmacy: await readFile(
    path.join(
      repositoryRoot,
      'apps/pharmacy/src/lib/api/routes/pharmacy-api-routes.ts'
    ),
    'utf8'
  ),
};

const sharedAuthSource = await readFile(
  path.join(
    repositoryRoot,
    'packages/next-api/src/contracts/auth-api-routes.ts'
  ),
  'utf8'
);

const sharedAuthRoutes = collectSharedAuthRoutes(sharedAuthSource);
const missingBffContracts = [];

for (const [app, source] of Object.entries(routeSources)) {
  const appContractRoutes = contractsByApp.get(app) ?? new Set();
  const routeShapes = [
    ...collectLocalRouteShapes(source),
    ...collectAppSharedAuthShapes(source, sharedAuthRoutes),
  ];

  for (const routeShape of routeShapes) {
    if (!appContractRoutes.has(routeShape)) {
      missingBffContracts.push(`${app}: ${routeShape}`);
    }
  }
}

assert.deepEqual(
  missingBffContracts,
  [],
  `Frontend route builders must map to real BFF contracts:\n${missingBffContracts.join('\n')}`
);

//===================================================================

const routeHandlerFiles = [
  ...(await collectFiles(path.join(repositoryRoot, 'apps/client/src/app/api'))),
  ...(await collectFiles(
    path.join(repositoryRoot, 'apps/pharmacy/src/app/api')
  )),
];

const literalBackendPaths = [];

for (const file of routeHandlerFiles) {
  const source = await readFile(file, 'utf8');
  if (/backendPath:\s*['"`]\//.test(source)) {
    literalBackendPaths.push(path.relative(repositoryRoot, file));
  }
}

assert.deepEqual(
  literalBackendPaths,
  [],
  `BFF handlers must use canonical backend route builders:\n${literalBackendPaths.join('\n')}`
);

const apiClientContracts = await readFile(
  path.join(repositoryRoot, 'packages/api-client/src/contracts/index.ts'),
  'utf8'
);
assert.doesNotMatch(apiClientContracts, /localAuthApiRoutes|local-api-routes/);

const nextContracts = await readFile(
  path.join(
    repositoryRoot,
    'packages/next-api/src/contracts/auth-api-routes.ts'
  ),
  'utf8'
);

assert.match(nextContracts, /localAuthApiRoutes/);

const backendRoutes = await readFile(
  path.join(
    repositoryRoot,
    'packages/api-client/src/contracts/backend-resource-routes.ts'
  ),
  'utf8'
);

assert.match(
  backendRoutes,
  /articleAvailability:\s*'\/product-requests\/article-availability'/
);

assert.doesNotMatch(
  backendRoutes,
  /addToMyPharmacy|removeFromMyPharmacy|updateItem|removeItem/
);

await access(
  path.join(
    repositoryRoot,
    'apps/pharmacy/src/app/api/product-requests/article-availability/route.ts'
  )
);

console.log(
  `API-client route check passed (${routeHandlerFiles.length} BFF handler files, ${sharedAuthRoutes.size} shared auth contracts and 0 hidden browser routes).`
);
