#!/usr/bin/env node
// Final cross-folder read-only check. Never connects to MongoDB or runs migrations.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';

import ts from 'typescript';

import { runAudit as auditControllers } from '../audits/check-api-controllers-a1.mjs';
import { runAudit as auditMiddlewares } from '../audits/check-api-middlewares-a2.mjs';

import { auditRoutes } from '../audits/check-api-routes-a4.mjs';
import { analyzeModels } from '../models/check-api-models-a3.mjs';
import { analyzeConstants } from '../constants/check-api-constants-a5.mjs';
import { auditSchemas } from '../schemas/check-api-schemas-a6.mjs';
import { auditScripts } from '../scripts/check-api-scripts-a7.mjs';
import { auditTypes } from '../types/check-api-types-a8.mjs';
import { auditUtils } from '../utils/check-api-utils-a9.mjs';

//===================================================================

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

//===================================================================

const SOURCES = Object.freeze({
  apiSlug: 'apps/api/src/utils/catalog/public-slug-id.ts',
  sharedSlug: 'packages/validation/src/url/slug-id.ts',
  apiHours: 'apps/api/src/utils/validation/working-hours.ts',
  sharedHours: 'packages/validation/src/pharmacy/working-hours.ts',
});

//===================================================================

export function assertReadOnlyFlags(args) {
  assert.deepEqual(args, ['--check'], 'Final audit supports only --check');
}

//===================================================================

// Only the four reviewed, import-free utility modules are evaluated. VM has no
// process, require, file system, network, or other application dependencies.
function loadPureUtility(source, filename) {
  const parsed = ts.createSourceFile(
    filename,
    source,
    ts.ScriptTarget.Latest,
    true
  );

  if (parsed.parseDiagnostics.length)
    throw Error(`Invalid TS utility: ${filename}`);

  if (
    parsed.statements.some(
      (node) =>
        ts.isImportDeclaration(node) ||
        ts.isExportDeclaration(node) ||
        ts.isImportEqualsDeclaration(node)
    )
  ) {
    throw Error(
      `Cross-folder parity source must remain import-free: ${filename}`
    );
  }

  if (
    /\b(?:require|process|globalThis|eval|Function|fetch|import\s*\()\b/.test(
      source
    )
  ) {
    throw Error(`Unsafe runtime dependency in parity source: ${filename}`);
  }

  const output = ts.transpileModule(source, {
    fileName: filename,

    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },

    reportDiagnostics: true,
  });

  if (
    output.diagnostics?.some(
      (item) => item.category === ts.DiagnosticCategory.Error
    )
  ) {
    throw Error(`Failed to transpile utility: ${filename}`);
  }

  const exports = Object.create(null);

  runInNewContext(output.outputText, { exports }, { filename, timeout: 500 });

  return exports;
}

//===================================================================

const ID = '64a8e34f2c8b123456789abc';

