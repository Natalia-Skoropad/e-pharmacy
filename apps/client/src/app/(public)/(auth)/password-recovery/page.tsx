import { AuthFormShell, PasswordRecoveryForm } from '@/components/auth';

import {
  PASSWORD_RECOVERY_BENEFITS,
  PASSWORD_RECOVERY_DESCRIPTION,
  PASSWORD_RECOVERY_TITLE,
} from '@/lib/seo';

import { ROUTES } from '@/lib/routes';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

import { GuestOnlyRoute } from '@/routes';

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
        descriptionItems={[...PASSWORD_RECOVERY_BENEFITS]}
        breadcrumbs={createBreadcrumbs(PASSWORD_RECOVERY_TITLE)}
      >
        <PasswordRecoveryForm />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default PasswordRecoveryPage;
