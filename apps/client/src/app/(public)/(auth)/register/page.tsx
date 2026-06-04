import { AuthFormShell, RegisterForm } from '@/components/auth';

import {
  REGISTER_BENEFITS,
  REGISTER_DESCRIPTION,
  REGISTER_TITLE,
} from '@e-pharmacy/config/seo';

import { ROUTES } from '@e-pharmacy/config/routes';
import { createBreadcrumbs } from '@e-pharmacy/config/routes';
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
        descriptionItems={[...REGISTER_BENEFITS]}
        breadcrumbs={createBreadcrumbs(REGISTER_TITLE)}
      >
        <RegisterForm />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default RegisterPage;
