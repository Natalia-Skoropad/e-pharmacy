import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const loginDestinationSource = read(
  '../../lib/auth/resolve-login-destination.ts'
);

const statusValuesSource = read(
  '../../../../../packages/config/src/users/domain-values.ts'
);

//===================================================================

test('Stage 13.12 sends every non-blocked pharmacy account, including new Owners, to the Pharmacy app', () => {
  const pharmacyBranchStart = loginDestinationSource.indexOf(
    "if (user.role === 'pharmacy')"
  );

  const clientBranchStart = loginDestinationSource.indexOf(
    "if (user.role !== 'client'",
    pharmacyBranchStart
  );

  const pharmacyBranch = loginDestinationSource.slice(
    pharmacyBranchStart,
    clientBranchStart
  );

  assert.ok(pharmacyBranchStart >= 0);
  assert.match(pharmacyBranch, /user\.status === 'blocked'/);
  assert.match(pharmacyBranch, /resolvePharmacyLoginDestination/);
  assert.doesNotMatch(pharmacyBranch, /status\s*(?:===|!==)\s*['"]active['"]/);
});

//===================================================================

test('Stage 13.12 does not leak pharmacy Owner new status into Client account status filters', () => {
  assert.match(
    statusValuesSource,
    /CLIENT_ACCOUNT_STATUSES\s*=\s*\[\s*'active',\s*'blocked'/
  );

  assert.match(
    statusValuesSource,
    /PHARMACY_OWNER_ACCOUNT_STATUSES\s*=\s*\[\s*'new',\s*'active',\s*'blocked'/
  );

  const clientStatusesStart = statusValuesSource.indexOf(
    'CLIENT_ACCOUNT_STATUSES'
  );

  const adminStatusesStart = statusValuesSource.indexOf(
    'ADMIN_ACCOUNT_STATUSES',
    clientStatusesStart
  );

  const clientStatuses = statusValuesSource.slice(
    clientStatusesStart,
    adminStatusesStart
  );

  assert.doesNotMatch(clientStatuses, /'new'/);
});
