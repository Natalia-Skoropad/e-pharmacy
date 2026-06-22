'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, TextActionButton } from '@e-pharmacy/ui/common';
import { useToast } from '@e-pharmacy/ui/feedback';

import {
  EmailInput,
  NameInput,
  PasswordInput,
  PhoneInput,
} from '@e-pharmacy/ui/form-fields';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/core';

import {
  REGISTER_FORM_FIELDS,
  USER_EMAIL_MAX_LENGTH,
  USER_NAME_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  USER_PHONE_MAX_LENGTH,
  REGISTER_INITIAL_VALUES,
  hasValidationErrors,
  isRegisterFormValid,
  markAllFieldsTouched,
  sanitizeName,
  sanitizePhone,
  sanitizeEmail,
  sanitizePassword,
  validateRegisterForm,
  type RegisterFormErrors,
  type RegisterFormValues,
  type RegisterTouchedFields,
} from '@e-pharmacy/validation';

import { getClientAuthErrorMessage, resolveLoginDestination } from '@/lib/auth';
import { ROUTES } from '@/lib/routes';

import css from '../shared/AuthForm.module.css';

//===================================================================

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { register, isAuthReady } = useAuth();
  const toast = useToast();

  const [values, setValues] = useState<RegisterFormValues>(
    REGISTER_INITIAL_VALUES,
  );

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [touchedFields, setTouchedFields] = useState<RegisterTouchedFields>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const registerFormIsValid = isRegisterFormValid(values);

  const handleChange =
    (field: keyof RegisterFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const nextValue =
        field === 'name'
          ? sanitizeName(rawValue)
          : field === 'email'
            ? sanitizeEmail(rawValue)
            : field === 'phone'
              ? sanitizePhone(rawValue)
              : sanitizePassword(rawValue);

      const nextValues = {
        ...values,
        [field]: nextValue,
      };

      const nextErrors = validateRegisterForm(nextValues);

      setValues(nextValues);
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      setErrors((prev: RegisterFormErrors) => ({
        ...prev,
        [field]: nextErrors[field],
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateRegisterForm(values);

    if (!register) {
      toast.error('Registration is not available for this app.');
      return;
    }

    if (hasValidationErrors(nextErrors)) {
      setTouchedFields(markAllFieldsTouched(REGISTER_FORM_FIELDS));
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const user = await register({
        name: values.name.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
        role: 'client',
      });

      router.replace(
        user
          ? resolveLoginDestination({
              user,
              requestedRedirect: searchParams.get('redirect'),
            })
          : ROUTES.PROFILE,
      );
    } catch (error) {
      toast.error(
        getClientAuthErrorMessage(getAuthErrorCode(error, 'register')),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <div className={css.fields}>
        <NameInput
          id="register-name"
          name="name"
          value={values.name}
          error={errors.name}
          isTouched={touchedFields.name}
          maxLength={USER_NAME_MAX_LENGTH}
          onChange={handleChange('name')}
        />

        <EmailInput
          id="register-email"
          name="email"
          value={values.email}
          error={errors.email}
          isTouched={touchedFields.email}
          maxLength={USER_EMAIL_MAX_LENGTH}
          onChange={handleChange('email')}
        />

        <PhoneInput
          id="register-phone"
          name="phone"
          value={values.phone}
          error={errors.phone}
          isTouched={touchedFields.phone}
          maxLength={USER_PHONE_MAX_LENGTH}
          onChange={handleChange('phone')}
        />

        <PasswordInput
          id="register-password"
          name="password"
          value={values.password}
          placeholder="Create password"
          autoComplete="new-password"
          error={errors.password}
          isTouched={touchedFields.password}
          isVisible={isPasswordVisible}
          maxLength={USER_PASSWORD_MAX_LENGTH}
          onChange={handleChange('password')}
          onToggleVisibility={() => setIsPasswordVisible((prev) => !prev)}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={
          isSubmitting || !isAuthReady || !register || !registerFormIsValid
        }
      >
        {isSubmitting ? 'Creating account...' : 'Create account'}
      </Button>

      <p className={css.footerText}>
        Already have an account?{' '}
        <TextActionButton href={ROUTES.LOGIN}>Log in</TextActionButton>
      </p>
    </form>
  );
}

export default RegisterForm;