const SLUG_CASES = [
  ['product', 'Amlodipine 5 mg', ID],
  ['pharmacy', 'Аптека №1', ID],
  ['product', '  Dnipro—Шевченка  ', ID],
  ['pharmacy', "O’Reilly's", ID],
  ['product', '💊 + ╳', ID],
  ['pharmacy', '', ID],
  ['product', 'a--b', ID.toUpperCase()],
  ['pharmacy', 'A / B', ID],
  ['product', 'Negative', 'not-an-id'],
  ['product', 'Too short', ID.slice(1)],
  ['pharmacy', 'Empty', ''],
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const weekly = (range, dayOverrides = {}) =>
  DAYS.map((day) => `${day}: ${dayOverrides[day] ?? range}`).join('; ');

//===================================================================

const HOURS_CASES = [
  '',
  '   ',
  weekly('09:00-18:00'),
  weekly('Closed'),
  weekly('09:00-18:00', { Sun: 'Closed' }),
  weekly('00:00-23:59'),
  weekly('09:00-09:00'),
  weekly('18:00-09:00'),
  weekly('24:00-23:59'),
  weekly('09:60-19:00'),

  weekly('09:00-18:00', { Tue: 'garbage' }),
  'Mon: 09:00-18:00',
  `${weekly('09:00-18:00')}; Mon: Closed`,

  weekly('09:00-18:00').replace('Tue:', 'Mon:'),
  weekly('09:00-18:00').replace('Mon:', 'mon:'),

  weekly('09:00-18:00').replace('Mon: ', 'Mon:  '),
  ` ; ${weekly('09:00-18:00')} ; `,

  weekly('09:00-18:00', { Wed: 'Closed', Fri: 'Closed' }),

  ...DAYS.map((day) => weekly('08:30-17:45', { [day]: 'Closed' })),
];

//===================================================================

const observed = (fn, args) => {
  try {
    return { outcome: 'value', value: fn(...args) };
  } catch (error) {
    return { outcome: 'throws', name: error?.name, message: error?.message };
  }
};

//===================================================================

export function checkUtilityParity(root = ROOT, sourceOverrides = new Map()) {
  const errors = [];

  const read = (file) =>
    sourceOverrides.get(file) ?? readFileSync(join(root, file), 'utf8');

  const loaded = {};

  for (const [key, path] of Object.entries(SOURCES)) {
    try {
      loaded[key] = loadPureUtility(read(path), path);
    } catch (error) {
      errors.push(String(error.message));
    }
  }

  if (errors.length) return { slugCases: 0, hoursCases: 0, errors };

  for (const [entity, name, id] of SLUG_CASES) {
    const lhs = observed(loaded.apiSlug.buildPublicEntitySlugId, [
      entity,
      name,
      id,
    ]);

    const rhs = observed(loaded.sharedSlug.buildPublicEntitySlugId, [
      entity,
      name,
      id,
    ]);

    if (JSON.stringify(lhs) !== JSON.stringify(rhs))
      errors.push(`Slug result drift for ${entity}/${name}/${id}`);
  }

  for (const value of HOURS_CASES) {
    const lhs = observed(loaded.apiHours.getWorkingHoursValidationIssue, [
      value,
    ]);

    const rhs = observed(loaded.sharedHours.getWorkingHoursValidationIssue, [
      value,
    ]);

    if (JSON.stringify(lhs) !== JSON.stringify(rhs))
      errors.push(`Working-hours validator drift for ${JSON.stringify(value)}`);
  }

  return {
    slugCases: SLUG_CASES.length,
    hoursCases: HOURS_CASES.length,
    errors,
  };
}

//===================================================================

const AUDITS = [
  ['A1', auditControllers],
  ['A2', auditMiddlewares],
  ['A3', analyzeModels],
  ['A4', auditRoutes],
  ['A5', analyzeConstants],
  ['A6', auditSchemas],
  ['A7', auditScripts],
  ['A8', auditTypes],
  ['A9', auditUtils],
];

//===================================================================

const STAGE_COUNTS = {
  A1: ['controllerFiles', 29],
  A2: ['middlewareFiles', 12],
  A3: ['registeredModels', 27],
  A4: ['methodRegistrations', 159],
  A5: ['constantFiles', 35],
  A6: ['schemaFiles', 50],
  A7: ['canonicalScripts', 14],
  A8: ['totalTypeFiles', 100],
  A9: ['totalUtilityFiles', 56],
};

//===================================================================

export function checkStageIntegration(reports) {
  const errors = [];

  for (const [name] of AUDITS) {
    const result = reports[name];

    if (!result || result.status !== 'PASS' || result.errors?.length) {
      errors.push(`${name} stage did not pass its canonical audit`);
      continue;
    }

    const [field, expected] = STAGE_COUNTS[name];

    if (result[field] !== expected)
      errors.push(`${name} contract count drift: ${field}=${result[field]}`);
  }

  if (
    reports.A1?.silentAuthenticationReturns !==
      reports.A4?.guardedEarlyReturns ||
    reports.A4?.guardedEarlyReturns !== reports.A4?.controllerEarlyReturns
  ) {
    errors.push(
      'Controller silent-auth branches are not all guarded by A4 routes'
    );
  }

  if (
    reports.A4?.mountedEndpoints !== 190 ||
    reports.A4?.routerMounts !== 13 ||
    reports.A4?.danglingHandlerImports !== 0
  ) {
    errors.push(
      'Router aliases, mounts, or canonical handler imports have drifted'
    );
  }

  if (
    reports.A3?.schemaDeclarations !== 41 ||
    reports.A3?.explicitIndexDeclarations !== 91 ||
    reports.A3?.unresolvedRefs !== 0
  ) {
    errors.push('MongoDB schema/index/model-reference integrity drift');
  }

  if (
    reports.A8?.unresolvedImports !== 0 ||
    reports.A8?.typeImportCycles !== 0 ||
    reports.A9?.unresolvedImports !== 0 ||
    reports.A9?.importCycles !== 0
  ) {
    errors.push(
      'Shared API/utility/type import resolution or cycle regression'
    );
  }

  if (
    reports.A7?.diagnosticWriteCalls !== 0 ||
    reports.A9?.topLevelSideEffectViolations !== 0
  ) {
    errors.push(
      'Read-only diagnostics or utility load-side-effect boundary drift'
    );
  }

  if (
    JSON.stringify(reports.A5?.seedCategories) !==
    JSON.stringify([
      'medicine',
      'vitamins',
      'beauty',
      'hygiene',
      'medical_devices',
    ])
  ) {
    errors.push('Persisted product categories contract drift');
  }

  return errors;
}

//===================================================================

export function checkGateWiring(packageJson) {
  const errors = [];
  const scripts = packageJson.scripts ?? {};

  for (const stage of [
    'controllers-a1',
    'middlewares-a2',
    'models-a3',
    'routes-a4',
    'constants-a5',
    'schemas-a6',
    'scripts-a7',
    'types-a8',
    'utils-a9',
  ]) {
    if (!scripts[`check:${stage}`] || !scripts[`test:${stage}`])
      errors.push(`Missing paired audit commands: ${stage}`);

    if (
      !scripts['check:before-deploy:staged']?.includes(`pnpm test:${stage}`)
    ) {
      errors.push(`Staged deployment gate omits test:${stage}`);
    }

    if (!scripts['check:architecture:final']?.includes(`pnpm test:${stage}`)) {
      errors.push(`Final architecture gate omits test:${stage}`);
    }
  }

  for (const command of [
    'check:cross-folder-final',
    'test:cross-folder-final',
  ]) {
    if (!scripts[command])
      errors.push(`Missing final checker command: ${command}`);

    if (!scripts['check:before-deploy:staged']?.includes(`pnpm ${command}`)) {
      errors.push(`Staged deployment gate omits ${command}`);
    }
  }

  if (
    !scripts['check:architecture:final']?.includes(
      'pnpm check:grouping-g6:full'
    )
  ) {
    errors.push(
      'Final architecture command must retain the full original G6 Gate'
    );
  }

  return errors;
}

//===================================================================

export function auditCrossFolder(root = ROOT, fixture = {}) {
  const errors = [];
  const results = fixture.stageReports ?? {};

  if (!fixture.stageReports) {
    for (const [name, fn] of AUDITS) {
      try {
        results[name] = fn(root);
      } catch (error) {
        errors.push(`${name} checker threw: ${error.message}`);
      }
    }
  }

  errors.push(...checkStageIntegration(results));

  const json =
    fixture.packageJson ??
    JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));

  errors.push(...checkGateWiring(json));

  const parity = checkUtilityParity(root, fixture.sourceOverrides ?? new Map());

  errors.push(...parity.errors);

  return {
    stage: 'Cross-folder Final',
    status: errors.length ? 'FAIL' : 'PASS',
    checkedAudits: Object.keys(results).length,
    controllers: results.A1?.controllerFiles ?? null,
    routerEndpoints: results.A4?.mountedEndpoints ?? null,
    guardedControllerEarlyReturns: results.A4?.guardedEarlyReturns ?? null,
    mongooseModels: results.A3?.registeredModels ?? null,
    apiAndSharedTypeModules: results.A8?.totalTypeFiles ?? null,
    apiAndSharedUtilityModules: results.A9?.totalUtilityFiles ?? null,
    parityCases: parity,

    warnings: [
      'Static contracts and sampled runtime parity do not prove Mongo transaction behavior or end-to-end authorization.',
      'A7 demo seed and historical domain migrations remain dangerous on production data; final audit does not execute them.',
      'Shared slug and hours helpers have duplicated implementations; merge only after reviewed public API and fingerprint migration.',
    ],

    errors,
  };
}

//===================================================================

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    assertReadOnlyFlags(process.argv.slice(2));

    const result = auditCrossFolder();

    console.log(JSON.stringify(result, null, 2));

    if (result.status !== 'PASS') process.exitCode = 1;
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
