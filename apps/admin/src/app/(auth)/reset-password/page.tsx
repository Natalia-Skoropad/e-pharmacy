import type { Metadata } from 'next';

import { AuthPageShell } from '@e-pharmacy/ui/auth';

import { AdminResetPasswordForm } from '@/components/auth/AdminResetPasswordForm';
import { ADMIN_ROUTES } from '@/lib/routes';

//===================================================================

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Set a new password for an E-PHARMACY admin account.',
  robots: { index: false, follow: false },
};

//===================================================================

export default function AdminResetPasswordPage() {
  return (
    <AuthPageShell
      title="Reset password"
      text="Create a new password for your admin account."
      breadcrumbs={[
        { label: 'Admin login', href: ADMIN_ROUTES.LOGIN },
        { label: 'Reset password' },
      ]}
      showHeader={false}
    >
      <AdminResetPasswordForm />
    </AuthPageShell>
  );
}
