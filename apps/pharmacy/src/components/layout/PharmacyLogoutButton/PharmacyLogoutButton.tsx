'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuth } from '@e-pharmacy/auth/core';

import css from './PharmacyLogoutButton.module.css';

//===================================================================

type PharmacyLogoutButtonProps = Readonly<{
  className?: string;
}>;

//===================================================================

export function PharmacyLogoutButton({ className }: PharmacyLogoutButtonProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      router.replace('/auth/login');
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      className={[css.button, className].filter(Boolean).join(' ')}
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? 'Logging out...' : 'Logout'}
    </button>
  );
}
