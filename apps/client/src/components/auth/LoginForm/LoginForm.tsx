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
  normalizeEmail,
  validateLoginForm,
  type LoginFormErrors,
  type LoginFormValues,
  type LoginTouchedFields,
} from '@e-pharmacy/validation/auth';

import { ROUTES } from '@/lib/routes';
import { LOGIN_TITLE } from '@/lib/seo';
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
    text: 'Use your personal account email and password. After sign in, E-PHARMACY will open your profile, orders, favorites, and checkout details.',
    button: 'Log in',
    loading: 'Logging in...',
  },

  pharmacy: {
    title: 'Pharmacy owner account',
    text: 'Use your pharmacy owner email and password. E-PHARMACY checks the account role and opens the pharmacy dashboard automatically.',
    button: 'Open pharmacy dashboard',
    loading: 'Opening dashboard...',
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const loginFormIsValid = isLoginFormValid(values);
  const selectedCopy = LOGIN_COPY[accountType];

  const handleChange =
    (field: keyof LoginFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue =
        field === 'email'
          ? normalizeEmail(event.target.value)
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

    let didStartExternalRedirect = false;

    try {
      setIsSubmitting(true);

      const user = await login({
        email: values.email.trim(),
        password: values.password,
        application: accountType,
      });

      if (!user) return;

      const destination = resolveLoginDestination({
        user,
        requestedRedirect: searchParams.get('redirect'),
      });

      if (destination.startsWith('http')) {
        didStartExternalRedirect = true;
        setIsRedirecting(true);
        window.location.replace(destination);
        return;
      }

      router.replace(destination);
    } catch (error) {
      const message =
        error instanceof Error &&
        (error.message.includes('Pharmacy account') ||
          error.message.includes('Client account'))
          ? error.message
          : getClientAuthErrorMessage(getAuthErrorCode(error, 'login'));

      toast.error(message);
    } finally {
      if (!didStartExternalRedirect) setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} noValidate onSubmit={handleSubmit}>
      <div className={css.authTitleBlock}>
        <h1 className={css.authTitle}>{LOGIN_TITLE}</h1>
      </div>

      <fieldset className={css.accountTypeGroup}>
        <legend className={css.visuallyHidden}>Account type</legend>
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
        disabled={
          isSubmitting || isRedirecting || !isAuthReady || !loginFormIsValid
        }
      >
        {isSubmitting || isRedirecting
          ? selectedCopy.loading
          : selectedCopy.button}
      </Button>

      <p className={css.footerText}>
        Don&apos;t have an account yet?{' '}
        <TextActionButton href={ROUTES.REGISTER}>Register</TextActionButton>
      </p>
    </form>
  );
}

export default LoginForm;
