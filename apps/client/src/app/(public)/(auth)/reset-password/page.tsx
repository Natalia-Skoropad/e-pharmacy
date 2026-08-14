import {
  PASSWORD_RECOVERY_DESCRIPTION,
  RESET_PASSWORD_TITLE,
  createPageMetadata,
} from '@/lib/seo/server';

import { createBreadcrumbs, ROUTES } from '@/lib/routes';

import { AuthFormShell, ResetPasswordForm } from '@/components/auth';

//===================================================================

export const metadata = createPageMetadata({
  title: RESET_PASSWORD_TITLE,
  description: PASSWORD_RECOVERY_DESCRIPTION,
  path: ROUTES.RESET_PASSWORD,
  noIndex: true,
});

//===================================================================

function ResetPasswordPage() {
  return (
    <AuthFormShell
      title={RESET_PASSWORD_TITLE}
      text={PASSWORD_RECOVERY_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(RESET_PASSWORD_TITLE)}
      showHeader={false}
    >
      <ResetPasswordForm
        title={RESET_PASSWORD_TITLE}
        text={PASSWORD_RECOVERY_DESCRIPTION}
      />
    </AuthFormShell>
  );
}

export default ResetPasswordPage;
