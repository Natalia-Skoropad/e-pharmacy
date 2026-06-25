import {
  REGISTER_DESCRIPTION,
  REGISTER_TITLE,
  createPageMetadata,
} from '@/lib/seo';

import { ROUTES, createBreadcrumbs } from '@/lib/routes';
import { GuestOnlyRoute } from '@/routes';

import { AuthFormShell, RegisterForm } from '@/components/auth';

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
        showHeader={false}
      >
        <RegisterForm />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default RegisterPage;
