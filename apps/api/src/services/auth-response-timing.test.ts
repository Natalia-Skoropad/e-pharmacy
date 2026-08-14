import assert from 'node:assert/strict';
import test from 'node:test';

import {
  enforcePasswordResetResponseTiming,
  PASSWORD_RESET_JITTER_MS,
  PASSWORD_RESET_MIN_RESPONSE_MS,
} from './auth-response-timing';

//===============================================================

test('password recovery timing floor equalizes fast and slower account lookup paths without wall-clock sleeps', async () => {
  const startedAtMs = 1_000;
  const targetDurationMs =
    PASSWORD_RESET_MIN_RESPONSE_MS + Math.floor(PASSWORD_RESET_JITTER_MS / 2);

  async function run(simulatedWorkMs: number) {
    let nowMs = startedAtMs + simulatedWorkMs;
    const sleeps: number[] = [];

    await enforcePasswordResetResponseTiming(startedAtMs, {
      now: () => nowMs,
      random: () => 0.5,
      sleep: async (delayMs) => {
        sleeps.push(delayMs);
        nowMs += delayMs;
      },
    });

    return { nowMs, sleeps };
  }

  const unknownAccountPath = await run(0);
  const existingAccountPath = await run(120);

  assert.equal(unknownAccountPath.nowMs, startedAtMs + targetDurationMs);
  assert.equal(existingAccountPath.nowMs, startedAtMs + targetDurationMs);
  assert.ok(unknownAccountPath.sleeps[0] > existingAccountPath.sleeps[0]);
});

//===============================================================

test('password recovery timing floor never adds delay once real work exceeded the target', async () => {
  const sleeps: number[] = [];

  await enforcePasswordResetResponseTiming(1_000, {
    now: () =>
      1_000 + PASSWORD_RESET_MIN_RESPONSE_MS + PASSWORD_RESET_JITTER_MS + 1,
    random: () => 1,
    sleep: async (delayMs) => {
      sleeps.push(delayMs);
    },
  });

  assert.deepEqual(sleeps, []);
});
