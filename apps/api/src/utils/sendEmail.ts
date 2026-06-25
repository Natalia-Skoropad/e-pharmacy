import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

import { env } from '../config/env';
import { logger } from './logger';

//===============================================================

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

//===============================================================

const DEFAULT_BREVO_FALLBACK_PORTS = [2525, 465] as const;

const CONNECTION_ERROR_CODES = new Set([
  'CONN',
  'ECONNECTION',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ESOCKET',
  'ETIMEDOUT',
]);

//===============================================================

function hasSmtpConfig(): boolean {
  return Boolean(
    env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_FROM
  );
}

//===============================================================

function isBrevoSmtpHost(): boolean {
  return Boolean(env.SMTP_HOST?.toLowerCase().includes('brevo'));
}

//===============================================================

function getSmtpFallbackPorts(): number[] {
  const configuredPorts = env.SMTP_FALLBACK_PORTS;
  const defaultPorts = isBrevoSmtpHost() ? [...DEFAULT_BREVO_FALLBACK_PORTS] : [];

  return [...configuredPorts, ...defaultPorts].filter(
    (port, index, ports) => port !== env.SMTP_PORT && ports.indexOf(port) === index
  );
}

//===============================================================

function createSmtpTransport(port: number): Transporter {
  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port,
    secure: port === 465,

    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD,
    },

    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  } satisfies SMTPTransport.Options);
}

//===============================================================

function isConnectionError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;

  const code = 'code' in error ? String(error.code) : '';
  const command = 'command' in error ? String(error.command) : '';

  return CONNECTION_ERROR_CODES.has(code) || CONNECTION_ERROR_CODES.has(command);
}

//===============================================================

const primaryTransporter = hasSmtpConfig()
  ? createSmtpTransport(env.SMTP_PORT)
  : null;

//===============================================================

async function sendWithTransporter(
  transporter: Transporter,
  options: SendEmailOptions
): Promise<void> {
  if (!env.SMTP_FROM) return;

  await transporter.sendMail({
    from: env.SMTP_FROM,
    ...options,
  });
}

//===============================================================

async function sendViaSmtp(options: SendEmailOptions): Promise<void> {
  if (!primaryTransporter) return;

  try {
    await sendWithTransporter(primaryTransporter, options);
    return;
  } catch (error) {
    if (!isConnectionError(error)) {
      throw error;
    }

    logger.error(
      `[email] Primary SMTP connection failed on port ${env.SMTP_PORT}`,
      error
    );
  }

  const fallbackPorts = getSmtpFallbackPorts();

  for (const port of fallbackPorts) {
    const fallbackTransporter = createSmtpTransport(port);

    try {
      await sendWithTransporter(fallbackTransporter, options);
      logger.info(`[email] SMTP fallback succeeded on port ${port}`);
      return;
    } catch (error) {
      logger.error(`[email] SMTP fallback failed on port ${port}`, error);

      if (!isConnectionError(error)) {
        throw error;
      }
    } finally {
      fallbackTransporter.close();
    }
  }

  throw new Error('All configured SMTP transports failed');
}

//===============================================================

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const fallbackLogPayload = {
    from: env.SMTP_FROM || 'not-configured',
    ...options,
  };

  if (!primaryTransporter || !env.SMTP_FROM) {
    logger.info('[email:local-preview]', fallbackLogPayload);
    return;
  }

  try {
    await sendViaSmtp(options);
  } catch (error) {
    logger.error('Email sending failed', error);
    logger.info('[email:fallback-preview]', fallbackLogPayload);
  }
}
