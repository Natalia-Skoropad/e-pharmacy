import { AuthFormShell, LoginForm } from '@/components/auth';

import {
  LOGIN_BENEFITS,
  LOGIN_DESCRIPTION,
  LOGIN_TITLE,
} from '@e-pharmacy/config/seo';

import { ROUTES } from '@e-pharmacy/config/routes';
import { createBreadcrumbs } from '@e-pharmacy/config/routes';
import { createPageMetadata } from '@/lib/seo';

import { GuestOnlyRoute } from '@/routes';

//===================================================================

export const metadata = createPageMetadata({
  title: LOGIN_TITLE,
  description: LOGIN_DESCRIPTION,
  path: ROUTES.LOGIN,
  noIndex: true,
});

//===================================================================

function LoginPage() {
  return (
    <GuestOnlyRoute>
      <AuthFormShell
        title={LOGIN_TITLE}
        text={LOGIN_DESCRIPTION}
        descriptionItems={[...LOGIN_BENEFITS]}
        breadcrumbs={createBreadcrumbs(LOGIN_TITLE)}
      >
        <LoginForm />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default LoginPage;
