import nodemailer from 'nodemailer';

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

function hasSmtpConfig(): boolean {
  return Boolean(
    env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_FROM
  );
}

//===============================================================

const transporter = hasSmtpConfig()
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    })
  : null;

//===============================================================

export async function sendEmail(options: SendEmailOptions): Promise<void> {
  const fallbackLogPayload = {
    from: env.SMTP_FROM || 'not-configured',
    ...options,
  };

  if (!transporter || !env.SMTP_FROM) {
    logger.info('[email:local-preview]', fallbackLogPayload);
    return;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      ...options,
    });
  } catch (error) {
    logger.error('Email sending failed', error);
    logger.info('[email:fallback-preview]', fallbackLogPayload);
  }
}
