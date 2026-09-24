'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/react';
import { AuthFormLayout } from '@e-pharmacy/ui/auth';
import { useToast } from '@e-pharmacy/ui/feedback';
import { EmailInput, PasswordInput } from '@e-pharmacy/ui/forms';
import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';

import {
  LOGIN_FORM_FIELDS,
  LOGIN_INITIAL_VALUES,
  USER_EMAIL_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  hasValidationErrors,
  isLoginFormValid,
  markAllFieldsTouched,
  normalizeEmail,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
  type LoginTouchedFields,
} from '@e-pharmacy/validation/auth';

import { getAdminAuthErrorMessage } from '@/lib/auth/admin-auth-error-messages';
import { resolveAdminLoginDestination } from '@/lib/auth/resolve-login-destination';
import { ADMIN_ROUTES } from '@/lib/routes';

import css from './AdminAuthForm.module.css';

//===================================================================

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isBootstrapping } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState<LoginFormValues>(LOGIN_INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<LoginTouchedFields>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const formIsValid = isLoginFormValid(values);

  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field === 'email'
          ? normalizeEmail(event.target.value)
          : event.target.value;

      const nextValues = { ...values, [field]: nextValue };
      const nextErrors = validateLoginForm(nextValues);

      setValues(nextValues);
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateLoginForm(values);

    if (!login) {
      toast.error('Admin login is temporarily unavailable.');
      return;
    }

    if (hasValidationErrors(nextErrors)) {
      setTouchedFields(markAllFieldsTouched(LOGIN_FORM_FIELDS));
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const user = await login({
        email: values.email.trim(),
        password: values.password,
        application: 'admin',
      });

      if (!user) return;

      router.replace(
        resolveAdminLoginDestination(searchParams.get('redirect'))
      );
    } catch (error) {
      toast.error(getAdminAuthErrorMessage(getAuthErrorCode(error, 'login')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout title="Admin login" noValidate onSubmit={handleSubmit}>
      <div className={css.fields}>
        <EmailInput
          id="admin-login-email"
          name="email"
          value={values.email}
          error={errors.email}
          isTouched={touchedFields.email}
          maxLength={USER_EMAIL_MAX_LENGTH}
          onChange={handleChange('email')}
        />

        <PasswordInput
          id="admin-login-password"
          name="password"
          value={values.password}
          autoComplete="current-password"
          error={errors.password}
          isTouched={touchedFields.password}
          isVisible={isPasswordVisible}
          maxLength={USER_PASSWORD_MAX_LENGTH}
          labelAction={
            <TextActionButton href={ADMIN_ROUTES.PASSWORD_RECOVERY}>
              Forgot password?
            </TextActionButton>
          }
          onChange={handleChange('password')}
          onToggleVisibility={() => setIsPasswordVisible((prev) => !prev)}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isSubmitting || isBootstrapping || !formIsValid}
      >
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </Button>
    </AuthFormLayout>
  );
}
