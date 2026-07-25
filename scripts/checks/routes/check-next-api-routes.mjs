import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

//===================================================================

const root = process.cwd();

const routeRoots = [
  path.join(root, 'apps/client/src/app/api'),
  path.join(root, 'apps/pharmacy/src/app/api'),
];

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

const routeFiles = (
  await Promise.all(routeRoots.map(collectRouteFiles))
).flat();
const violations = [];
let handlerCount = 0;

//===================================================================

for (const file of routeFiles) {
  const rel = path.relative(root, file).replaceAll('\\', '/');
  const source = await readFile(file, 'utf8');
  const handlers = [
    ...source.matchAll(/export const (GET|POST|PUT|PATCH|DELETE)\s*=/g),
  ];
  handlerCount += handlers.length;

  if (!handlers.length) violations.push(`${rel}: no HTTP handler export found`);
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


  if (rel.endsWith('/health/route.ts') && !/revalidate:\s*false/.test(source)) {
    violations.push(`${rel}: health route must use no-store`);
  }

  if (rel.endsWith('/reviews/route.ts') && /createPublicGetPrivatePostProxyRoute/.test(source) && !/revalidate:\s*false/.test(source)) {
    violations.push(`${rel}: public reviews must use a fresh no-store policy`);
  }

  if (/(?:filters|options)\/route\.ts$/.test(rel) && /createPublicGetProxyRoute/.test(source)) {
    if (!/revalidate:\s*600/.test(source) || !/staleWhileRevalidate:\s*600/.test(source)) {
      violations.push(`${rel}: filters/options must use the explicit 600-second cache policy`);
    }
  }
}

//===================================================================

if (routeFiles.length !== 62) {
  violations.push(`Expected 62 route files, found ${routeFiles.length}`);
}

if (handlerCount !== 78) {
  violations.push(`Expected 78 HTTP handlers, found ${handlerCount}`);
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

//===================================================================

console.log(
  `Next API route check passed (${routeFiles.length} routes, ${handlerCount} handlers).`
);
