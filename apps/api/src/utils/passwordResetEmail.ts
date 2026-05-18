import { env } from '../config/env';

//===============================================================

type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

//===============================================================

function createPasswordResetEmail(input: PasswordResetEmailInput) {
  return {
    to: input.to,
    subject: 'Reset your E-PHARMACY password',
    text: [
      'Hello,',
      '',
      'We received a request to reset the password for your E-PHARMACY account.',
      'Click the link below and create a new password:',
      input.resetUrl,
      '',
      'This link can be used only once and expires soon.',
      'If you did not request a password reset, you can safely ignore this email.',
      '',
      'Thanks,',
      'The E-PHARMACY team',
    ].join('\n'),
  };
}

//===============================================================

export async function sendPasswordResetEmail(
  input: PasswordResetEmailInput
): Promise<void> {
  const email = createPasswordResetEmail(input);

  if (!env.PASSWORD_RESET_EMAIL_WEBHOOK_URL) {
    console.info('[password-reset-email]', email);
    return;
  }

  const response = await fetch(env.PASSWORD_RESET_EMAIL_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(email),
  });

  if (!response.ok) {
    console.error('Password reset email webhook failed', response.status);
  }
}
