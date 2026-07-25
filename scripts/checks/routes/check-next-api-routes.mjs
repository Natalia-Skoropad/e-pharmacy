import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();

const routeRoots = {
  client: path.join(root, 'apps/client/src/app/api'),
  pharmacy: path.join(root, 'apps/pharmacy/src/app/api'),
};

const backendRouteFiles = {
  '/admin': 'apps/api/src/routes/admin.routes.ts',
  '/auth': 'apps/api/src/routes/auth.routes.ts',
  '/cart': 'apps/api/src/routes/cart.routes.ts',
  '/clients': 'apps/api/src/routes/client.routes.ts',
  '/health': 'apps/api/src/routes/health.routes.ts',
  '/orders': 'apps/api/src/routes/order.routes.ts',
  '/pharmacies': 'apps/api/src/routes/pharmacy.routes.ts',
  '/pharmacy-notes': 'apps/api/src/routes/pharmacy-note.routes.ts',
  '/product-requests': 'apps/api/src/routes/product-request.routes.ts',
  '/products': 'apps/api/src/routes/product.routes.ts',
};

//===================================================================

async function collectRouteFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectRouteFiles(absolute)));
    else if (entry.name === 'route.ts') files.push(absolute);
  }

  return files;
}

//===================================================================

function routePathFromFile(file, routeRoot) {
  const relativeDirectory = path
    .relative(routeRoot, path.dirname(file))
    .replaceAll('\\', '/');

  return relativeDirectory ? `/${relativeDirectory}` : '/';
}

//===================================================================

function normalizeBackendPath(prefix, localPath) {
  if (localPath === '/') return prefix;
  return `${prefix}${localPath.startsWith('/') ? localPath : `/${localPath}`}`;
}

//===================================================================

function inferAccessModes(source, methods) {
  if (source.includes('createPublicGetPrivatePostProxyRoute')) {
    return Object.fromEntries(
      methods.map((method) => [method, method === 'GET' ? 'public' : 'private'])
    );
  }

  const access = source.includes('createAuthProxyRoute')
    ? 'auth'
    : source.includes('createPrivateProxyRoute')
      ? 'private'
      : source.includes('createOptionalAuthGetProxyRoute')
        ? 'optional'
        : source.includes('createPublicGetProxyRoute')
          ? 'public'
          : undefined;

  return Object.fromEntries(methods.map((method) => [method, access]));
}

//===================================================================

const contracts = JSON.parse(
  await readFile(
    path.join(root, 'scripts/checks/routes/next-api-route-contracts.json'),
    'utf8'
  )
);

const contractByKey = new Map(
  contracts.map((contract) => [`${contract.app}:${contract.route}`, contract])
);

const backendHandlers = new Set();

for (const [prefix, relativeFile] of Object.entries(backendRouteFiles)) {
  const source = await readFile(path.join(root, relativeFile), 'utf8');
  const matches = source.matchAll(
    /\b\w+Routes\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g
  );

  for (const match of matches) {
    const method = match[1].toUpperCase();
    const backendPath = normalizeBackendPath(prefix, match[2]);
    backendHandlers.add(`${method} ${backendPath}`);
  }
}

const violations = [];
const discoveredKeys = new Set();
let handlerCount = 0;

//===================================================================

