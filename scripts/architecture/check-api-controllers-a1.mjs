#!/usr/bin/env node
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

//===================================================================

function walk(dir) {
  if (!existsSync(dir)) return [];

  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);

    return entry.isDirectory() ? walk(path) : entry.isFile() ? [path] : [];
  });
}

//===================================================================

const normalize = (path) => path.replaceAll('\\', '/');

//===================================================================

export function auditControllers({
  controllerFiles,
  routeText,
  sharedHelperSource,
}) {
  const errors = [];
  const handlers = [];
  const counts = {};

  const expectedConsumers = new Map([
    ['admin/admin-pharmacy-read.controller.ts', 1],
    ['admin/admin-employee.controller.ts', 1],
    ['admin/admin-owner-documents.controller.ts', 1],
    ['owners/pharmacy-owner-document.controller.ts', 1],
    ['pharmacies/pharmacy.controller.ts', 2],
  ]);

  let attachmentHeaders = 0;
  let silentAuthenticationReturns = 0;

  for (const [file, content] of Object.entries(controllerFiles)) {
    const exports = [
      ...content.matchAll(/export\s+(?:async\s+)?function\s+(\w+)\s*\(/g),
    ].map((m) => m[1]);

    counts[file] = {
      handlers: exports.length,
      lines: content.split(/\r?\n/).length,
    };

    handlers.push(...exports.map((name) => ({ name, file })));

    if (
      /from\s+['"][^'"]*(?:\/models\/|\bmongoose\b)/.test(content) ||
      /\b(?:startSession|withTransaction)\s*\(/.test(content)
    ) {
      errors.push(
        `${file}: persistence access belongs in services, not controllers`
      );
    }

    if (
      /function\s+encodeContentDispositionFilename\b|encodeURIComponent\(document\.name\)/.test(
        content
      )
    ) {
      errors.push(`${file}: duplicated document attachment encoding`);
    }

    const actualHeaderCount = (
      content.match(/['"]Content-Disposition['"]/g) ?? []
    ).length;

    const uses = (
      content.match(/documentAttachmentDisposition\(document\.name\)/g) ?? []
    ).length;

    attachmentHeaders += actualHeaderCount;

    if (
      actualHeaderCount !== uses ||
      (expectedConsumers.get(file) ?? 0) !== uses
    ) {
      errors.push(
        `${file}: document headers must use the one reviewed formatter`
      );
    }

    if (
      expectedConsumers.has(file) &&
      !content.includes('document-attachment')
    ) {
      errors.push(`${file}: missing canonical attachment helper import`);
    }

    silentAuthenticationReturns += (
      content.match(
        /\bif\s*\(\s*!\s*(?:adminUserId|userId|user|req\.user\?\.id)\s*\)\s*return\s*;/g
      ) ?? []
    ).length;

    if (exports.length === 0)
      errors.push(`${file}: controller has no exported handler`);
  }

  for (const { file, name } of handlers) {
    if (!new RegExp(`\\b${name}\\b`).test(routeText)) {
      errors.push(
        `${file}: exported handler ${name} is not referenced by a route`
      );
    }
  }

  if (
    !/export\s+function\s+documentAttachmentDisposition\b/.test(
      sharedHelperSource
    ) ||
    !/encodeURIComponent\(filename\)/.test(sharedHelperSource) ||
    !/filename\*=UTF-8/.test(sharedHelperSource)
  ) {
    errors.push(
      'shared document attachment encoder no longer matches A1 contract'
    );
  }

  if (attachmentHeaders !== 6)
    errors.push(
      `Expected 6 document download headers, got ${attachmentHeaders}`
    );

  if (Object.keys(controllerFiles).length !== 29)
    errors.push('Expected 29 controller implementation files');

  if (handlers.length !== 157)
    errors.push(`Expected 157 routed handler exports, got ${handlers.length}`);

  return {
    status: errors.length ? 'FAIL' : 'PASS',
    stage: 'A1',
    controllerFiles: Object.keys(controllerFiles).length,
    handlerExports: handlers.length,
    attachmentHeaders,
    silentAuthenticationReturns,

    directPersistenceImports: errors.filter((e) =>
      e.includes('persistence access')
    ).length,

    notReferencedByRoutes: errors.filter((e) =>
      e.includes('not referenced by a route')
    ).length,

    warnings: [
      'Silent authentication returns require route-guard review; not modified by A1.',
    ],

    errors,
    fileStatistics: counts,
  };
}

//===================================================================

export function runAudit(root = ROOT) {
  const src = join(root, 'apps/api/src');
  const ctrlDir = join(src, 'controllers');
  const files = walk(ctrlDir).filter((file) => file.endsWith('.controller.ts'));

  const controllerFiles = Object.fromEntries(
    files.map((file) => [
      normalize(relative(ctrlDir, file)),
      readFileSync(file, 'utf8'),
    ])
  );

  const routeText = walk(join(src, 'routes'))
    .filter((file) => file.endsWith('.ts'))
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n');

  const helper = join(ctrlDir, 'shared/document-attachment.ts');

  const sharedHelperSource = existsSync(helper)
    ? readFileSync(helper, 'utf8')
    : '';

  return auditControllers({ controllerFiles, routeText, sharedHelperSource });
}

//===================================================================

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  assert.deepEqual(
    process.argv.slice(2),
    ['--check'],
    'A1 runs only in read-only --check mode'
  );

  const result = runAudit();

  console.log(JSON.stringify(result, null, 2));

  if (result.errors.length) process.exitCode = 1;
}
