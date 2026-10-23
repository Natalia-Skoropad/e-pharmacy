import assert from 'node:assert/strict';
import test from 'node:test';
import { Types } from 'mongoose';

import { Position } from './position.model';

//===============================================================

test('Position normalizes name and case-insensitive uniqueness key', async () => {
  const actorId = new Types.ObjectId();
  const position = new Position({
    name: '  Content  manager  ',
    normalizedName: 'ignored input',
    createdBy: actorId,
    updatedBy: actorId,
  });

  await position.validate();

  assert.equal(position.name, 'Content  manager');
  assert.equal(position.normalizedName, 'content manager');
});

//===============================================================

test('Position rejects invalid names and has unique normalizedName index', async () => {
  const actorId = new Types.ObjectId();
  const invalid = new Position({
    name: 'content manager',
    createdBy: actorId,
    updatedBy: actorId,
  });

  await assert.rejects(invalid.validate(), /uppercase letter/i);

  type SchemaIndex = readonly [
    Record<string, number | string>,
    Readonly<{ unique?: boolean }>,
  ];

  const index = (Position.schema.indexes() as SchemaIndex[]).find(
    ([keys]) => keys.normalizedName === 1 && Object.keys(keys).length === 1
  );

  assert.ok(index);
  assert.equal(index[1].unique, true);
});
