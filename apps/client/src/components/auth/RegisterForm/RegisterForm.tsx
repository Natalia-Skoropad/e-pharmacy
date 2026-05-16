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
  CUSTOMER_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  REGISTER_INITIAL_VALUES,
  sanitizeCustomerName,
  sanitizeEmail,
  validateRegisterForm,
  type RegisterFormErrors,
  type RegisterFormValues,
} from '@/lib/validations';

import css from './RegisterForm.module.css';

//===================================================================

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, isAuthReady } = useAuth();

  const [values, setValues] = useState<RegisterFormValues>(
    REGISTER_INITIAL_VALUES
  );
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const nextValue =
        field === 'name'
          ? sanitizeCustomerName(rawValue)
          : field === 'email'
            ? sanitizeEmail(rawValue)
            : rawValue;

      setValues((prev) => ({
        ...prev,
        [field]: nextValue,
      }));

      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));

      setSubmitError('');
    };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateRegisterForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError('');

      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
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
      <div className={css.fields}>
        <div className={css.field}>
          <label className={css.label} htmlFor="register-name">
            Name
          </label>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="register-name"
              name="name"
              type="text"
              value={values.name}
              placeholder="Your name"
              autoComplete="name"
              maxLength={CUSTOMER_NAME_MAX_LENGTH}
              aria-invalid={Boolean(errors.name)}
              aria-describedby="register-name-error"
              onChange={handleChange('name')}
            />
            <span className={css.inputCounter} aria-hidden="true">
              {values.name.length}/{CUSTOMER_NAME_MAX_LENGTH}
            </span>
          </div>

          <p className={css.error} id="register-name-error">
            {errors.name ?? ''}
          </p>
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="register-email">
            Email
          </label>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="register-email"
              name="email"
              type="email"
              value={values.email}
              placeholder="example@mail.com"
              autoComplete="email"
              maxLength={EMAIL_MAX_LENGTH}
              aria-invalid={Boolean(errors.email)}
              aria-describedby="register-email-error"
              onChange={handleChange('email')}
            />
            <span className={css.inputCounter} aria-hidden="true">
              {values.email.length}/{EMAIL_MAX_LENGTH}
            </span>
          </div>

          <p className={css.error} id="register-email-error">
            {errors.email ?? ''}
          </p>
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="register-password">
            Password
          </label>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="register-password"
              name="password"
              type={isPasswordVisible ? 'text' : 'password'}
              value={values.password}
              placeholder="Create password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              aria-invalid={Boolean(errors.password)}
              aria-describedby="register-password-error"
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

          <p className={css.error} id="register-password-error">
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
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>

      <p className={css.footerText}>
        Already have an account?{' '}
        <Link className={css.link} href={ROUTES.LOGIN}>
          Log in
        </Link>
      </p>
    </form>
  );
}

export default RegisterForm;
