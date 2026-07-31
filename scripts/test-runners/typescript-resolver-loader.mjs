import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

//===================================================================

const RELATIVE_SPECIFIER_PATTERN = /^\.{1,2}\//;
const EXPLICIT_EXTENSION_PATTERN = /\.[a-z0-9]+$/i;
const TYPESCRIPT_MODULE_PATTERN = /\.(?:ts|tsx|mts)$/i;
const CSS_MODULE_PATTERN = /\.module\.css$/i;

const APPLICATION_ALIAS_PREFIX = '@/';

//===================================================================

function resolveApplicationAlias(specifier, parentURL) {
  if (!parentURL || !specifier.startsWith(APPLICATION_ALIAS_PREFIX)) {
    return null;
  }

  const parentPath = fileURLToPath(parentURL).replaceAll('\\', '/');
  const applicationMatch = parentPath.match(
    /\/(apps\/(?:client|pharmacy))\/src\//
  );

  if (!applicationMatch) return null;

  const sourceRoot = new URL(
    `../../${applicationMatch[1]}/src/`,
    import.meta.url
  );

  return new URL(specifier.slice(APPLICATION_ALIAS_PREFIX.length), sourceRoot)
    .href;
}

//===================================================================

const TYPESCRIPT_CANDIDATES = [
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '/index.ts',
  '/index.tsx',
  '/index.mts',
  '/index.cts',
];

//===================================================================

async function resolveExistingCandidate(specifier, parentURL) {
  for (const suffix of TYPESCRIPT_CANDIDATES) {
    const candidate = new URL(`${specifier}${suffix}`, parentURL);

    try {
      await access(candidate);
      return candidate.href;
    } catch {
      // Try the next supported TypeScript source candidate.
    }
  }

  return null;
}

//===================================================================

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only' || specifier === 'client-only') {
    return {
      url: `data:text/javascript,export default {};`,
      shortCircuit: true,
    };
  }

  if (/^next\/[a-z0-9-]+$/i.test(specifier)) {
    return nextResolve(`${specifier}.js`, context);
  }

  const applicationAlias = resolveApplicationAlias(
    specifier,
    context.parentURL
  );

  if (applicationAlias) {
    const resolvedURL = await resolveExistingCandidate(
      applicationAlias,
      import.meta.url
    );

    if (resolvedURL) {
      return { url: resolvedURL, shortCircuit: true };
    }
  }

  if (
    context.parentURL &&
    RELATIVE_SPECIFIER_PATTERN.test(specifier) &&
    !EXPLICIT_EXTENSION_PATTERN.test(
      new URL(specifier, context.parentURL).pathname
    )
  ) {
    const resolvedURL = await resolveExistingCandidate(
      specifier,
      context.parentURL
    );

    if (resolvedURL) {
      return {
        url: resolvedURL,
        shortCircuit: true,
      };
    }
  }

  return nextResolve(specifier, context);
}

//===================================================================

export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && CSS_MODULE_PATTERN.test(url)) {
    return {
      format: 'module',
      source:
        "export default new Proxy({}, { get: (_target, key) => String(key) });",
      shortCircuit: true,
    };
  }

  if (url.startsWith('file:') && TYPESCRIPT_MODULE_PATTERN.test(url)) {
    const source = await readFile(fileURLToPath(url), 'utf8');
    const transpiled = ts.transpileModule(source, {
      fileName: fileURLToPath(url),

      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        jsx: ts.JsxEmit.ReactJSX,
        isolatedModules: true,
        verbatimModuleSyntax: true,
        sourceMap: false,
      },
      reportDiagnostics: false,
    });

    return {
      format: 'module',
      source: transpiled.outputText,
      shortCircuit: true,
    };
  }

  return nextLoad(url, context);
}
