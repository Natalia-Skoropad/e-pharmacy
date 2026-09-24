import {
  REGISTER_DESCRIPTION,
  REGISTER_TITLE,
  createPageMetadata,
} from '@/lib/seo/server';

import { ROUTES, createBreadcrumbs } from '@/lib/routes';

import { AuthPageShell } from '@e-pharmacy/ui/auth';

import { RegisterForm } from '@/components/auth';

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
    <AuthPageShell
      title={REGISTER_TITLE}
      text={REGISTER_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(REGISTER_TITLE)}
      showHeader={false}
    >
      <RegisterForm />
    </AuthPageShell>
  );
}

export default RegisterPage;
