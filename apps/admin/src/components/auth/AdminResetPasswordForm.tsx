'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';

import {
  captureResetPasswordToken,
  clearResetPasswordTokenFromHistoryState,
} from '@e-pharmacy/auth/reset-password';

import { useAuth } from '@e-pharmacy/auth/react';
import { AuthFormLayout } from '@e-pharmacy/ui/auth';
import { useToast } from '@e-pharmacy/ui/feedback';
import { PasswordInput } from '@e-pharmacy/ui/forms';
import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';

import {
  RESET_PASSWORD_FORM_FIELDS,
  RESET_PASSWORD_INITIAL_VALUES,
  USER_PASSWORD_MAX_LENGTH,
  hasValidationErrors,
  isResetPasswordFormValid,
  markAllFieldsTouched,
  validateResetPasswordForm,
  type ResetPasswordFormErrors,
  type ResetPasswordFormValues,
  type ResetPasswordTouchedFields,
} from '@e-pharmacy/validation/auth';

import { resetPassword } from '@/lib/api/browser/auth.api';
import { getAdminAuthErrorMessage } from '@/lib/auth/admin-auth-error-messages';
import { ADMIN_ROUTES } from '@/lib/routes';

import css from './AdminAuthForm.module.css';

//===================================================================

const subscribeToClientReady = () => () => undefined;
const getClientReadySnapshot = () => true;
const getServerReadySnapshot = () => false;

//===================================================================

export function AdminResetPasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const { isBootstrapping, invalidateSession } = useAuth();

  const [values, setValues] = useState<ResetPasswordFormValues>(
    RESET_PASSWORD_INITIAL_VALUES
  );

  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});

  const [touchedFields, setTouchedFields] =
    useState<ResetPasswordTouchedFields>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const submitInFlightRef = useRef(false);

  const isClientReady = useSyncExternalStore(
    subscribeToClientReady,
    getClientReadySnapshot,
    getServerReadySnapshot
  );

  const resetTokenCapture = useMemo(
    () =>
      isClientReady
        ? captureResetPasswordToken(window.location.href, window.history.state)
        : null,
    [isClientReady]
  );

  const token = resetTokenCapture?.token ?? null;

  useEffect(() => {
    if (!resetTokenCapture) return;

    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (
      resetTokenCapture.token ||
      resetTokenCapture.sanitizedUrl !== currentUrl
    ) {
      window.history.replaceState(
        resetTokenCapture.historyState,
        '',
        resetTokenCapture.sanitizedUrl
      );
    }
  }, [resetTokenCapture]);

  const formIsValid =
    isClientReady &&
    Boolean(token) &&
    isResetPasswordFormValid(values, token ?? '');

  const handleChange =
    (field: keyof ResetPasswordFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValues = { ...values, [field]: event.target.value };
      const nextErrors = validateResetPasswordForm(nextValues);

      setValues(nextValues);
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateResetPasswordForm(values);

    if (!token || hasValidationErrors(nextErrors)) {
      setTouchedFields(markAllFieldsTouched(RESET_PASSWORD_FORM_FIELDS));
      setErrors(nextErrors);
      return;
    }

    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;

    try {
      setIsSubmitting(true);

      await resetPassword({ token, newPassword: values.password });

      invalidateSession('password_reset');
      window.history.replaceState(
        clearResetPasswordTokenFromHistoryState(window.history.state),
        '',
        `${window.location.pathname}${window.location.search}${window.location.hash}`
      );

      setValues(RESET_PASSWORD_INITIAL_VALUES);
      setTouchedFields({});
      setErrors({});
      setIsDone(true);
      toast.success('Password changed successfully.');
    } catch (error) {
      toast.error(
        getAdminAuthErrorMessage(getAuthErrorCode(error, 'reset-password'))
      );
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className={css.result}>
        <div className={css.resultHead}>
          <p className={css.resultEyebrow}>All set</p>
          <h1 className={css.resultTitle}>Password changed successfully</h1>
          <p className={css.resultText}>
            Your admin password has been updated. You can now log in with the
            new password.
          </p>
        </div>

        <Button
          type="button"
          fullWidth
          onClick={() => router.replace(ADMIN_ROUTES.LOGIN)}
        >
          Continue to login
        </Button>
      </div>
    );
  }

  return (
    <AuthFormLayout
      title="Reset password"
      description="Create a new password for your admin account."
      noValidate
      onSubmit={handleSubmit}
      footer={
        <>
          Need a fresh link?{' '}
          <TextActionButton href={ADMIN_ROUTES.PASSWORD_RECOVERY}>
            Request a new reset link
          </TextActionButton>
        </>
      }
    >
      {isClientReady && !token ? (
        <p className={css.submitError} role="alert">
          Password reset link is missing or no longer available. Please request
          a new link.
        </p>
      ) : null}

      <div className={css.fields}>
        <PasswordInput
          id="admin-reset-password"
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
          id="admin-reset-confirm-password"
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
          !isClientReady ||
          !token ||
          isSubmitting ||
          isBootstrapping ||
          !formIsValid
        }
      >
        {isSubmitting ? 'Saving new password...' : 'Save new password'}
      </Button>
    </AuthFormLayout>
  );
}
