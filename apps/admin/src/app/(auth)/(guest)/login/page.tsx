import type { Metadata } from 'next';

import { AuthPageShell } from '@e-pharmacy/ui/auth';

import { AdminLoginForm } from '@/components/auth/AdminLoginForm';

//===================================================================

export const metadata: Metadata = {
  title: 'Login',
  description: 'Log in to the private E-PHARMACY admin cabinet.',
  robots: { index: false, follow: false },
};

//===================================================================

export default function AdminLoginPage() {
  return (
    <AuthPageShell
      title="Admin login"
      text="Log in to the private E-PHARMACY administration cabinet."
      breadcrumbs={[{ label: 'Admin login' }]}
      showHeader={false}
    >
      <AdminLoginForm />
    </AuthPageShell>
  );
}
