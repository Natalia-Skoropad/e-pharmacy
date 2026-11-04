import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

//===================================================================

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8');

//===================================================================

test('private auth requests use a lightweight account projection without losing role/status validation', () => {
  const source = read('apps/api/src/services/auth/auth-profile.service.ts');
  assert.match(source, /includePictureUrl\?: boolean/);
  assert.match(source, /'_id name email phone address role status updatedAt'/);

  assert.match(
    source,
    /'_id name email phone address pictureUrl role status updatedAt'/
  );

  assert.match(source, /user\.status === USER_STATUSES\.BLOCKED/);
  assert.match(source, /toAuthUserResponse\(user\)/);
});

//===================================================================

test('the canonical /auth/current endpoint retains the user avatar', () => {
  const source = read('apps/api/src/middlewares/auth/auth.middleware.ts');

  assert.match(source, /includePictureUrl: req\.path === '\/current'/);
  assert.match(source, /req\.user = user/);

  assert.match(
    source,
    /assertActiveSessionService\(payload\.sessionId, payload\.userId\)/
  );

  assert.match(source, /verifyToken\(candidate\.token\)/);
});

//===================================================================

test('owner registry resolves owner by indexed id before role and blocked checks', () => {
  const source = read(
    'apps/api/src/services/pharmacies/owned-pharmacy-registry-read.service.ts'
  );

  const portion = source.slice(
    source.indexOf('function membershipStages('),
    source.indexOf('function searchConditions(')
  );

  const ownerMatch = portion.indexOf(
    "{ $match: { $expr: { $eq: ['$_id', '$$ownerId'] } } }"
  );

  const roleCheck = portion.indexOf('role: USER_ROLES.PHARMACY');

  assert.ok(ownerMatch >= 0 && roleCheck > ownerMatch);
  assert.match(portion, /status: \{ \$ne: USER_STATUSES\.BLOCKED \}/);

  assert.match(
    portion,
    /\{ ownerId: userId \}, \{ '_eligibleOwner\.0': \{ \$exists: true \} \}/
  );
});

//===================================================================

test('registry still validates the user and applies tenant scope ahead of pagination', () => {
  const source = read(
    'apps/api/src/services/pharmacies/owned-pharmacy-registry-read.service.ts'
  );

  assert.match(source, /async function assertRegistryUser\(userId: string\)/);
  assert.match(source, /await User\.exists\(/);
  assert.match(source, /\{ ownerId: userId \}, \{ managerUserIds: userId \}/);

  assert.match(
    source,
    /\.\.\.membershipStages\(userId\),\s*\{ \$match: registryFilters\(query\) \}/
  );
});
