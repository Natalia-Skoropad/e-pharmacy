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

function getClientOrigins(): string[] {
  const value = process.env.CLIENT_ORIGINS;

  if (!value) {
    return ['http://localhost:3000'];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

//===============================================================

function getOptionalNumberEnv(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) return fallback;

  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`${name} must be a positive number`);
  }

  return numberValue;
}

//===============================================================

export const env = {
  NODE_ENV: getNodeEnv(),
  PORT: getPort(),
  MONGODB_URI: getRequiredEnv('MONGODB_URI'),
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '7d') as StringValue,
  JWT_RESET_EXPIRES_IN: (process.env.JWT_RESET_EXPIRES_IN || '15m') as StringValue,
  CLIENT_ORIGINS: getClientOrigins(),
  CLIENT_APP_URL: process.env.CLIENT_APP_URL || 'http://localhost:3000',
  AUTH_COOKIE_DOMAIN: process.env.AUTH_COOKIE_DOMAIN,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: getOptionalNumberEnv('SMTP_PORT', 587),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,
} as const;
