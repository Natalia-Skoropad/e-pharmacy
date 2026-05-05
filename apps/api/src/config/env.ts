import dotenv from 'dotenv';
import type { StringValue } from 'ms';

dotenv.config();

//===============================================================

type NodeEnv = 'development' | 'test' | 'production';

//===============================================================

function getNodeEnv(): NodeEnv {
  const value = process.env.NODE_ENV || 'development';

  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }

  return 'development';
}

//===============================================================

function getPort(): number {
  const value = process.env.PORT;

  if (!value) return 4000;

  const port = Number(value);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('PORT must be a positive number');
  }

  return port;
}

//===============================================================

function getRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

//===============================================================

export const env = {
  NODE_ENV: getNodeEnv(),
  PORT: getPort(),
  MONGODB_URI: getRequiredEnv('MONGODB_URI'),
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '7d') as StringValue,
} as const;
