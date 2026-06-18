'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, TextActionButton } from '@e-pharmacy/ui/common';
import { EmailInput, PasswordInput } from '@e-pharmacy/ui/form-fields';

import { useToast } from '@e-pharmacy/ui/feedback';
import { getAuthErrorMessage } from '@e-pharmacy/auth/errors';
import { ROUTES } from '@/lib/routes';
import { resolveLoginDestination } from '@/lib/auth';

import {
  LOGIN_FORM_FIELDS,
  LOGIN_INITIAL_VALUES,
  hasValidationErrors,
  isLoginFormValid,
  markAllFieldsTouched,
  sanitizeEmail,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
  type LoginTouchedFields,
} from '@e-pharmacy/validation';

import { useAuth } from '@e-pharmacy/auth/core';

import css from '../shared/AuthForm.module.css';

//===================================================================

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { login, isAuthReady } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState<LoginFormValues>(LOGIN_INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const [touchedFields, setTouchedFields] = useState<LoginTouchedFields>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const loginFormIsValid = isLoginFormValid(values);

  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field === 'email'
          ? sanitizeEmail(event.target.value)
          : event.target.value;

      const nextValues = {
        ...values,
        [field]: nextValue,
      };

      const nextErrors = validateLoginForm(nextValues);

      setValues(nextValues);
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      setErrors((prev: LoginFormErrors) => ({
        ...prev,
        [field]: nextErrors[field],
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateLoginForm(values);

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
      });

      if (!user) return;

      router.replace(
        resolveLoginDestination({
          user,
          requestedRedirect: searchParams.get('redirect'),
        })
      );
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <div className={css.fields}>
        <EmailInput
          id="login-email"
          name="email"
          value={values.email}
          error={errors.email}
          isTouched={touchedFields.email}
          onChange={handleChange('email')}
        />

        <PasswordInput
          id="login-password"
          name="password"
          value={values.password}
          autoComplete="current-password"
          error={errors.password}
          isTouched={touchedFields.password}
          isVisible={isPasswordVisible}
          labelAction={
            <TextActionButton href={ROUTES.PASSWORD_RECOVERY}>
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
        disabled={isSubmitting || !isAuthReady || !loginFormIsValid}
      >
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </Button>

      <p className={css.footerText}>
        Don&apos;t have an account yet?{' '}
        <TextActionButton href={ROUTES.REGISTER}>Register</TextActionButton>
      </p>
    </form>
  );
}

export default LoginForm;
