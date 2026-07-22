import assert from 'node:assert/strict';
import test from 'node:test';
import { z } from 'zod';

import {
  booleanQuerySchema,
  createPerPageSchema,
  mongoIdSchema,
  normalizePaginationQuery,
  optionalTrimmedTextSchema,
  positivePageSchema,
} from './index';

//===============================================================

test('shared ObjectId schema accepts only 24 hexadecimal characters', () => {
  assert.equal(
    mongoIdSchema.safeParse('507f1f77bcf86cd799439011').success,
    true
  );
  assert.equal(mongoIdSchema.safeParse('not-an-object-id').success, false);
});

//===============================================================

test('shared pagination schemas normalize aliases and preserve endpoint limits', () => {
  const schema = z.preprocess(
    normalizePaginationQuery,
    z.object({
      page: positivePageSchema,
      perPage: createPerPageSchema({ defaultValue: 20, max: 50 }),
    })
  );

  assert.deepEqual(schema.parse({ limit: '25', page: '2' }), {
    page: 2,
    perPage: 25,
  });

  assert.equal(schema.safeParse({ perPage: 51 }).success, false);
});

//===============================================================

test('shared boolean and optional text helpers normalize query values', () => {
  assert.equal(booleanQuerySchema.parse('true'), true);
  assert.equal(booleanQuerySchema.parse('false'), false);
  assert.equal(booleanQuerySchema.safeParse('yes').success, false);

  const optionalText = optionalTrimmedTextSchema({
    maxLength: 10,
    maxMessage: 'Too long',
  });

  assert.equal(optionalText.parse('   '), undefined);
  assert.equal(optionalText.parse('  value  '), 'value');
});
