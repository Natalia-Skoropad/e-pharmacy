'use client';

import Link from 'next/link';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import { Button, Toast } from '@/components/common';
import { useAuth } from '@/components/providers';

import { getAuthErrorMessage } from '@/lib/auth';
import { ROUTES } from '@/lib/constants/routes';
import {
  EMAIL_MAX_LENGTH,
  FORGOT_PASSWORD_INITIAL_VALUES,
  sanitizeEmail,
  validateForgotPasswordForm,
  type ForgotPasswordFormErrors,
  type ForgotPasswordFormValues,
} from '@/lib/validations/auth-validation';
import { requestPasswordReset } from '@/services';

import css from '../LoginForm/LoginForm.module.css';

//===================================================================

function PasswordRecoveryForm() {
  const { isAuthReady } = useAuth();

  const [values, setValues] = useState<ForgotPasswordFormValues>(
    FORGOT_PASSWORD_INITIAL_VALUES
  );
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof ForgotPasswordFormValues, boolean>>
  >({});
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>(
    'success'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formIsValid =
    Object.keys(validateForgotPasswordForm(values)).length === 0;

  const showToast = (message: string, variant: 'success' | 'error') => {
    setToastMessage('');
    setToastVariant(variant);
    window.setTimeout(() => setToastMessage(message), 0);
  };

  useEffect(() => {
    if (!toastMessage) return undefined;

    const timeoutId = window.setTimeout(() => setToastMessage(''), 5000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValues = {
      email: sanitizeEmail(event.target.value),
    };
    const nextErrors = validateForgotPasswordForm(nextValues);

    setValues(nextValues);
    setTouchedFields({ email: true });
    setErrors((prev) => ({ ...prev, email: nextErrors.email }));
    setToastMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForgotPasswordForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setTouchedFields({ email: true });
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setToastMessage('');

      await requestPasswordReset({
        email: values.email.trim(),
      });

      setValues(FORGOT_PASSWORD_INITIAL_VALUES);
      setTouchedFields({});
      setErrors({});
      showToast(
        'If an account with that email exists, you will receive password reset instructions shortly. Please check your inbox.',
        'success'
      );
    } catch (error) {
      showToast(getAuthErrorMessage(error), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <div className={css.fields}>
        <div className={css.field}>
          <label className={css.label} htmlFor="recovery-email">
            Email
          </label>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="recovery-email"
              name="email"
              type="email"
              value={values.email}
              placeholder="example@mail.com"
              autoComplete="email"
              maxLength={EMAIL_MAX_LENGTH}
              aria-invalid={Boolean(touchedFields.email && errors.email)}
              aria-describedby="recovery-email-error"
              onChange={handleChange}
            />
            <span className={css.inputCounter} aria-hidden="true">
              {values.email.length}/{EMAIL_MAX_LENGTH}
            </span>
          </div>

          <p className={css.error} id="recovery-email-error">
            {touchedFields.email ? (errors.email ?? '') : ''}
          </p>
        </div>
      </div>

      <Toast
        message={toastMessage}
        isVisible={Boolean(toastMessage)}
        variant={toastVariant}
      />

      <Button
        type="submit"
        fullWidth
        disabled={isSubmitting || !isAuthReady || !formIsValid}
      >
        {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
      </Button>

      <p className={css.footerText}>
        Remember your password?{' '}
        <Link className={css.link} href={ROUTES.LOGIN}>
          Log in
        </Link>
      </p>
    </form>
  );
}

export default PasswordRecoveryForm;
