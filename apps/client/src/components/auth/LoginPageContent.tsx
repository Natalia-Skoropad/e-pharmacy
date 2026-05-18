'use client';

import { useState } from 'react';

import AuthFormShell from './AuthFormShell';
import LoginForm from './LoginForm';

import {
  LOGIN_BENEFITS,
  LOGIN_DESCRIPTION,
  LOGIN_TITLE,
  PASSWORD_RECOVERY_BENEFITS,
  PASSWORD_RECOVERY_DESCRIPTION,
  PASSWORD_RECOVERY_TITLE,
} from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';

//===================================================================

type AuthMode = 'login' | 'forgot-password';

//===================================================================

function LoginPageContent() {
  const [mode, setMode] = useState<AuthMode>('login');

  const isForgotPasswordMode = mode === 'forgot-password';
  const title = isForgotPasswordMode ? PASSWORD_RECOVERY_TITLE : LOGIN_TITLE;
  const text = isForgotPasswordMode
    ? PASSWORD_RECOVERY_DESCRIPTION
    : LOGIN_DESCRIPTION;
  const descriptionItems = isForgotPasswordMode
    ? [...PASSWORD_RECOVERY_BENEFITS]
    : [...LOGIN_BENEFITS];

  return (
    <AuthFormShell
      title={title}
      text={text}
      descriptionItems={descriptionItems}
      breadcrumbs={createBreadcrumbs(title)}
    >
      <LoginForm mode={mode} onModeChange={setMode} />
    </AuthFormShell>
  );
}

export default LoginPageContent;
