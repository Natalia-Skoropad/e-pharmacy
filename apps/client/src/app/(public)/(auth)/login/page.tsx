import { AuthFormShell, LoginForm } from '@/components/auth';
import { GuestOnlyRoute } from '@/routes';

import {
  LOGIN_BENEFITS,
  LOGIN_DESCRIPTION,
  LOGIN_TITLE,
} from '@/lib/constants/metadata';

import { ROUTES } from '@/lib/constants/routes';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

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
