'use client';

import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';
import { PasswordInput } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/react';

import {
  RESET_PASSWORD_FORM_FIELDS,
  USER_PASSWORD_MAX_LENGTH,
  RESET_PASSWORD_INITIAL_VALUES,
  hasValidationErrors,
  isResetPasswordFormValid,
  markAllFieldsTouched,
  validateResetPasswordForm,
  type ResetPasswordFormErrors,
  type ResetPasswordFormValues,
  type ResetPasswordTouchedFields,
} from '@e-pharmacy/validation/auth';

import { getClientAuthErrorMessage } from '@/lib/auth';
import { captureResetPasswordToken } from '@/lib/auth/reset-password-token';
import { ROUTES } from '@/lib/routes';
import { resetPassword } from '@/lib/api/browser';

import css from '../shared/AuthForm.module.css';

//===================================================================

type ResetPasswordFormProps = {
  title: string;
  text: string;
};

//===================================================================

function ResetPasswordForm({ title, text }: ResetPasswordFormProps) {
  const toast = useToast();
  const router = useRouter();
  const { isBootstrapping, invalidateSession } = useAuth();

  const [values, setValues] = useState<ResetPasswordFormValues>(
    RESET_PASSWORD_INITIAL_VALUES
  );

  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});

  const [touchedFields, setTouchedFields] =
    useState<ResetPasswordTouchedFields>({});

  const [token] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;

    return captureResetPasswordToken(window.location.href).token;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  useEffect(() => {
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const captured = captureResetPasswordToken(window.location.href);

    if (captured.sanitizedUrl !== currentUrl) {
      window.history.replaceState(
        window.history.state,
        '',
        captured.sanitizedUrl
      );
    }
  }, []);

  const formIsValid = token !== null && isResetPasswordFormValid(values, token);

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

    if (token === null || !token || hasValidationErrors(nextErrors)) {
      setTouchedFields(markAllFieldsTouched(RESET_PASSWORD_FORM_FIELDS));
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      await resetPassword({
        token,
        newPassword: values.password,
      });

      invalidateSession('password_reset');
      setIsDone(true);
      setValues(RESET_PASSWORD_INITIAL_VALUES);
      setTouchedFields({});
      setErrors({});
      toast.success('Password changed successfully.');
    } catch (error) {
      toast.error(
        getClientAuthErrorMessage(getAuthErrorCode(error, 'reset-password'))
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className={css.form}>
        <div className={css.head}>
          <p className={css.text}>All set</p>
          <h1 className={css.title}>Password changed successfully</h1>
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
      <div className={css.head}>
        <h1 className={css.title}>{title}</h1>
        <p className={css.text}>{text}</p>
      </div>

      {token !== null && !token ? (
        <p className={css.submitError} role="alert">
          Password reset link is missing. Please request a new link.
        </p>
      ) : null}

      <div className={css.fields}>
        <PasswordInput
          id="reset-password"
          name="password"
          label="New password"
          value={values.password}
          placeholder="Create new password"
          autoComplete="new-password"
          error={errors.password}
          isTouched={touchedFields.password}
          isVisible={isPasswordVisible}
          maxLength={USER_PASSWORD_MAX_LENGTH}
          onChange={handleChange('password')}
          onToggleVisibility={() => setIsPasswordVisible((prev) => !prev)}
        />

        <PasswordInput
          id="reset-confirm-password"
          name="confirmPassword"
          label="Confirm password"
          value={values.confirmPassword}
          placeholder="Repeat new password"
          autoComplete="new-password"
          error={errors.confirmPassword}
          isTouched={touchedFields.confirmPassword}
          isVisible={isConfirmPasswordVisible}
          maxLength={USER_PASSWORD_MAX_LENGTH}
          onChange={handleChange('confirmPassword')}
          onToggleVisibility={() =>
            setIsConfirmPasswordVisible((prev) => !prev)
          }
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={
          token === null || isSubmitting || isBootstrapping || !formIsValid
        }
      >
        {isSubmitting ? 'Saving new password...' : 'Save new password'}
      </Button>

      <p className={css.footerText}>
        Need a fresh link?{' '}
        <TextActionButton href={ROUTES.PASSWORD_RECOVERY}>
          Send reset link again
        </TextActionButton>
      </p>
    </form>
  );
}

export default ResetPasswordForm;
