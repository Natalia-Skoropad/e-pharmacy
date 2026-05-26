'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, TextActionButton } from '@/components/common';
import { EmailInput, PasswordInput } from '@/components/form-fields';

import { useToast } from '@/hooks';
import { getAuthErrorMessage } from '@/lib/auth';
import { ROUTES } from '@/lib/constants/routes';
import { getSafeRedirectPath } from '@/lib/routes';

import {
  LOGIN_INITIAL_VALUES,
  sanitizeEmail,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
} from '@/lib/validations/auth-validation';

import { useAuth } from '@/providers';

import css from '../shared/AuthForm.module.css';

//===================================================================

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { login, isAuthReady } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState<LoginFormValues>(LOGIN_INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof LoginFormValues, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));
  const loginFormIsValid = Object.keys(validateLoginForm(values)).length === 0;

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

    if (Object.keys(nextErrors).length > 0) {
      setTouchedFields({ email: true, password: true });
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      await login({
        email: values.email.trim(),
        password: values.password.trim(),
      });

      router.replace(redirectTo);
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
