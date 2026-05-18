'use client';

import Link from 'next/link';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';

import { Eye, EyeOff } from 'lucide-react';

import { Button, Toast } from '@/components/common';
import { useAuth } from '@/components/providers';

import { getAuthErrorMessage } from '@/lib/auth';
import { ROUTES } from '@/lib/constants/routes';
import {
  EMAIL_MAX_LENGTH,
  FORGOT_PASSWORD_INITIAL_VALUES,
  PASSWORD_MAX_LENGTH,
  sanitizeEmail,
  validateForgotPasswordForm,
  type ForgotPasswordFormErrors,
  type ForgotPasswordFormValues,
} from '@/lib/validations';
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
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

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

  const handleChange =
    (field: keyof ForgotPasswordFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field === 'email'
          ? sanitizeEmail(event.target.value)
          : event.target.value;

      const nextValues = {
        ...values,
        [field]: nextValue,
      };
      const nextErrors = validateForgotPasswordForm(nextValues);

      setValues(nextValues);
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
      setToastMessage('');
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForgotPasswordForm(values);

    if (Object.keys(nextErrors).length > 0) {
      setTouchedFields({ email: true, password: true, confirmPassword: true });
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      setToastMessage('');

      await requestPasswordReset({
        email: values.email.trim(),
        newPassword: values.password,
      });

      setValues(FORGOT_PASSWORD_INITIAL_VALUES);
      setTouchedFields({});
      setErrors({});
      showToast(
        'Password was updated successfully. You can log in now.',
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
              onChange={handleChange('email')}
            />
            <span className={css.inputCounter} aria-hidden="true">
              {values.email.length}/{EMAIL_MAX_LENGTH}
            </span>
          </div>

          <p className={css.error} id="recovery-email-error">
            {touchedFields.email ? (errors.email ?? '') : ''}
          </p>
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="recovery-password">
            New password
          </label>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="recovery-password"
              name="password"
              type={isPasswordVisible ? 'text' : 'password'}
              value={values.password}
              placeholder="Create new password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              aria-invalid={Boolean(touchedFields.password && errors.password)}
              aria-describedby="recovery-password-error"
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

          <p className={css.error} id="recovery-password-error">
            {touchedFields.password ? (errors.password ?? '') : ''}
          </p>
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="recovery-confirm-password">
            Confirm password
          </label>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="recovery-confirm-password"
              name="confirmPassword"
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              value={values.confirmPassword}
              placeholder="Repeat new password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              aria-invalid={Boolean(
                touchedFields.confirmPassword && errors.confirmPassword
              )}
              aria-describedby="recovery-confirm-password-error"
              onChange={handleChange('confirmPassword')}
            />
            <span className={css.passwordCounter} aria-hidden="true">
              {values.confirmPassword.length}/{PASSWORD_MAX_LENGTH}
            </span>
            <button
              className={css.eyeButton}
              type="button"
              aria-label={
                isConfirmPasswordVisible ? 'Hide password' : 'Show password'
              }
              onClick={() => setIsConfirmPasswordVisible((prev) => !prev)}
            >
              {isConfirmPasswordVisible ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>

          <p className={css.error} id="recovery-confirm-password-error">
            {touchedFields.confirmPassword
              ? (errors.confirmPassword ?? '')
              : ''}
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
        {isSubmitting ? 'Updating password...' : 'Update password'}
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
