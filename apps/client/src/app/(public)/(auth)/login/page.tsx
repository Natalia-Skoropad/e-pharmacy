import { LOGIN_DESCRIPTION, LOGIN_TITLE, createPageMetadata } from '@/lib/seo';
import { ROUTES, createBreadcrumbs } from '@/lib/routes';
import { GuestOnlyRoute } from '@/routes';

import { AuthFormShell, LoginForm } from '@/components/auth';

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
        breadcrumbs={createBreadcrumbs(LOGIN_TITLE)}
      >
        <LoginForm />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default LoginPage;
