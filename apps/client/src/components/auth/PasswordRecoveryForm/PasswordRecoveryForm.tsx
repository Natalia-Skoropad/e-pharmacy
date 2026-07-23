'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';

import { Button, TextActionButton } from '@e-pharmacy/ui/primitives';
import { RadioOption } from '@e-pharmacy/ui/forms';
import { EmailInput } from '@e-pharmacy/ui/forms';
import { useToast } from '@e-pharmacy/ui/feedback';
import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/core';

import {
  FORGOT_PASSWORD_FORM_FIELDS,
  USER_EMAIL_MAX_LENGTH,
  FORGOT_PASSWORD_INITIAL_VALUES,
  hasValidationErrors,
  isForgotPasswordFormValid,
  markAllFieldsTouched,
  normalizeEmail,
  validateForgotPasswordForm,
  type ForgotPasswordFormErrors,
  type ForgotPasswordFormValues,
  type ForgotPasswordTouchedFields,
} from '@e-pharmacy/validation/auth';

import { getClientAuthErrorMessage } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';
import { requestPasswordReset } from '@/lib/api/browser';

import css from '../shared/AuthForm.module.css';

//===================================================================

type RecoveryAccountType = 'client' | 'pharmacy';

//===================================================================

const RECOVERY_COPY: Record<
  RecoveryAccountType,
  { title: string; text: string }
> = {
  client: {
    title: 'Client account',
    text: 'Enter the email from your personal account. We will send a reset link for your client login, saved orders, favorites, and profile access.',
  },

  pharmacy: {
    title: 'Pharmacy owner account',
    text: 'Enter the email from your pharmacy owner account. We will send a reset link for access to the pharmacy dashboard.',
  },
};

//===================================================================

function PasswordRecoveryForm() {
  const toast = useToast();
  const { isAuthReady } = useAuth();

  const [accountType, setAccountType] = useState<RecoveryAccountType>('client');

  const [values, setValues] = useState<ForgotPasswordFormValues>(
    FORGOT_PASSWORD_INITIAL_VALUES
  );

  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});

  const [touchedFields, setTouchedFields] =
    useState<ForgotPasswordTouchedFields>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formIsValid = isForgotPasswordFormValid(values);
  const selectedCopy = RECOVERY_COPY[accountType];

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValues = {
      email: normalizeEmail(event.target.value),
    };

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

    try {
      setIsSubmitting(true);

      await requestPasswordReset({
        email: values.email.trim(),
        application: accountType,
      });

      setValues(FORGOT_PASSWORD_INITIAL_VALUES);
      setTouchedFields({});
      setErrors({});
      toast.success(
        'If an account with that email exists, you will receive password reset instructions shortly. Please check your inbox.'
      );
    } catch (error) {
      const fallbackMessage = getClientAuthErrorMessage(
        getAuthErrorCode(error, 'forgot-password')
      );
      const message =
        error instanceof Error && error.message
          ? error.message
          : fallbackMessage;

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <fieldset className={css.accountTypeGroup}>
        <legend className={css.visuallyHidden}>Account type</legend>
        <div className={css.accountTypeOptions}>
          <RadioOption
            name="recovery-account-type"
            value="client"
            checked={accountType === 'client'}
            label="I am a client"
            onChange={setAccountType}
          />
          <RadioOption
            name="recovery-account-type"
            value="pharmacy"
            checked={accountType === 'pharmacy'}
            label="I am a pharmacy owner"
            onChange={setAccountType}
          />
        </div>
      </fieldset>

      <div className={css.choiceInfo}>
        <p className={css.choiceTitle}>{selectedCopy.title}</p>
        <p className={css.choiceText}>{selectedCopy.text}</p>
      </div>

      <div className={css.fields}>
        <EmailInput
          className={css.fieldFull}
          id="recovery-email"
          name="email"
          value={values.email}
          error={errors.email}
          isTouched={touchedFields.email}
          maxLength={USER_EMAIL_MAX_LENGTH}
          onChange={handleChange}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isSubmitting || !isAuthReady || !formIsValid}
      >
        {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
      </Button>

      <p className={css.footerText}>
        Remember your password?{' '}
        <TextActionButton href={ROUTES.LOGIN}>Log in</TextActionButton>
      </p>
    </form>
  );
}

export default PasswordRecoveryForm;
