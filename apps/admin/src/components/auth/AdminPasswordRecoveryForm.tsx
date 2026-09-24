'use client';

import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { AuthFormLayout } from '@e-pharmacy/ui/auth';
import { useToast } from '@e-pharmacy/ui/feedback';
import { EmailInput } from '@e-pharmacy/ui/forms';
import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';

import {
  FORGOT_PASSWORD_FORM_FIELDS,
  FORGOT_PASSWORD_INITIAL_VALUES,
  USER_EMAIL_MAX_LENGTH,
  hasValidationErrors,
  isForgotPasswordFormValid,
  markAllFieldsTouched,
  normalizeEmail,
  validateForgotPasswordForm,
  type ForgotPasswordFormErrors,
  type ForgotPasswordFormValues,
  type ForgotPasswordTouchedFields,
} from '@e-pharmacy/validation/auth';

import { requestPasswordReset } from '@/lib/api/browser/auth.api';
import { getAdminAuthErrorMessage } from '@/lib/auth/admin-auth-error-messages';
import { ADMIN_ROUTES } from '@/lib/routes';

import css from './AdminAuthForm.module.css';

//===================================================================

const GENERIC_RECOVERY_SUCCESS =
  'If an account with that email exists, you will receive password reset instructions shortly. Please check your inbox.';

//===================================================================

export function AdminPasswordRecoveryForm() {
  const toast = useToast();

  const [values, setValues] = useState<ForgotPasswordFormValues>(
    FORGOT_PASSWORD_INITIAL_VALUES
  );

  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});

  const [touchedFields, setTouchedFields] =
    useState<ForgotPasswordTouchedFields>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);

  const formIsValid = isForgotPasswordFormValid(values);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValues = { email: normalizeEmail(event.target.value) };
    const nextErrors = validateForgotPasswordForm(nextValues);

    setValues(nextValues);
    setTouchedFields({ email: true });
    setErrors((prev) => ({ ...prev, email: nextErrors.email }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateForgotPasswordForm(values);

    if (hasValidationErrors(nextErrors)) {
      setTouchedFields(markAllFieldsTouched(FORGOT_PASSWORD_FORM_FIELDS));
      setErrors(nextErrors);
      return;
    }

    if (submitInFlightRef.current) return;
    submitInFlightRef.current = true;

    try {
      setIsSubmitting(true);

      await requestPasswordReset({
        email: values.email.trim(),
        application: 'admin',
      });

      setValues(FORGOT_PASSWORD_INITIAL_VALUES);
      setTouchedFields({});
      setErrors({});
      toast.success(GENERIC_RECOVERY_SUCCESS);
    } catch (error) {
      toast.error(
        getAdminAuthErrorMessage(getAuthErrorCode(error, 'forgot-password'))
      );
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormLayout
      noValidate
      onSubmit={handleSubmit}
      footer={
        <>
          Remember your password?{' '}
          <TextActionButton href={ADMIN_ROUTES.LOGIN}>Log in</TextActionButton>
        </>
      }
    >
      <div className={css.fields}>
        <EmailInput
          className={css.fieldFull}
          id="admin-recovery-email"
          name="email"
          value={values.email}
          error={errors.email}
          isTouched={touchedFields.email}
          maxLength={USER_EMAIL_MAX_LENGTH}
          onChange={handleChange}
        />
      </div>

      <Button type="submit" fullWidth disabled={isSubmitting || !formIsValid}>
        {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
      </Button>
    </AuthFormLayout>
  );
}
