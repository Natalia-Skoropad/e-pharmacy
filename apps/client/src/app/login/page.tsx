import { GuestOnlyRoute, LoginPageContent } from '@/components/auth';

import { LOGIN_DESCRIPTION, LOGIN_TITLE } from '@/lib/constants/metadata';
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
    <GuestOnlyRoute>
      <LoginPageContent />
    </GuestOnlyRoute>
  );
}

export default LoginPage;
