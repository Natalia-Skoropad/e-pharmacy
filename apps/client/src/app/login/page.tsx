import { PagePlaceholder } from '@/components/common';

import { LOGIN_DESCRIPTION, LOGIN_TITLE } from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: LOGIN_TITLE,
  description: LOGIN_DESCRIPTION,
  path: '/login',
  noIndex: true,
});

function LoginPage() {
  return (
    <PagePlaceholder
      title={LOGIN_TITLE}
      text={LOGIN_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(LOGIN_TITLE)}
    />
  );
}

export default LoginPage;
