import { LOGIN_DESCRIPTION, LOGIN_TITLE, createPageMetadata } from '@/lib/seo/server';
import { ROUTES, createBreadcrumbs } from '@/lib/routes';

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
    <AuthFormShell
      title={LOGIN_TITLE}
      text={LOGIN_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(LOGIN_TITLE)}
      showHeader={false}
    >
      <LoginForm />
    </AuthFormShell>
  );
}

export default LoginPage;