for (const [app, routeRoot] of Object.entries(routeRoots)) {
  const routeFiles = await collectRouteFiles(routeRoot);

  for (const file of routeFiles) {
    const rel = path.relative(root, file).replaceAll('\\', '/');
    const route = routePathFromFile(file, routeRoot);
    const key = `${app}:${route}`;
    const source = await readFile(file, 'utf8');
    const methods = [
      ...source.matchAll(/export const (GET|POST|PUT|PATCH|DELETE)\s*=/g),
    ].map((match) => match[1]);

    handlerCount += methods.length;
    discoveredKeys.add(key);

    const contract = contractByKey.get(key);

    if (!contract) {
      violations.push(`${rel}: route is missing from the BFF route contract`);
      continue;
    }

    const expectedMethods = Object.keys(contract.methods).sort();
    const actualMethods = [...methods].sort();

    if (JSON.stringify(actualMethods) !== JSON.stringify(expectedMethods)) {
      violations.push(
        `${rel}: expected methods ${expectedMethods.join(', ')}, found ${actualMethods.join(', ')}`
      );
    }

    const actualAccess = inferAccessModes(source, methods);

    for (const method of expectedMethods) {
      if (actualAccess[method] !== contract.methods[method]) {
        violations.push(
          `${rel}: ${method} must use ${contract.methods[method]} access, found ${String(actualAccess[method])}`
        );
      }

      if (!backendHandlers.has(`${method} ${contract.backend}`)) {
        violations.push(
          `${rel}: backend does not expose ${method} ${contract.backend}`
        );
      }
    }

    if (
      contract.optionalPolicy &&
      !source.includes(`policy: '${contract.optionalPolicy}'`)
    ) {
      violations.push(
        `${rel}: optional route must use policy ${contract.optionalPolicy}`
      );
    }

    if (!methods.length) violations.push(`${rel}: no HTTP handler export found`);
    if (/AUTH_PROXY_ROUTES/.test(source))
      violations.push(`${rel}: AUTH_PROXY_ROUTES alias is forbidden`);
    if (/`\/pharmacy-notes\//.test(source))
      violations.push(`${rel}: literal pharmacy-notes backend path is forbidden`);
    if (/orders\.details\([^)]*\)\}\/status/.test(source))
      violations.push(`${rel}: order status must use canonical route builder`);

    if (/backendPath\s*:/.test(source)) {
      const hasCanonicalRoute = /API_ROUTES\.|authRoutes\.|apiRoutes\./.test(
        source
      );
      const usesSharedVariable =
        /backendPath\s*,/.test(source) && hasCanonicalRoute;

      if (!hasCanonicalRoute && !usesSharedVariable) {
        violations.push(
          `${rel}: backendPath does not use a canonical API contract`
        );
      }
    }

    if (
      /export const (POST|PUT|PATCH|DELETE)[\s\S]*createPublicGetProxyRoute/.test(
        source
      )
    ) {
      violations.push(`${rel}: mutating handler cannot use a public GET proxy`);
    }

    if (rel.includes('[') && !/@e-pharmacy\/next-api\/proxy/.test(source)) {
      violations.push(
        `${rel}: dynamic BFF route does not use validated route factories`
      );
    }

    if (
      rel.endsWith('/health/route.ts') &&
      !/revalidate:\s*false/.test(source)
    ) {
      violations.push(`${rel}: health route must use no-store`);
    }

    if (
      rel.endsWith('/reviews/route.ts') &&
      /createPublicGetPrivatePostProxyRoute/.test(source) &&
      !/revalidate:\s*false/.test(source)
    ) {
      violations.push(`${rel}: public reviews must use a fresh no-store policy`);
    }

    if (
      /(?:filters|options)\/route\.ts$/.test(rel) &&
      /createPublicGetProxyRoute/.test(source)
    ) {
      if (
        !/revalidate:\s*600/.test(source) ||
        !/staleWhileRevalidate:\s*600/.test(source)
      ) {
        violations.push(
          `${rel}: filters/options must use the explicit 600-second cache policy`
        );
      }
    }
  }
}

//===================================================================

for (const [key, contract] of contractByKey) {
  if (!discoveredKeys.has(key)) {
    violations.push(
      `${contract.app}:${contract.route}: contracted BFF route file is missing`
    );
  }
}

const expectedHandlerCount = contracts.reduce(
  (total, contract) => total + Object.keys(contract.methods).length,
  0
);

if (discoveredKeys.size !== contracts.length) {
  violations.push(
    `Expected ${contracts.length} route files, found ${discoveredKeys.size}`
  );
}

if (handlerCount !== expectedHandlerCount) {
  violations.push(
    `Expected ${expectedHandlerCount} HTTP handlers, found ${handlerCount}`
  );
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

//===================================================================

console.log(
  `Next API route check passed (${contracts.length} routes, ${handlerCount} handlers, backend method/path parity verified).`
);
