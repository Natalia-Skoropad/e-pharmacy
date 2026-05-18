import fs from 'node:fs/promises';
import path from 'node:path';

import handlebars from 'handlebars';

import { sendEmail } from './sendEmail';

//===============================================================

type PasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

//===============================================================

function createPasswordResetEmailText(input: PasswordResetEmailInput): string {
  return [
    `Hello, ${input.name}!`,
    '',
    'We received a request to reset the password for your E-PHARMACY account.',
    'Open the link below and create a new password:',
    input.resetUrl,
    '',
    'This link expires soon.',
    'If you did not request a password reset, you can safely ignore this email.',
    '',
    'Thanks,',
    'The E-PHARMACY team',
  ].join('\n');
}

//===============================================================

async function getResetPasswordTemplatePath(): Promise<string> {
  const paths = [
    path.resolve(process.cwd(), 'dist/templates/reset-password-email.html'),
    path.resolve(process.cwd(), 'src/templates/reset-password-email.html'),
  ];

  for (const templatePath of paths) {
    try {
      await fs.access(templatePath);
      return templatePath;
    } catch {
      // Try the next path.
    }
  }

  return paths[paths.length - 1];
}

//===============================================================

async function createPasswordResetEmailHtml(
  input: PasswordResetEmailInput
): Promise<string> {
  const templatePath = await getResetPasswordTemplatePath();
  const templateSource = await fs.readFile(templatePath, 'utf-8');
  const template = handlebars.compile(templateSource);

  return template({
    name: input.name,
    link: input.resetUrl,
  });
}

//===============================================================

export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput
): Promise<void> {
  const html = await createPasswordResetEmailHtml(input);

  await sendEmail({
    to: input.to,
    subject: 'Reset your E-PHARMACY password',
    html,
    text: createPasswordResetEmailText(input),
  });
}
