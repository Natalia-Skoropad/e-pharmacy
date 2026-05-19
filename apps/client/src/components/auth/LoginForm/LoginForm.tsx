'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type ChangeEvent, type FormEvent } from 'react';

import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/common';
import { useAuth } from '@/providers';
import { useToast } from '@/hooks';

import { getAuthErrorMessage } from '@/lib/auth';
import { ROUTES } from '@/lib/constants/routes';
import { getSafeRedirectPath } from '@/lib/routes';
import {
  EMAIL_MAX_LENGTH,
  LOGIN_INITIAL_VALUES,
  PASSWORD_MAX_LENGTH,
  sanitizeEmail,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
} from '@/lib/validations/auth-validation';

import css from './LoginForm.module.css';

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
              aria-invalid={Boolean(touchedFields.email && errors.email)}
              aria-describedby="login-email-error"
              onChange={handleChange('email')}
            />
            <span className={css.inputCounter} aria-hidden="true">
              {values.email.length}/{EMAIL_MAX_LENGTH}
            </span>
          </div>

          <p className={css.error} id="login-email-error">
            {touchedFields.email ? (errors.email ?? '') : ''}
          </p>
        </div>

        <div className={css.field}>
          <div className={css.labelRow}>
            <label className={css.label} htmlFor="login-password">
              Password
            </label>

            <Link className={css.textButton} href={ROUTES.PASSWORD_RECOVERY}>
              Forgot password?
            </Link>
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
              aria-invalid={Boolean(touchedFields.password && errors.password)}
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
            {touchedFields.password ? (errors.password ?? '') : ''}
          </p>
        </div>
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
        <Link className={css.link} href={ROUTES.REGISTER}>
          Register
        </Link>
      </p>
    </form>
  );
}

export default LoginForm;
