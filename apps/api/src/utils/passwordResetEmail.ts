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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\"', '&quot;')
    .replaceAll("'", '&#39;');
}

//===============================================================

function createPasswordResetEmailHtmlFallback(
  input: PasswordResetEmailInput
): string {
  const safeName = escapeHtml(input.name);
  const safeResetUrl = escapeHtml(input.resetUrl);

  return `<!doctype html>
<html lang="en">
  <body style="font-family: Arial, sans-serif; color: #111827; line-height: 1.5;">
    <h1 style="font-size: 24px; margin-bottom: 16px;">Reset your password</h1>
    <p>Hello, ${safeName}!</p>
    <p>We received a request to reset the password for your E-PHARMACY account.</p>
    <p>Open the link below and create a new password:</p>
    <p>
      <a href="${safeResetUrl}" style="color: #2f9e66;">Reset password</a>
    </p>
    <p>This link expires soon.</p>
    <p>If you did not request a password reset, you can safely ignore this email.</p>
  </body>
</html>`;
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
  try {
    const templatePath = await getResetPasswordTemplatePath();
    const templateSource = await fs.readFile(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);

    return template({
      name: input.name,
      link: input.resetUrl,
    });
  } catch {
    return createPasswordResetEmailHtmlFallback(input);
  }
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
