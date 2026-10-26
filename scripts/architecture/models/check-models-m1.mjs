#!/usr/bin/env node
// M1 architecture gate. No database access, migrations, or file writes.
// Historical inventory is immutable: hashes normalize only resolved relative paths.
import assert from 'node:assert/strict';

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import path from 'node:path';

import { fileURLToPath } from 'node:url';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const inventory = JSON.parse(
  readFileSync(
    path.join(root, 'docs/architecture/models-m1/model-inventory.json'),
    'utf8'
  )
);

const manifest = JSON.parse(
  readFileSync(
    path.join(root, 'docs/architecture/models-m1/model-relocation-map.json'),
    'utf8'
  )
);

const scope = 'apps/api/src/models/';

const excluded = new Set([
  'node_modules',
  '.git',
  '.next',
  '.turbo',
  'dist',
  'build',
  'coverage',
]);

const code = /\.(?:ts|tsx|mts|cts|js|jsx|mjs|cjs)$/;

const extensions = [
  '',
  '.ts',
  '.tsx',
  '.mts',
  '.cts',
  '.js',
  '.mjs',
  '.cjs',
  '/index.ts',
  '/index.tsx',
];

//===================================================================

function walk(directory, files = []) {
  for (const entry of readdirSync(path.join(root, directory), {
    withFileTypes: true,
  })) {
    if (excluded.has(entry.name)) continue;

    const filename = path.posix.join(directory, entry.name);

    if (entry.isDirectory()) walk(filename, files);
    else if (entry.isFile() && code.test(entry.name)) files.push(filename);
  }

  return files;
}

//===================================================================

function relativeResolution(caller, specifier, files) {
  if (!specifier.startsWith('.')) return null;

  const candidate = path.posix.normalize(
    path.posix.join(path.posix.dirname(caller), specifier)
  );

  return (
    extensions
      .map((ext) => `${candidate}${ext}`)
      .find((file) => files.has(file)) ?? null
  );
}

//===================================================================

function sha(text) {
  return createHash('sha256').update(text).digest('hex');
}

//===================================================================

