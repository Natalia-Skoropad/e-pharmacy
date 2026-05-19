import nodemailer from 'nodemailer';

import { env } from '../config/env';
import { httpError } from './httpError';
import { logger } from './logger';
import { HTTP_STATUS } from '../constants/httpStatus';

//===============================================================

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

//===============================================================

function hasSmtpConfig(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASSWORD && env.SMTP_FROM);
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
  if (!transporter || !env.SMTP_FROM) {
    logger.info('[email:local-preview]', {
      from: env.SMTP_FROM || 'not-configured',
      ...options,
    });
    return;
  }

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      ...options,
    });
  } catch (error) {
    logger.error('Email sending failed', error);
    throw httpError(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to send the email, please try again later.'
    );
  }
}
