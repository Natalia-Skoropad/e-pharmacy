import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

const loginSource = read('./AdminLoginForm.tsx');
const recoverySource = read('./AdminPasswordRecoveryForm.tsx');
const resetSource = read('./AdminResetPasswordForm.tsx');
const loginPageSource = read('../../app/(auth)/(guest)/login/page.tsx');

const recoveryPageSource = read(
  '../../app/(auth)/(guest)/password-recovery/page.tsx'
);

const resetPageSource = read('../../app/(auth)/reset-password/page.tsx');

//===================================================================

test('admin auth pages reuse the shared auth shell and stay noindex', () => {
  for (const source of [loginPageSource, recoveryPageSource, resetPageSource]) {
    assert.match(source, /AuthPageShell/);

    assert.match(
      source,
      /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/
    );
  }
});

//===================================================================

test('admin login fixes application to admin and has no registration flow', () => {
  assert.match(loginSource, /AuthFormLayout/);
  assert.match(loginSource, /application:\s*'admin'/);
  assert.match(loginSource, /ADMIN_ROUTES\.PASSWORD_RECOVERY/);
  assert.match(loginSource, /resolveAdminLoginDestination/);
  assert.doesNotMatch(loginSource, /REGISTER|\/register|RadioOption/);
});

//===================================================================

test('password recovery is single-flight and does not enumerate accounts', () => {
  assert.match(recoverySource, /application:\s*'admin'/);
  assert.match(recoverySource, /submitInFlightRef/);

  assert.match(
    recoverySource,
    /If an account with that email exists, you will receive password reset instructions/
  );

  assert.doesNotMatch(recoverySource, /does not exist|unknown admin/i);
});

//===================================================================

test('reset password uses the shared transient-token lifecycle and invalidates auth', () => {
  assert.match(resetSource, /captureResetPasswordToken/);
  assert.match(resetSource, /clearResetPasswordTokenFromHistoryState/);
  assert.match(resetSource, /submitInFlightRef/);
  assert.match(resetSource, /invalidateSession\('password_reset'\)/);
  assert.match(resetSource, /Password changed successfully/);

  assert.doesNotMatch(
    resetSource,
    /localStorage|sessionStorage|document\s*\.\s*cookie/
  );
});
