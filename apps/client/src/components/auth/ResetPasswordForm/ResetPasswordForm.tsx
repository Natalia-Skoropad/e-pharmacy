'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ChangeEvent, type FormEvent } from 'react';

import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/common';
import { useAuth } from '@/providers';
import { useToast } from '@/hooks';

import { getAuthErrorMessage } from '@/lib/auth';
import { ROUTES } from '@/lib/constants/routes';
import {
  PASSWORD_MAX_LENGTH,
  RESET_PASSWORD_INITIAL_VALUES,
  validateResetPasswordForm,
  type ResetPasswordFormErrors,
  type ResetPasswordFormValues,
} from '@/lib/validations/auth-validation';
import { resetPassword } from '@/services';

import css from '../LoginForm/LoginForm.module.css';

//===================================================================

type ResetPasswordFormProps = {
  token: string;
};

//===================================================================

function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const toast = useToast();
  const router = useRouter();
  const { isAuthReady } = useAuth();

  const [values, setValues] = useState<ResetPasswordFormValues>(
    RESET_PASSWORD_INITIAL_VALUES
  );
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<keyof ResetPasswordFormValues, boolean>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const formIsValid =
    Boolean(token) &&
    Object.keys(validateResetPasswordForm(values)).length === 0;

  const handleChange =
    (field: keyof ResetPasswordFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValues = {
        ...values,
        [field]: event.target.value,
      };
      const nextErrors = validateResetPasswordForm(nextValues);

      setValues(nextValues);
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateResetPasswordForm(values);

    if (!token || Object.keys(nextErrors).length > 0) {
      setTouchedFields({ password: true, confirmPassword: true });
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      await resetPassword({
        token,
        newPassword: values.password,
      });

      setIsDone(true);
      setValues(RESET_PASSWORD_INITIAL_VALUES);
      setTouchedFields({});
      setErrors({});
      toast.success('Password changed successfully.');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className={css.form}>
        <div className={css.head}>
          <p className={css.text}>All set</p>
          <h2 className={css.title}>Password changed successfully</h2>
          <p className={css.text}>
            Your password has been updated. You can now log in with your new
            password and continue using E-PHARMACY.
          </p>
        </div>

        <Button
          type="button"
          fullWidth
          onClick={() => router.replace(ROUTES.LOGIN)}
        >
          Continue
        </Button>
      </div>
    );
  }

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      {!token ? (
        <p className={css.submitError} role="alert">
          Password reset link is missing. Please request a new link.
        </p>
      ) : null}

      <div className={css.fields}>
        <div className={css.field}>
          <label className={css.label} htmlFor="reset-password">
            New password
          </label>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="reset-password"
              name="password"
              type={isPasswordVisible ? 'text' : 'password'}
              value={values.password}
              placeholder="Create new password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              aria-invalid={Boolean(touchedFields.password && errors.password)}
              aria-describedby="reset-password-error"
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

          <p className={css.error} id="reset-password-error">
            {touchedFields.password ? (errors.password ?? '') : ''}
          </p>
        </div>

        <div className={css.field}>
          <label className={css.label} htmlFor="reset-confirm-password">
            Confirm password
          </label>

          <div className={css.inputWrap}>
            <input
              className={css.input}
              id="reset-confirm-password"
              name="confirmPassword"
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              value={values.confirmPassword}
              placeholder="Repeat new password"
              autoComplete="new-password"
              maxLength={PASSWORD_MAX_LENGTH}
              aria-invalid={Boolean(
                touchedFields.confirmPassword && errors.confirmPassword
              )}
              aria-describedby="reset-confirm-password-error"
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

          <p className={css.error} id="reset-confirm-password-error">
            {touchedFields.confirmPassword
              ? (errors.confirmPassword ?? '')
              : ''}
          </p>
        </div>
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isSubmitting || !isAuthReady || !formIsValid}
      >
        {isSubmitting ? 'Saving new password...' : 'Save new password'}
      </Button>

      <p className={css.footerText}>
        Need a fresh link?{' '}
        <Link className={css.link} href={ROUTES.PASSWORD_RECOVERY}>
          Send reset link again
        </Link>
      </p>
    </form>
  );
}

export default ResetPasswordForm;