// The original M1 hashes remain immutable. These supplementary, baseline-derived
// hashes allow only blank lines and standalone //=== divider comments to change.
// They are pinned to each original file, not calculated from the working tree.
const layoutInsensitiveSha256 = new Map([
  [
    'apps/api/src/models/admin/access/adminAccess.model.ts',
    '683927fc94f5b0949c22faabe30e5d0925d17fe53c37b4447d5b651e1b113ed0',
  ],
  [
    'apps/api/src/models/audit/adminAuditLog.model.ts',
    '6ca1444456340da8454d5eff7c85c0ca609ed67705133e4cc52a01b1c8d6f130',
  ],
  [
    'apps/api/src/models/admin/access/adminAuthorizationState.model.ts',
    '30f86cfa243e9685b56661ed3bb6819726bb42fc4f30dfb68e774275a3dbe13e',
  ],
  [
    'apps/api/src/models/admin/employees/adminEmployeeDocument.model.ts',
    '17160958a397273a12ed2d4180620469e8f1a8ededfe0a54830941764c2966d5',
  ],
  [
    'apps/api/src/models/admin/employees/adminEmployeePrivateNote.model.ts',
    'd18ea3eaf580e3eb5f32a748a14151d471492f75a46acd808870e3370e6eef71',
  ],
  [
    'apps/api/src/models/cart/cart.model.ts',
    '1a5a4d839eb2d9c0b220b99f849ffc1cfc0284d98c0294a91cd2a69e6783e243',
  ],
  [
    'apps/api/src/models/clients/client.model.ts',
    '538791947ddc3068c830b8a1dea43bd07eb72281aa82e99c199ba6ef5780cde9',
  ],
  [
    'apps/api/src/models/__tests__/model-validation.contract.test.ts',
    '0bca5e77c1092f6237d9aa78fd3bc303cc969a20e60049822c5e6aaf658d2e04',
  ],
  [
    'apps/api/src/models/orders/order.model.ts',
    '1f95f9fdd0b865cc57ea68de37c4aa6a22cb648a760fdbc726ba9701d375ae04',
  ],
  [
    'apps/api/src/models/pharmacies/pharmacy.model.ts',
    '836638270b04e3cd0fb8084de0aacb3d11c8d4dd98f5776535f229548717f314',
  ],
  [
    'apps/api/src/models/admin/comments/pharmacyAdminComment.model.ts',
    '3f3f2a46bf9ac65c27864cfa6fba520519ceb7ee9efeea567f6f33ea97322532',
  ],
  [
    'apps/api/src/models/pharmacies/pharmacyDocumentFile.model.ts',
    '1e9588058f2c125811d0f93820ee063461e924acb36e444d32e7beefa3251837',
  ],
  [
    'apps/api/src/models/pharmacies/pharmacyNote.model.ts',
    '0781c2f9b00c39cca91ca3237e19a765eb7347b46c22c3ecfcd25953cef684b0',
  ],
  [
    'apps/api/src/models/admin/comments/pharmacyOwnerAdminComment.model.ts',
    '01c0dbd4295b68dd5154e2739cf9472f94f325fc78da0ee19768b6e8dab9b05c',
  ],
  [
    'apps/api/src/models/owners/pharmacyOwnerDocument.model.ts',
    'dbbbda11e06a6b5d35f2037582f6e87fa4bd461d341eed00f9d86b9f6a04f138',
  ],
  [
    'apps/api/src/models/owners/pharmacyRegistrationUploadSession.model.ts',
    'b6276ebd3e068a7e0cf53613ec3cb54142007fcc3d7ef397bc06babe131b6b10',
  ],
  [
    'apps/api/src/models/reviews/pharmacyReview.model.ts',
    '3bd713603e11815466efefbad1dbe74037cb96f518be1042360a9c613f70615a',
  ],
  [
    'apps/api/src/models/owners/pharmacyUserPrivateNote.model.ts',
    'e3a1933af59da6318dd6cd10dbff0cefab9f88fa612d4c52fded6bc827928e22',
  ],
  [
    'apps/api/src/models/settings/position.model.test.ts',
    'c48980dea9d69027a6c22287c571881bef1dd205a0a3a0c702aadaf4c683183e',
  ],
  [
    'apps/api/src/models/settings/position.model.ts',
    'caec9da081e0b6e22cd313b46aede63372548d819b1a59d437476017cf66f55a',
  ],
  [
    'apps/api/src/models/catalog/product.model.ts',
    'e8cb246718e1d5782a893ea477360b1345081b828f2130021cff9b630c54207f',
  ],
  [
    'apps/api/src/models/catalog/productCategory.model.test.ts',
    '33041ac8c9b66a783fd0617f0e0a6baa40f595085fb4b17ecd43977a6521e1dc',
  ],
  [
    'apps/api/src/models/catalog/productCategory.model.ts',
    '739ee314efcaf2753a11bd205e0248d4d5354d0aacf69bedbce4d1b88c860db5',
  ],
  [
    'apps/api/src/models/inventory/productOffer.model.ts',
    '2cda15a142ec9a63fff2fc481004ae52778976214be85489e8bcb73e89f4e882',
  ],
  [
    'apps/api/src/models/catalog/productRequest.model.ts',
    'b6657127d88904ce0c3aaa1f20ba04c3425e81805013e0f563994bb5d574bee8',
  ],
  [
    'apps/api/src/models/reviews/productReview.model.ts',
    'f6414f89b8dddbc267c92f55aa0d357e6511e81fa2e482f6a7ac10944ef8977d',
  ],
  [
    'apps/api/src/models/infrastructure/rateLimitBucket.model.ts',
    '9db8abd6a140f07fd3263602517f60ef9326b48ead314a61bf7eedd0a1155c09',
  ],
  [
    'apps/api/src/models/accounts/session.model.ts',
    '1e6547871e78d62bae706c8c901a66b40923009bc8631bb4a06ddbe90fa0dab6',
  ],
  [
    'apps/api/src/models/inventory/stockMovement.model.ts',
    '86bc2203a4cd4921ea088ecac3dcefdb7150e7884ad2ec1f501f0f63b44eeee0',
  ],
  [
    'apps/api/src/models/accounts/user.model.ts',
    'b4d7beec024f8bdee204479bcb59b9fecfef4bfbd914c1319b056c6ce11ad2a5',
  ],
]);

