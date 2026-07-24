import { readFile, readdir } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';

//===================================================================

const ROOT = resolve(import.meta.dirname, '..');

//===================================================================

const STYLE_ROOTS = [
  'packages/ui/src',
  'apps/client/src',
  'apps/pharmacy/src',
].map((path) => resolve(ROOT, path));

//===================================================================

const TOKENS_PATH = resolve(ROOT, 'packages/ui/src/styles/tokens.css');
const CONTAINER_PATH = resolve(
  ROOT,
  'packages/ui/src/layout/Container/Container.module.css'
);

const UTILITIES_PATH = resolve(ROOT, 'packages/ui/src/styles/utilities.css');

//===================================================================

const ALLOWED_DYNAMIC_CUSTOM_PROPERTIES = new Set([
  '--stats-grid-columns',
  '--stats-grid-tablet-columns',
  '--table-image-preview-size',
  '--toast-offset',
]);

const EXPECTED_TOKENS = new Map([
  ['--container-max-mobile', '375px'],
  ['--container-max-tablet', '768px'],
  ['--container-max-desktop', '1440px'],
  ['--container-padding-mobile', '20px'],
  ['--container-padding-tablet', '32px'],
  ['--container-padding-desktop', '64px'],
  ['--z-base', '0'],
  ['--z-sticky', '100'],
  ['--z-dropdown', '200'],
  ['--z-tooltip', '300'],
  ['--z-backdrop', '400'],
  ['--z-drawer', '500'],
  ['--z-modal', '600'],
  ['--z-toast', '700'],
]);

//===================================================================

async function collectFiles(directory, extensions) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectFiles(absolutePath, extensions)));
      continue;
    }

    if (extensions.has(extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

//===================================================================

function formatPath(path) {
  return relative(ROOT, path).replaceAll('\\', '/');
}

//===================================================================

function readDeclarations(source) {
  return new Map(
    [...source.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map(
      ([, name, value]) => [name, value.trim()]
    )
  );
}

//===================================================================

function getMediaBreakpoints(source) {
  return [
    ...source.matchAll(
      /@media\s+only\s+screen\s+and\s+\(min-width:\s*(\d+)px\)/g
    ),
  ].map((match) => Number(match[1]));
}

//===================================================================

function assertContainerContract(source, selector, file, errors) {
  const basePattern = new RegExp(
    `\\.${selector}\\s*\\{[\\s\\S]*?max-width:\\s*var\\(--container-max-mobile\\);[\\s\\S]*?padding-inline:\\s*var\\(--container-padding-mobile\\);[\\s\\S]*?\\}`
  );
  const tabletPattern = new RegExp(
    `@media only screen and \\(min-width: 768px\\)[\\s\\S]*?\\.${selector}\\s*\\{[\\s\\S]*?max-width:\\s*var\\(--container-max-tablet\\);[\\s\\S]*?padding-inline:\\s*var\\(--container-padding-tablet\\);[\\s\\S]*?\\}`
  );
  const desktopPattern = new RegExp(
    `@media only screen and \\(min-width: 1440px\\)[\\s\\S]*?\\.${selector}\\s*\\{[\\s\\S]*?max-width:\\s*var\\(--container-max-desktop\\);[\\s\\S]*?padding-inline:\\s*var\\(--container-padding-desktop\\);[\\s\\S]*?\\}`
  );

  if (
    !basePattern.test(source) ||
    !tabletPattern.test(source) ||
    !desktopPattern.test(source)
  ) {
    errors.push(
      `${formatPath(file)} does not follow the canonical 375/768/1440 container contract`
    );
  }
}

//===================================================================

const cssFiles = (
  await Promise.all(
    STYLE_ROOTS.map((directory) => collectFiles(directory, new Set(['.css'])))
  )
).flat();

//===================================================================

const sourceFiles = (
  await Promise.all(
    STYLE_ROOTS.map((directory) =>
      collectFiles(directory, new Set(['.css', '.ts', '.tsx']))
    )
  )
).flat();

//===================================================================

const errors = [];
const definedVariables = new Set();
const usedVariables = new Map();

//===================================================================

for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');

  for (const [, name] of source.matchAll(/(--[a-z0-9-]+)\s*:/gi)) {
    definedVariables.add(name);
  }
}

//===================================================================

for (const file of cssFiles) {
  const source = await readFile(file, 'utf8');
  const path = formatPath(file);

  if (
    /(@media[^\n{]*(max-width|767(?:\.98)?px|1439(?:\.98)?px))/i.test(source)
  ) {
    errors.push(
      `${path} uses a forbidden max-width or legacy 767/1439 breakpoint`
    );
  }

  const breakpoints = getMediaBreakpoints(source);
  for (const breakpoint of breakpoints) {
    if (breakpoint !== 768 && breakpoint !== 1440) {
      errors.push(
        `${path} uses unsupported min-width breakpoint ${breakpoint}px`
      );
    }
  }

  for (let index = 1; index < breakpoints.length; index += 1) {
    if (breakpoints[index] < breakpoints[index - 1]) {
      errors.push(
        `${path} places a smaller breakpoint after a larger breakpoint`
      );
      break;
    }
  }

  for (const match of source.matchAll(/z-index:\s*(-?\d+)\s*;/g)) {
    const value = Number(match[1]);
    if (Math.abs(value) > 10) {
      errors.push(
        `${path} uses numeric z-index ${value}; use a semantic --z-* token`
      );
    }
  }

  for (const [, name] of source.matchAll(/var\((--[a-z0-9-]+)/gi)) {
    const paths = usedVariables.get(name) ?? new Set();
    paths.add(path);
    usedVariables.set(name, paths);
  }
}

//===================================================================

for (const [name, paths] of usedVariables) {
  if (
    definedVariables.has(name) ||
    ALLOWED_DYNAMIC_CUSTOM_PROPERTIES.has(name)
  ) {
    continue;
  }

  errors.push(
    `${name} is used but never defined (${[...paths].slice(0, 3).join(', ')})`
  );
}

//===================================================================

const tokenSource = await readFile(TOKENS_PATH, 'utf8');
const tokenDeclarations = readDeclarations(tokenSource);

//===================================================================

for (const [name, expectedValue] of EXPECTED_TOKENS) {
  const actualValue = tokenDeclarations.get(name);
  if (actualValue !== expectedValue) {
    errors.push(
      `${formatPath(TOKENS_PATH)} must define ${name}: ${expectedValue}; received ${actualValue ?? 'missing'}`
    );
  }
}

//===================================================================

assertContainerContract(
  await readFile(CONTAINER_PATH, 'utf8'),
  'page',
  CONTAINER_PATH,
  errors
);

assertContainerContract(
  await readFile(UTILITIES_PATH, 'utf8'),
  'container',
  UTILITIES_PATH,
  errors
);

//===================================================================

if (errors.length > 0) {
  console.error('UI style contract check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `UI style contract check passed (${cssFiles.length} CSS files scanned).`
  );
}
