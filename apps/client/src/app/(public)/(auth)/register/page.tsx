import { AuthFormShell, RegisterForm } from '@/components/auth';

import { REGISTER_DESCRIPTION, REGISTER_TITLE } from '@/lib/seo';

import { ROUTES } from '@/lib/routes';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import { GuestOnlyRoute } from '@/routes';

//===================================================================

export const metadata = createPageMetadata({
  title: REGISTER_TITLE,
  description: REGISTER_DESCRIPTION,
  path: ROUTES.REGISTER,
  noIndex: true,
});

//===================================================================

function RegisterPage() {
  return (
    <GuestOnlyRoute>
      <AuthFormShell
        title={REGISTER_TITLE}
        text={REGISTER_DESCRIPTION}
        breadcrumbs={createBreadcrumbs(REGISTER_TITLE)}
      >
        <RegisterForm />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default RegisterPage;
