import dotenv from 'dotenv';
import type { StringValue } from 'ms';

//===============================================================

dotenv.config();

//===============================================================

type NodeEnv = 'development' | 'test' | 'production';
type AuthCookieSameSite = 'lax' | 'strict' | 'none';

//===============================================================

const LOCAL_CLIENT_URL = 'http://localhost:3000';
const LOCAL_ADMIN_URL = 'http://localhost:3001';
const LOCAL_PHARMACY_URL = 'http://localhost:3002';
const PRODUCTION_CLIENT_URL = 'https://e-pharmacy-client-ten.vercel.app';

//===============================================================

const CLIENT_ORIGIN_ENV_NAMES = [
  'CLIENT_ORIGINS',
  'CORS_ORIGIN',
  'CLIENT_URL',
  'FRONTEND_URL',
  'FRONTEND_DOMAIN',
] as const;

//===============================================================

function getNodeEnv(): NodeEnv {
  const value = process.env.NODE_ENV || 'development';

  if (value === 'development' || value === 'test' || value === 'production') {
    return value;
  }

  return 'development';
}

//===============================================================

const NODE_ENV = getNodeEnv();

//===============================================================

function getAuthCookieSameSite(): AuthCookieSameSite {
  const value = process.env.AUTH_COOKIE_SAME_SITE || 'lax';

  if (value === 'lax' || value === 'strict' || value === 'none') {
    return value;
  }

  throw new Error('AUTH_COOKIE_SAME_SITE must be lax, strict, or none');
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

function getFallbackClientUrl(): string {
  return NODE_ENV === 'production' ? PRODUCTION_CLIENT_URL : LOCAL_CLIENT_URL;
}

//===============================================================

function getEnvValue(names: readonly string[]): string | undefined {
  return names.map((name) => process.env[name]).find(Boolean);
}

//===============================================================

function getLocalClientOrigins(): string[] {
  return [LOCAL_CLIENT_URL, LOCAL_ADMIN_URL, LOCAL_PHARMACY_URL];
}

//===============================================================

function uniqueOrigins(origins: string[]): string[] {
  return Array.from(new Set(origins.filter(Boolean)));
}

//===============================================================

function getClientOrigins(): string[] {
  const value = getEnvValue(CLIENT_ORIGIN_ENV_NAMES);
  const configuredOrigins = value
    ? value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [getFallbackClientUrl()];

  return uniqueOrigins(
    NODE_ENV === 'production'
      ? configuredOrigins
      : [...configuredOrigins, ...getLocalClientOrigins()]
  );
}

//===============================================================

function getClientAppUrl(): string {
  return (
    process.env.CLIENT_APP_URL ||
    process.env.CLIENT_URL ||
    process.env.FRONTEND_URL ||
    process.env.FRONTEND_DOMAIN ||
    getFallbackClientUrl()
  );
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

function getOptionalNumberListEnv(name: string): number[] {
  const value = process.env[name];

  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const numberValue = Number(item);

      if (!Number.isInteger(numberValue) || numberValue <= 0) {
        throw new Error(`${name} must contain positive numbers only`);
      }

      return numberValue;
    });
}

//===============================================================

export const env = {
  NODE_ENV,
  PORT: getPort(),
  MONGODB_URI: getRequiredEnv('MONGODB_URI'),
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN || '15m') as StringValue,

  JWT_RESET_EXPIRES_IN: (process.env.JWT_RESET_EXPIRES_IN ||
    '15m') as StringValue,

  REFRESH_TOKEN_EXPIRES_IN: (process.env.REFRESH_TOKEN_EXPIRES_IN ||
    '30d') as StringValue,

  SESSION_ABSOLUTE_EXPIRES_IN: (process.env.SESSION_ABSOLUTE_EXPIRES_IN ||
    '90d') as StringValue,

  CLIENT_ORIGINS: getClientOrigins(),
  CLIENT_APP_URL: getClientAppUrl(),
  PHARMACY_APP_URL: process.env.PHARMACY_APP_URL,
  ADMIN_APP_URL: process.env.ADMIN_APP_URL,
  AUTH_COOKIE_DOMAIN: process.env.AUTH_COOKIE_DOMAIN,
  AUTH_COOKIE_SAME_SITE: getAuthCookieSameSite(),

  BFF_PROXY_SECRET:
    NODE_ENV === 'production'
      ? getRequiredEnv('BFF_PROXY_SECRET').trim()
      : process.env.BFF_PROXY_SECRET?.trim(),

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: getOptionalNumberEnv('SMTP_PORT', 587),
  SMTP_FALLBACK_PORTS: getOptionalNumberListEnv('SMTP_FALLBACK_PORTS'),
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  SMTP_FROM: process.env.SMTP_FROM,
} as const;
