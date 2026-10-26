import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseArgs, verifyLayout } from './check-script-layout.mjs';

//===================================================================

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../..'
);

const map = JSON.parse(
  readFileSync(
    path.join(
      root,
      'docs/architecture/scripts-reorganization/relocation-map.json'
    ),
    'utf8'
  )
);

const scripts = JSON.parse(
  readFileSync(path.join(root, 'package.json'), 'utf8')
).scripts;

const moves = Object.entries(map.mapping);

const base = {
  moves,
  exists: (p) => existsSync(path.join(root, p)),
  scripts,
  flatEntries: readdirSync(path.join(root, 'scripts/architecture')),
};

//===================================================================

test('all 32 architecture scripts are grouped, with no legacy flat files', () =>
  assert.deepEqual(verifyLayout(base), []));

//===================================================================

test('a missing canonical script fails closed', () =>
  assert.match(
    verifyLayout({
      ...base,
      exists: (p) => (p === moves[0][1] ? false : base.exists(p)),
    }).join('\n'),
    /Canonical architecture script missing/
  ));

//===================================================================

test('a legacy flat proxy fails closed', () =>
  assert.match(
    verifyLayout({
      ...base,
      exists: (p) => (p === moves[0][0] ? true : base.exists(p)),
    }).join('\n'),
    /Legacy flat script/
  ));

//===================================================================

test('a broken package command fails closed', () =>
  assert.match(
    verifyLayout({
      ...base,

      scripts: {
        ...scripts,
        'bad:new-command':
          'node scripts/architecture/bad/nonexistent.mjs --check',
      },
    }).join('\n'),
    /Broken npm script/
  ));

//===================================================================

test('layout checker rejects all write and ambiguous modes', () => {
  assert.doesNotThrow(() => parseArgs(['--check']));

  for (const a of [[], ['--apply'], ['--dry-run'], ['--check', '--apply']])
    assert.throws(() => parseArgs(a));
});