//===================================================================

function normalizeCosmeticLayout(source) {
  // A changed multiline template may have meaningful blank lines. Fail closed
  // rather than accidentally treating template-string content as formatting.
  const templateLiterals = source.match(/`(?:\\.|[^`\\])*`/g) ?? [];

  assert(
    templateLiterals.every((value) => !/[\r\n]/.test(value)),
    'M1 cosmetic normalization does not support multiline template literals'
  );

  return source
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .filter(
      (line) => line.trim() !== '' && !/^[ \t]*\/\/={12,}[ \t]*$/.test(line)
    )
    .join('\n');
}

//===================================================================

assert.equal(inventory.schemaVersion, 1);
assert.equal(manifest.schemaVersion, 1);
assert.equal(manifest.scope, scope);
assert.equal(manifest.moves.length, inventory.files.length);
assert.equal(inventory.modelCount, 27);
assert.equal(inventory.testCount, 3);

assert.deepEqual(
  new Set(layoutInsensitiveSha256.keys()),
  new Set(inventory.files.map((item) => item.toPath)),
  'Cosmetic-source baseline must cover exactly the immutable M1 inventory'
);

//===================================================================

const oldPaths = new Set();
const targets = new Set();
const canonicalOld = new Map();

for (const entry of manifest.moves) {
  assert(entry.from.startsWith(scope) && entry.to.startsWith(scope));
  assert(!entry.from.includes('..') && !entry.to.includes('..'));
  assert(!oldPaths.has(entry.from) && !targets.has(entry.to));

  oldPaths.add(entry.from);
  targets.add(entry.to);
  canonicalOld.set(entry.to, entry.from);

  assert(
    !existsSync(path.join(root, entry.from)),
    `Legacy proxy or obsolete model: ${entry.from}`
  );

  assert(
    existsSync(path.join(root, entry.to)),
    `Missing canonical model: ${entry.to}`
  );
}

//===================================================================

// G1 Constants changes physical import targets, not model logic. Fold only
// completed, exact manifest paths back to their immutable pre-G1 identity.
// This retains the original M1 source fingerprints without relaxing hashing.
const g1MapFile = 'docs/architecture/grouping-g0/relocation-plan.json';

if (existsSync(path.join(root, g1MapFile))) {
  const grouping = JSON.parse(readFileSync(path.join(root, g1MapFile), 'utf8'));
  const constantMoves = grouping.moves.filter((item) => item.stage === 'G1');

  assert.equal(
    constantMoves.length,
    35,
    'G1 canonical constant map must be complete'
  );

  const migrated = constantMoves.filter((item) =>
    existsSync(path.join(root, item.to))
  );

  assert(
    migrated.length === 0 || migrated.length === constantMoves.length,
    'Partially migrated constants are not a valid M1 dependency baseline'
  );

  if (migrated.length) {
    for (const item of constantMoves) {
      assert(
        !existsSync(path.join(root, item.from)),
        `Legacy constants proxy prohibited: ${item.from}`
      );

      assert(
        !canonicalOld.has(item.to),
        `Duplicate canonical M1/G1 path: ${item.to}`
      );

      canonicalOld.set(item.to, item.from);
    }
  }
}

//===================================================================

// G2 schemas update resolved relative targets only. Require an all-or-none
// relocation and fold the exact immutable G0 map into historical M1 hashes.
if (existsSync(path.join(root, g1MapFile))) {
  const grouping = JSON.parse(readFileSync(path.join(root, g1MapFile), 'utf8'));
  const schemas = grouping.moves.filter((item) => item.stage === 'G2');
  const movedSchemas = schemas.filter((item) => !item.stable);

  assert.equal(schemas.length, 50);
  assert.equal(movedSchemas.length, 38);

  const migrated = movedSchemas.filter((item) =>
    existsSync(path.join(root, item.to))
  );

  assert(
    migrated.length === 0 || migrated.length === movedSchemas.length,
    'Partial G2 schemas relocation is not a valid M1 dependency state'
  );

  if (migrated.length)
    for (const item of movedSchemas) {
      assert(
        !existsSync(path.join(root, item.from)),
        `Legacy schemas proxy prohibited: ${item.from}`
      );

      assert(
        !canonicalOld.has(item.to),
        `Duplicate M1/G2 canonical target: ${item.to}`
      );

      canonicalOld.set(item.to, item.from);
    }
}

//===================================================================

// G4 moves TypeScript declarations/DTOs only. Fold their *exact* immutable
// canonical paths back to G0 identities when checking historical M1 sources.
if (existsSync(path.join(root, g1MapFile))) {
  const grouping = JSON.parse(readFileSync(path.join(root, g1MapFile), 'utf8'));
  const types = grouping.moves.filter((item) => item.stage === 'G4');

  assert.equal(types.length, 23, 'G4 type map must stay immutable');

  const migrated = types.filter((item) => existsSync(path.join(root, item.to)));

  assert(
    migrated.length === 0 || migrated.length === types.length,
    'Partial G4 types relocation is not a valid M1 dependency state'
  );

  if (migrated.length)
    for (const item of types) {
      assert(!item.stable, `Unexpected stable G4 type: ${item.from}`);

      assert(
        !existsSync(path.join(root, item.from)),
        `Legacy types proxy prohibited: ${item.from}`
      );

      assert(
        !canonicalOld.has(item.to),
        `Duplicate M1/G4 canonical target: ${item.to}`
      );

      canonicalOld.set(item.to, item.from);
    }
}

//===================================================================

// G5 utilities are relocated, not refactored. Canonicalize only exact G0 paths
// to preserve immutable historical M1 source fingerprints.
if (existsSync(path.join(root, g1MapFile))) {
  const grouping = JSON.parse(readFileSync(path.join(root, g1MapFile), 'utf8'));
  const utils = grouping.moves.filter((item) => item.stage === 'G5');
  const movedUtils = utils.filter((item) => !item.stable);

  assert.equal(utils.length, 31, 'G5 utility map must stay immutable');
  assert.equal(movedUtils.length, 30);

  const migrated = movedUtils.filter((item) =>
    existsSync(path.join(root, item.to))
  );

  assert(
    migrated.length === 0 || migrated.length === movedUtils.length,
    'Partial G5 utilities relocation is not a valid M1 dependency state'
  );

  if (migrated.length)
    for (const item of movedUtils) {
      assert(
        !existsSync(path.join(root, item.from)),
        `Legacy utility proxy prohibited: ${item.from}`
      );

      assert(
        !canonicalOld.has(item.to),
        `Duplicate M1/G5 canonical target: ${item.to}`
      );

      canonicalOld.set(item.to, item.from);
    }
}

//===================================================================

const files = new Set(
  ['apps', 'packages', 'scripts'].flatMap((dir) => walk(dir))
);

const actualModels = [...files].filter(
  (file) => file.startsWith(scope) && file.endsWith('.ts')
);

assert.equal(
  actualModels.length,
  manifest.moves.length,
  'Model files must exactly match relocation manifest'
);

for (const file of actualModels)
  assert(targets.has(file), `Unexpected top-level/proxy model: ${file}`);

//===================================================================

// This normalizes a moved module's imports to their original resolved targets.
// Any field, index, hook, validator, method or model name change changes the hash.
function canonicalSource(source, caller) {
  return source.replace(/'[^'\n]*'|"[^"\n]*"|`[^`]*`/g, (literal) => {
    const quote = literal[0];
    const spec = literal.slice(1, -1);

    if (!spec.startsWith('.') || spec.includes('\\') || spec.includes('${'))
      return literal;

    const target = relativeResolution(caller, spec, files);

    if (!target) return literal;

    return `${quote}<REPO:${canonicalOld.get(target) ?? target}>${quote}`;
  });
}

