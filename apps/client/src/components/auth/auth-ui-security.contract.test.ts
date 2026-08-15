import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readSource(relativeUrl: string): Promise<string> {
  return readFile(new URL(relativeUrl, import.meta.url), 'utf8');
}

//===================================================================

test('recovery and password-change UI never prefer arbitrary error.message copy', async () => {
  const [recoverySource, profileSource] = await Promise.all([
    readSource('./PasswordRecoveryForm/PasswordRecoveryForm.tsx'),
    readSource('../profile/ProfilePageContent/ProfilePageContent.tsx'),
  ]);

  assert.doesNotMatch(
    recoverySource,
    /error\s+instanceof\s+Error[\s\S]*?error\.message/
  );

  assert.match(
    recoverySource,
    /getClientAuthErrorMessage\(getAuthErrorCode\(error, 'forgot-password'\)\)/
  );

  assert.doesNotMatch(
    profileSource,
    /handleSavePassword[\s\S]*?error\s+instanceof\s+Error[\s\S]*?error\.message/
  );

  assert.match(
    profileSource,
    /setPasswordSubmitError\(message\)[\s\S]*?toast\.error\(message\)/
  );
});

//===================================================================

test('auth-sensitive submit handlers use synchronous refs before starting requests', async () => {
  const [recoverySource, resetSource, registerSource, profileSource] =
    await Promise.all([
      readSource('./PasswordRecoveryForm/PasswordRecoveryForm.tsx'),
      readSource('./ResetPasswordForm/ResetPasswordForm.tsx'),
      readSource('./RegisterForm/RegisterForm.tsx'),
      readSource('../profile/ProfilePageContent/ProfilePageContent.tsx'),
    ]);

  for (const source of [recoverySource, resetSource, registerSource]) {
    assert.match(source, /const submitInFlightRef = useRef\(false\)/);

    assert.match(
      source,
      /if \(submitInFlightRef\.current\) return;[\s\S]*?submitInFlightRef\.current = true/
    );

    assert.match(source, /submitInFlightRef\.current = false/);
  }

  assert.ok(
    registerSource.indexOf('submitInFlightRef.current = true') <
      registerSource.indexOf('await uploadRegistrationDocuments'),
    'registration mutex must be acquired before temporary document uploads'
  );

  assert.match(
    profileSource,
    /const profileMutationInFlightRef = useRef\(false\)/
  );

  assert.match(
    profileSource,
    /const passwordMutationInFlightRef = useRef\(false\)/
  );

  assert.match(
    profileSource,
    /const sessionMutationInFlightRef = useRef\(false\)/
  );

  assert.match(
    profileSource,
    /handleRevokeSession[\s\S]*?if \(sessionMutationInFlightRef\.current\) return;/
  );

  assert.match(
    profileSource,
    /handleLogoutAllSessions[\s\S]*?sessionMutationInFlightRef\.current/
  );
});
