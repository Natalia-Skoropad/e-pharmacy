import { AuthFormShell, GuestOnlyRoute, RegisterForm } from '@/components/auth';

import { REGISTER_DESCRIPTION, REGISTER_TITLE } from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

//===================================================================

export const metadata = createPageMetadata({
  title: REGISTER_TITLE,
  description: REGISTER_DESCRIPTION,
  path: '/register',
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
