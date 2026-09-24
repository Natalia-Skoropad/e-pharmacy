import type { Metadata } from 'next';

import { AuthPageShell } from '@e-pharmacy/ui/auth';

import { AdminPasswordRecoveryForm } from '@/components/auth/AdminPasswordRecoveryForm';
import { ADMIN_ROUTES } from '@/lib/routes';

//===================================================================

export const metadata: Metadata = {
  title: 'Password recovery',
  description: 'Request a password reset link for an admin account.',
  robots: { index: false, follow: false },
};

//===================================================================

export default function AdminPasswordRecoveryPage() {
  return (
    <AuthPageShell
      title="Password recovery"
      text="Enter the email associated with your admin account."
      breadcrumbs={[
        { label: 'Admin login', href: ADMIN_ROUTES.LOGIN },
        { label: 'Password recovery' },
      ]}
      showDescription={false}
    >
      <AdminPasswordRecoveryForm />
    </AuthPageShell>
  );
}
