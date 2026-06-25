'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useAuth } from '@e-pharmacy/auth/core';
import { getSafeApplicationRedirectPath } from '@e-pharmacy/auth/routing';

import { getDemoPharmacyCredentials } from '@/lib/auth/demo-pharmacy-auth';
import { getPharmacyDashboardPath } from '@/lib/pharmacy/routes';

import css from './PharmacyLoginForm.module.css';

//===================================================================

const PHARMACY_ALLOWED_REDIRECT_PREFIXES = ['/pharmacy'] as const;
const ADMIN_APP_FALLBACK_PATH = '/admin/dashboard';
const CLIENT_APP_FALLBACK_PATH = '/';

//===================================================================

function getForeignRoleRedirectPath(role: string) {
  return role === 'admin' ? ADMIN_APP_FALLBACK_PATH : CLIENT_APP_FALLBACK_PATH;
}

//===================================================================

export function PharmacyLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const demoCredentials = getDemoPharmacyCredentials();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectPath = useMemo(
    () =>
      getSafeApplicationRedirectPath(searchParams.get('redirect'), {
        allowedPrefixes: PHARMACY_ALLOWED_REDIRECT_PREFIXES,
        fallbackPath: getPharmacyDashboardPath(),
      }),
    [searchParams]
  );

  const reason = searchParams.get('reason');

  const handleUseDemoCredentials = () => {
    setEmail(demoCredentials.email);
    setPassword(demoCredentials.password);
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });

      if (!user) {
        setError('Unable to complete login. Please try again.');
        return;
      }

      if (user.role !== 'pharmacy') {
        router.replace(getForeignRoleRedirectPath(user.role));
        return;
      }

      if (user.status === 'blocked') {
        setError('This pharmacy account is blocked. Please contact support.');
        return;
      }

      router.replace(redirectPath);
    } catch {
      setError(
        'Invalid email or password. Please check the details and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={css.form} onSubmit={handleSubmit} noValidate>
      {reason === 'pharmacy-blocked' ? (
        <p className={css.banner} role="alert">
          This pharmacy account is blocked. Please contact support.
        </p>
      ) : null}

      <div className={css.demoBox}>
        <p className={css.demoTitle}>Demo pharmacy account</p>
        <p className={css.demoText}>
          Email: <strong>{demoCredentials.email}</strong>
          <br />
          Password: <strong>{demoCredentials.password}</strong>
        </p>
        <button
          className={css.demoButton}
          type="button"
          onClick={handleUseDemoCredentials}
        >
          Use demo account
        </button>
      </div>

      <label className={css.field}>
        <span>Email</span>
        <input
          type="email"
          value={email}
          autoComplete="email"
          required
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>

      <label className={css.field}>
        <span>Password</span>
        <input
          type="password"
          value={password}
          autoComplete="current-password"
          required
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>

      {error ? (
        <p className={css.error} role="alert">
          {error}
        </p>
      ) : null}

      <button className={css.submit} type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
