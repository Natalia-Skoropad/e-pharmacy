import {
  PASSWORD_RECOVERY_DESCRIPTION,
  PASSWORD_RECOVERY_TITLE,
  createPageMetadata,
} from '@/lib/seo';

import { createBreadcrumbs, ROUTES } from '@/lib/routes';
import { GuestOnlyRoute } from '@/routes';

import { AuthFormShell, PasswordRecoveryForm } from '@/components/auth';

//===================================================================

export const metadata = createPageMetadata({
  title: PASSWORD_RECOVERY_TITLE,
  description: PASSWORD_RECOVERY_DESCRIPTION,
  path: ROUTES.PASSWORD_RECOVERY,
  noIndex: true,
});

//===================================================================

function PasswordRecoveryPage() {
  return (
    <GuestOnlyRoute>
      <AuthFormShell
        title={PASSWORD_RECOVERY_TITLE}
        text={PASSWORD_RECOVERY_DESCRIPTION}
        breadcrumbs={createBreadcrumbs(PASSWORD_RECOVERY_TITLE)}
      >
        <PasswordRecoveryForm />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default PasswordRecoveryPage;
