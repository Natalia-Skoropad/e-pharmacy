import { AuthFormShell, RegisterForm } from '@/components/auth';

import {
  REGISTER_BENEFITS,
  REGISTER_DESCRIPTION,
  REGISTER_TITLE,
} from '@/lib/constants/metadata';

import { ROUTES } from '@/lib/constants/routes';
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
        descriptionItems={[...REGISTER_BENEFITS]}
        breadcrumbs={createBreadcrumbs(REGISTER_TITLE)}
      >
        <RegisterForm />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default RegisterPage;
