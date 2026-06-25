'use client';

import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button, RadioOption, TextActionButton } from '@e-pharmacy/ui/common';

import { EmailInput, PasswordInput } from '@e-pharmacy/ui/form-fields';
import { useToast } from '@e-pharmacy/ui/feedback';

import { getAuthErrorCode } from '@e-pharmacy/auth/errors';
import { useAuth } from '@e-pharmacy/auth/core';

import {
  LOGIN_FORM_FIELDS,
  USER_EMAIL_MAX_LENGTH,
  USER_PASSWORD_MAX_LENGTH,
  LOGIN_INITIAL_VALUES,
  hasValidationErrors,
  isLoginFormValid,
  markAllFieldsTouched,
  sanitizeEmail,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
  type LoginTouchedFields,
} from '@e-pharmacy/validation';

import { ROUTES } from '@/lib/routes';
import { getClientAuthErrorMessage, resolveLoginDestination } from '@/lib/auth';

import css from '../shared/AuthForm.module.css';

//===================================================================

type AuthAccountType = 'client' | 'pharmacy';

//===================================================================

const LOGIN_COPY: Record<
  AuthAccountType,
  {
    title: string;
    text: string;
    button: string;
    loading: string;
  }
> = {
  client: {
    title: 'Client account',
    text: 'Use the email and password from your personal account. After sign in, E-PHARMACY will open your client profile, orders, favorites, and checkout details.',
    button: 'Log in as client',
    loading: 'Logging in...',
  },
  pharmacy: {
    title: 'Pharmacy owner account',
    text: 'Use the same sign-in form with your pharmacy account. E-PHARMACY checks the account role by email and opens the pharmacy dashboard automatically.',
    button: 'Open pharmacy cabinet',
    loading: 'Opening cabinet...',
  },
};

//===================================================================

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { login, isAuthReady } = useAuth();
  const toast = useToast();

  const [accountType, setAccountType] = useState<AuthAccountType>('client');
  const [values, setValues] = useState<LoginFormValues>(LOGIN_INITIAL_VALUES);
  const [errors, setErrors] = useState<LoginFormErrors>({});

  const [touchedFields, setTouchedFields] = useState<LoginTouchedFields>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const loginFormIsValid = isLoginFormValid(values);
  const selectedCopy = LOGIN_COPY[accountType];

  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field === 'email'
          ? sanitizeEmail(event.target.value)
          : event.target.value;

      const nextValues = {
        ...values,
        [field]: nextValue,
      };

      const nextErrors = validateLoginForm(nextValues);

      setValues(nextValues);
      setTouchedFields((prev) => ({ ...prev, [field]: true }));
      setErrors((prev: LoginFormErrors) => ({
        ...prev,
        [field]: nextErrors[field],
      }));
    };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateLoginForm(values);

    if (hasValidationErrors(nextErrors)) {
      setTouchedFields(markAllFieldsTouched(LOGIN_FORM_FIELDS));
      setErrors(nextErrors);
      return;
    }

    try {
      setIsSubmitting(true);

      const user = await login({
        email: values.email.trim(),
        password: values.password,
      });

      if (!user) return;

      const destination = resolveLoginDestination({
        user,
        requestedRedirect: searchParams.get('redirect'),
      });

      if (destination.startsWith('http')) {
        window.location.assign(destination);
        return;
      }

      router.replace(destination);
    } catch (error) {
      toast.error(getClientAuthErrorMessage(getAuthErrorCode(error, 'login')));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <fieldset className={css.accountTypeGroup}>
        <legend className={css.accountTypeLegend}>Choose account type</legend>
        <div className={css.accountTypeOptions}>
          <RadioOption
            name="login-account-type"
            value="client"
            checked={accountType === 'client'}
            label="I am a client"
            onChange={setAccountType}
          />
          <RadioOption
            name="login-account-type"
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
          id="login-email"
          name="email"
          value={values.email}
          error={errors.email}
          isTouched={touchedFields.email}
          maxLength={USER_EMAIL_MAX_LENGTH}
          onChange={handleChange('email')}
        />

        <PasswordInput
          id="login-password"
          name="password"
          value={values.password}
          autoComplete="current-password"
          error={errors.password}
          isTouched={touchedFields.password}
          isVisible={isPasswordVisible}
          maxLength={USER_PASSWORD_MAX_LENGTH}
          labelAction={
            <TextActionButton href={ROUTES.PASSWORD_RECOVERY}>
              Forgot password?
            </TextActionButton>
          }
          onChange={handleChange('password')}
          onToggleVisibility={() => setIsPasswordVisible((prev) => !prev)}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={isSubmitting || !isAuthReady || !loginFormIsValid}
      >
        {isSubmitting ? selectedCopy.loading : selectedCopy.button}
      </Button>

      <p className={css.footerText}>
        Don&apos;t have an account yet?{' '}
        <TextActionButton href={ROUTES.REGISTER}>Register</TextActionButton>
      </p>
    </form>
  );
}

export default LoginForm;
