import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

//===================================================================

const RELATIVE_SPECIFIER_PATTERN = /^\.{1,2}\//;
const EXPLICIT_EXTENSION_PATTERN = /\.[a-z0-9]+$/i;
const TYPESCRIPT_MODULE_PATTERN = /\.(?:ts|tsx|mts)$/i;

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
