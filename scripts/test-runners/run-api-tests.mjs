import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

//===================================================================

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const genericRunnerPath = resolve(scriptDirectory, 'run-tsx-tests.mjs');
const argumentsList = process.argv.slice(2);

const isMongoIntegrationRun = argumentsList.some(
  (argument) =>
    argument.startsWith('--match=') &&
    argument
      .slice('--match='.length)
      .split(',')
      .includes('.integration.test.ts')
);

//===================================================================

if (isMongoIntegrationRun) {
  const envPath = resolve(process.cwd(), '.env');

  if (existsSync(envPath)) loadEnvFile(envPath);

  if (!process.env.E_PHARMACY_TEST_MONGODB_URI) {
    console.error(
      'Mongo integration tests require E_PHARMACY_TEST_MONGODB_URI ' +
        'in apps/api/.env or the process environment.'
    );

    process.exit(1);
  }
}

//===================================================================

const result = spawnSync(
  process.execPath,

  [genericRunnerPath, ...argumentsList],

  {
    cwd: process.cwd(),

    env: {
      ...process.env,
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/e-pharmacy-test',
      JWT_SECRET: 'test-jwt-secret',
      BFF_PROXY_SECRET: 'test-bff-secret',
    },

    stdio: 'inherit',
    shell: false,
  }
);

if (result.error) throw result.error;

process.exitCode = result.status ?? 1;
