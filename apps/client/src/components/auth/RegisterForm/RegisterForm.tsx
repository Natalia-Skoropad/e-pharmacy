'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type ChangeEvent } from 'react';

import { Button } from '@/components/common';
import { useAuth } from '@/components/providers';

import { getAuthErrorMessage } from '@/lib/auth';
import { ROUTES } from '@/lib/constants/routes';
import { getSafeRedirectPath } from '@/lib/routes';
import {
  REGISTER_INITIAL_VALUES,
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

  const redirectTo = getSafeRedirectPath(searchParams.get('redirect'));

  const handleChange =
    (field: keyof RegisterFormValues) =>
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

    const nextErrors = validateRegisterForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const phone = values.phone.trim();

    try {
      setIsSubmitting(true);
      setSubmitError('');

      await register({
        name: values.name.trim(),
        email: values.email.trim(),
        password: values.password,
        phone: phone || undefined,
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
        <h2 className={css.title}>Create account</h2>
        <p className={css.text}>
          Register to save your profile and manage your pharmacy orders.
        </p>
      </div>

      <div className={css.fields}>
        <div className={css.field}>
          <label className={css.label} htmlFor="register-name">
            Name
          </label>

          <input
            className={css.input}
            id="register-name"
            name="name"
            type="text"
            value={values.name}
            placeholder="Your name"
            autoComplete="name"
            maxLength={64}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'register-name-error' : undefined}
            onChange={handleChange('name')}
          />

          {errors.name ? (
            <p className={css.error} id="register-name-error">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="register-email">
            Email
          </label>

          <input
            className={css.input}
            id="register-email"
            name="email"
            type="email"
            value={values.email}
            placeholder="example@mail.com"
            autoComplete="email"
            maxLength={254}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'register-email-error' : undefined}
            onChange={handleChange('email')}
          />

          {errors.email ? (
            <p className={css.error} id="register-email-error">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="register-phone">
            Phone <span className={css.optional}>(optional)</span>
          </label>

          <input
            className={css.input}
            id="register-phone"
            name="phone"
            type="tel"
            value={values.phone}
            placeholder="+380..."
            autoComplete="tel"
            maxLength={20}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'register-phone-error' : undefined}
            onChange={handleChange('phone')}
          />

          {errors.phone ? (
            <p className={css.error} id="register-phone-error">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="register-password">
            Password
          </label>

          <input
            className={css.input}
            id="register-password"
            name="password"
            type="password"
            value={values.password}
            placeholder="Create password"
            autoComplete="new-password"
            maxLength={64}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={
              errors.password ? 'register-password-error' : undefined
            }
            onChange={handleChange('password')}
          />

          {errors.password ? (
            <p className={css.error} id="register-password-error">
              {errors.password}
            </p>
          ) : null}
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="register-confirm-password">
            Confirm password
          </label>

          <input
            className={css.input}
            id="register-confirm-password"
            name="confirmPassword"
            type="password"
            value={values.confirmPassword}
            placeholder="Repeat password"
            autoComplete="new-password"
            maxLength={64}
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={
              errors.confirmPassword
                ? 'register-confirm-password-error'
                : undefined
            }
            onChange={handleChange('confirmPassword')}
          />

          {errors.confirmPassword ? (
            <p className={css.error} id="register-confirm-password-error">
              {errors.confirmPassword}
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
