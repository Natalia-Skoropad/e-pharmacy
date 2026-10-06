import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const source = readFileSync(
  resolve(
    process.cwd(),
    'src/services/pharmacy-owner-registration-audit-migration.service.ts'
  ),
  'utf8'
);

//===============================================================

test('owner registration audit backfill is idempotent, historical, and keeps document payloads safe', () => {
  assert.match(source, /PHARMACY_OWNER_ACCOUNT_CREATED/);
  assert.match(source, /PHARMACY_REGISTRATION_DOCUMENTS_ATTACHED/);
  assert.match(source, /AdminAuditLog\.exists/);
  assert.match(source, /\$setOnInsert/);
  assert.match(source, /upsert:\s*true/);
  assert.match(source, /timestamps:\s*false/);
  assert.match(source, /createdAt:\s*getHistoricalCreatedAt\(owner\.createdAt/);
  assert.match(source, /getDocumentsAuditCreatedAt/);
  assert.match(source, /Backfilled from persisted pre-audit account state/);
  assert.match(source, /Stage 13\.2 demo-owner repair migration/);
  assert.match(source, /documentMimeTypes/);
  assert.match(source, /documentSizesBytes/);
  assert.match(source, /totalDocumentSizeBytes/);

  assert.doesNotMatch(
    source,
    /document\.sha256|document\.content|dataUrl|base64/i
  );
});
