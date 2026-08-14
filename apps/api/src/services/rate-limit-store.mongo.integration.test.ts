import assert from 'node:assert/strict';
import test from 'node:test';

import mongoose from 'mongoose';

import { RateLimitBucket } from '../models/rateLimitBucket.model';

import {
  createRateLimitWindow,
  getRateLimitCounter,
  incrementRateLimitCounter,
} from './rate-limit-store.service';

//===============================================================

const TEST_MONGODB_URI = process.env.E_PHARMACY_TEST_MONGODB_URI;
const shouldSkip = !TEST_MONGODB_URI;

//===============================================================

function getTestMongoUri(): string {
  if (!TEST_MONGODB_URI) {
    throw new Error(
      'E_PHARMACY_TEST_MONGODB_URI is required for Mongo integration tests.'
    );
  }

  return TEST_MONGODB_URI;
}

//===============================================================

test(
  'distributed auth rate-limit callers share one Mongo counter without storing the raw key',
  { skip: shouldSkip },
  async () => {
    await mongoose.connect(getTestMongoUri());

    const policy = `test-login-account-${new mongoose.Types.ObjectId()}`;
    const rawKey = 'email:owner@example.com';
    const nowMs = Date.now();
    const window = createRateLimitWindow(policy, rawKey, nowMs);

    try {
      const replicaA = await incrementRateLimitCounter(policy, rawKey, nowMs);
      const replicaB = await incrementRateLimitCounter(policy, rawKey, nowMs);
      const observed = await getRateLimitCounter(policy, rawKey, nowMs);

      assert.equal(replicaA.hits, 1);
      assert.equal(replicaB.hits, 2);
      assert.equal(observed.hits, 2);
      assert.equal(replicaA.window.id, replicaB.window.id);
      assert.equal(window.id.length, 64);
      assert.equal(window.id.includes('owner@example.com'), false);

      const persisted = await RateLimitBucket.findById(window.id).lean<{
        hits: number;
      } | null>();

      assert.equal(persisted?.hits, 2);
    } finally {
      await RateLimitBucket.deleteOne({ _id: window.id });
      await mongoose.disconnect();
    }
  }
);
