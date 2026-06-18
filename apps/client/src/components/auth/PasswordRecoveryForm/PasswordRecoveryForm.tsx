'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Button, TextActionButton } from '@e-pharmacy/ui/common';
import { EmailInput } from '@e-pharmacy/ui/form-fields';
import { useToast } from '@e-pharmacy/ui/feedback';
import { getAuthErrorMessage } from '@e-pharmacy/auth/errors';
import { ROUTES } from '@/lib/routes';

import {
  FORGOT_PASSWORD_FORM_FIELDS,
  FORGOT_PASSWORD_INITIAL_VALUES,
  hasValidationErrors,
  isForgotPasswordFormValid,
  markAllFieldsTouched,
  sanitizeEmail,
  validateForgotPasswordForm,
  type ForgotPasswordFormErrors,
  type ForgotPasswordFormValues,
  type ForgotPasswordTouchedFields,
} from '@e-pharmacy/validation';

import { useAuth } from '@e-pharmacy/auth/core';
import { requestPasswordReset } from '@e-pharmacy/api-client/client';

import css from '../shared/AuthForm.module.css';

//===================================================================

function PasswordRecoveryForm() {
  const toast = useToast();
  const { isAuthReady } = useAuth();

  const [values, setValues] = useState<ForgotPasswordFormValues>(
    FORGOT_PASSWORD_INITIAL_VALUES
  );

  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});

  const [touchedFields, setTouchedFields] =
    useState<ForgotPasswordTouchedFields>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const formIsValid = isForgotPasswordFormValid(values);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValues = {
      email: sanitizeEmail(event.target.value),
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
        application: 'client',
      });

      setValues(FORGOT_PASSWORD_INITIAL_VALUES);
      setTouchedFields({});
      setErrors({});
      toast.success(
        'If an account with that email exists, you will receive password reset instructions shortly. Please check your inbox.'
      );
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <div className={css.fields}>
        <EmailInput
          id="recovery-email"
          name="email"
          value={values.email}
          error={errors.email}
          isTouched={touchedFields.email}
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
