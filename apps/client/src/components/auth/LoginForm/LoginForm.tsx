'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ChangeEvent } from 'react';

import { Button } from '@/components/common';
import { useAuth } from '@/components/providers';

import { ROUTES } from '@/lib/constants/routes';
import {
  LOGIN_INITIAL_VALUES,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
} from '@/lib/validations';

import { getAuthErrorMessage } from '@/lib/auth';

import css from './LoginForm.module.css';

//===================================================================

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { login, isAuthenticated, isAuthReady } = useAuth();

  const [values, setValues] = useState<LoginFormValues>(LOGIN_INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    const redirect = searchParams.get('redirect');

    if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
      return ROUTES.PROFILE;
    }

    return redirect;
  }, [searchParams]);

  useEffect(() => {
    if (!isAuthReady || !isAuthenticated) return;

    router.replace(redirectTo);
  }, [isAuthReady, isAuthenticated, redirectTo, router]);

  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((prev) => ({
        ...prev,
        [field]: event.target.value,
      }));

      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));

      setSubmitError('');
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateLoginForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      await login({
        email: values.email.trim(),
        password: values.password.trim(),
      });

      router.replace(redirectTo);
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <div className={css.head}>
        <h2 className={css.title}>Welcome back</h2>
        <p className={css.text}>
          Log in to continue managing your E-PHARMACY account.
        </p>
      </div>

      <div className={css.fields}>
        <div className={css.field}>
          <label className={css.label} htmlFor="login-email">
            Email
          </label>

          <input
            className={css.input}
            id="login-email"
            name="email"
            type="email"
            value={values.email}
            placeholder="example@mail.com"
            autoComplete="email"
            maxLength={80}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'login-email-error' : undefined}
            onChange={handleChange('email')}
          />

          {errors.email ? (
            <p className={css.error} id="login-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="login-password">
            Password
          </label>

          <input
            className={css.input}
            id="login-password"
            name="password"
            type="password"
            value={values.password}
            placeholder="Enter your password"
            autoComplete="current-password"
            maxLength={64}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'login-password-error' : undefined
            }
            onChange={handleChange('password')}
          />

          {errors.password ? (
            <p className={css.error} id="login-password-error">
              {errors.password}
            </p>
          ) : null}
        </div>
      </div>

      {submitError ? (
        <p className={css.submitError} role="alert">
          {submitError}
        </p>
      ) : null}

      <Button type="submit" fullWidth disabled={isSubmitting || !isAuthReady}>
        {isSubmitting ? 'Logging in...' : 'Log in'}
      </Button>

      <p className={css.footerText}>
        Don&apos;t have an account yet?{' '}
        <Link className={css.link} href={ROUTES.REGISTER}>
          Register
        </Link>
      </p>
    </form>
  );
}

export default LoginForm;