//===================================================================

let indexes = 0;
let schemaCount = 0;

const invalidFingerprints = [];

for (const item of inventory.files) {
  const entry = manifest.moves.find((move) => move.from === item.fromPath);

  assert(entry && entry.to === item.toPath && entry.domain === item.domain);

  const text = readFileSync(path.join(root, item.toPath), 'utf8');
  const canonical = canonicalSource(text, item.toPath);
  const hash = sha(canonical);

  if (hash !== item.canonicalSourceSha256) {
    const normalized = sha(normalizeCosmeticLayout(canonical));
    const expected = layoutInsensitiveSha256.get(item.toPath);

    if (normalized !== expected)
      invalidFingerprints.push(
        `${item.toPath} (normalized: ${normalized}, expected: ${expected})`
      );
  }

  indexes += item.indexDeclarations;
  schemaCount += item.schemaDeclarations;
}

assert.equal(
  invalidFingerprints.length,
  0,
  `Model/schema/test altered beyond allowed cosmetic layout changes:\n${invalidFingerprints.join('\n')}`
);

//===================================================================

// Check that all local imports resolve (including service, controllers, scripts, checks),
// without considering CSS / static assets to be TS modules.
const imported =
  /\bfrom\s*['"](\.[^'"\n]+)['"]|\bimport\s*\(\s*['"](\.[^'"\n]+)['"]|\brequire\s*\(\s*['"](\.[^'"\n]+)['"]/g;

let resolved = 0;
let modelReferences = 0;

const basename = [...oldPaths].map((source) => path.posix.basename(source));

const stale = new RegExp(
  `(?:^|[^\\w])models/(?:${basename.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})(?![\\w.])`
);

const splitStale = new RegExp(
  `['"]models['"]\\s*,\\s*['"](?:${basename.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})['"]`
);

for (const caller of files) {
  const text = readFileSync(path.join(root, caller), 'utf8');

  assert(!stale.test(text), `Legacy source path in ${caller}`);
  assert(!splitStale.test(text), `Legacy split model path in ${caller}`);

  if (
    caller.startsWith('scripts/architecture/') &&
    caller.endsWith('.test.mjs')
  )
    continue;

  for (const match of text.matchAll(imported)) {
    const spec = match[1] ?? match[2] ?? match[3];
    const candidate = relativeResolution(caller, spec, files);

    // TypeScript source imports always resolve; CSS/JSON import paths aren't TS modules.
    if (candidate) {
      resolved++;

      if (candidate.startsWith(scope)) modelReferences++;
    } else if (
      !/\.(?:css|scss|sass|less|json|svg|png|webp|woff2?)$/i.test(spec)
    ) {
      throw Error(`Unresolved relative import: ${caller} -> ${spec}`);
    }
  }
}

//===================================================================

// All production Mongoose model files should be independent of one another.
// Tests intentionally exercise models from multiple domains, but must not cause imports
// among production models or their registration cycles.
const prod = new Set(
  inventory.files.filter((f) => f.kind === 'model').map((f) => f.toPath)
);

for (const filename of prod) {
  const text = readFileSync(path.join(root, filename), 'utf8');

  for (const match of text.matchAll(imported)) {
    const target = relativeResolution(
      filename,
      match[1] ?? match[2] ?? match[3],
      files
    );

    assert(
      !prod.has(target),
      `Model-to-model import / potential circular initialization: ${filename} -> ${target}`
    );
  }
}

//===================================================================

console.log(
  JSON.stringify(
    {
      status: 'PASS',
      models: inventory.modelCount,
      tests: inventory.testCount,
      relocated: targets.size,
      preservedIndexDeclarations: indexes,
      preservedSchemaDeclarations: schemaCount,
      resolvedCodeImports: resolved,
      modelImportReferences: modelReferences,
      obsoleteModelFiles: 0,
      invalidSchemaFingerprints: 0,
    },
    null,
    2
  )
);
