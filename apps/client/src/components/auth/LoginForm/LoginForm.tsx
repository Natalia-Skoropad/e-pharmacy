'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';

import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/common';
import { useAuth } from '@/components/providers';

import { getAuthErrorMessage } from '@/lib/auth';
import { ROUTES } from '@/lib/constants/routes';
import { getSafeRedirectPath } from '@/lib/routes';
import {
  EMAIL_MAX_LENGTH,
  FORGOT_PASSWORD_INITIAL_VALUES,
  LOGIN_INITIAL_VALUES,
  PASSWORD_MAX_LENGTH,
  sanitizeEmail,
  validateForgotPasswordForm,
  validateLoginForm,
  type ForgotPasswordFormErrors,
  type ForgotPasswordFormValues,
  type LoginFormErrors,
  type LoginFormValues,
} from '@/lib/validations';
import { requestPasswordReset } from '@/services';

import css from './LoginForm.module.css';

//===================================================================

type AuthMode = 'login' | 'forgot-password';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { login, isAuthReady } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [values, setValues] = useState<LoginFormValues>(LOGIN_INITIAL_VALUES);
  const [forgotValues, setForgotValues] = useState<ForgotPasswordFormValues>(
    FORGOT_PASSWORD_INITIAL_VALUES
  );
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [forgotErrors, setForgotErrors] = useState<ForgotPasswordFormErrors>(
    {}
  );
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));

  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field === 'email'
          ? sanitizeEmail(event.target.value)
          : event.target.value;

      setValues((prev) => ({
        ...prev,
        [field]: nextValue,
      }));

      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));

      setSubmitError('');
      setSuccessMessage('');
    };

  const handleForgotEmailChange = (event: ChangeEvent<HTMLInputElement>) => {
    setForgotValues({ email: sanitizeEmail(event.target.value) });
    setForgotErrors({});
    setSubmitError('');
    setSuccessMessage('');
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
      setSuccessMessage('');

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

  const handleForgotPasswordSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const nextErrors = validateForgotPasswordForm(forgotValues);

    if (Object.keys(nextErrors).length > 0) {
      setForgotErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');
      setSuccessMessage('');

      await requestPasswordReset({ email: forgotValues.email.trim() });

      setSuccessMessage(
        'If this email exists, password recovery instructions were sent to it.'
      );
    } catch (error) {
      setSubmitError(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'forgot-password') {
    return (
      <form
        className={css.form}
        noValidate
        onSubmit={handleForgotPasswordSubmit}
      >
        <div className={css.fields}>
          <div className={css.field}>
            <label className={css.label} htmlFor="forgot-email">
              Email
            </label>

            <div className={css.inputWrap}>
              <input
                className={css.input}
                id="forgot-email"
                name="email"
                type="email"
                value={forgotValues.email}
                placeholder="example@mail.com"
                autoComplete="email"
                maxLength={EMAIL_MAX_LENGTH}
                aria-invalid={Boolean(forgotErrors.email)}
                aria-describedby="forgot-email-error"
                onChange={handleForgotEmailChange}
              />
              <span className={css.inputCounter} aria-hidden="true">
                {forgotValues.email.length}/{EMAIL_MAX_LENGTH}
              </span>
            </div>

            <p className={css.error} id="forgot-email-error">
              {forgotErrors.email ?? ''}
            </p>
          </div>
        </div>

        {submitError ? (
          <p className={css.submitError} role="alert">
            {submitError}
          </p>
        ) : null}

        {successMessage ? (
          <p className={css.successMessage} role="status">
            {successMessage}
          </p>
        ) : null}

        <Button type="submit" fullWidth disabled={isSubmitting || !isAuthReady}>
          {isSubmitting ? 'Sending...' : 'Send instructions'}
        </Button>

        <button
          className={css.textButton}
          type="button"
          onClick={() => {
            setMode('login');
            setSubmitError('');
            setSuccessMessage('');
          }}
        >
          Back to log in
        </button>
      </form>
    );
  }

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <div className={css.fields}>
        <div className={css.field}>
          <label className={css.label} htmlFor="login-email">
            Email
          </label>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="login-email"
              name="email"
              type="email"
              value={values.email}
              placeholder="example@mail.com"
              autoComplete="email"
              maxLength={EMAIL_MAX_LENGTH}
              aria-invalid={Boolean(errors.email)}
              aria-describedby="login-email-error"
              onChange={handleChange('email')}
            />
            <span className={css.inputCounter} aria-hidden="true">
              {values.email.length}/{EMAIL_MAX_LENGTH}
            </span>
          </div>

          <p className={css.error} id="login-email-error">
            {errors.email ?? ''}
          </p>
        </div>

        <div className={css.field}>
          <div className={css.labelRow}>
            <label className={css.label} htmlFor="login-password">
              Password
            </label>

            <button
              className={css.textButton}
              type="button"
              onClick={() => {
                setMode('forgot-password');
                setForgotValues({ email: values.email });
                setSubmitError('');
                setSuccessMessage('');
              }}
            >
              Forgot password?
            </button>
          </div>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="login-password"
              name="password"
              type={isPasswordVisible ? 'text' : 'password'}
              value={values.password}
              placeholder="Enter your password"
              autoComplete="current-password"
              maxLength={PASSWORD_MAX_LENGTH}
              aria-invalid={Boolean(errors.password)}
              aria-describedby="login-password-error"
              onChange={handleChange('password')}
            />
            <span className={css.passwordCounter} aria-hidden="true">
              {values.password.length}/{PASSWORD_MAX_LENGTH}
            </span>
            <button
              className={css.eyeButton}
              type="button"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              onClick={() => setIsPasswordVisible((prev) => !prev)}
            >
              {isPasswordVisible ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>

          <p className={css.error} id="login-password-error">
            {errors.password ?? ''}
          </p>
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
