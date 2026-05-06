import { AuthFormShell, LoginForm } from '@/components/auth';

import { LOGIN_DESCRIPTION, LOGIN_TITLE } from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

//===================================================================

export const metadata = createPageMetadata({
  title: LOGIN_TITLE,
  description: LOGIN_DESCRIPTION,
  path: '/login',
  noIndex: true,
});

//===================================================================

function LoginPage() {
  return (
    <AuthFormShell
      title={LOGIN_TITLE}
      text={LOGIN_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(LOGIN_TITLE)}
    >
      <LoginForm />
    </AuthFormShell>
  );
}

export default LoginPage;
