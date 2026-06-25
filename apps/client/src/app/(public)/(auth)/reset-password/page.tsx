import {
  PASSWORD_RECOVERY_DESCRIPTION,
  RESET_PASSWORD_TITLE,
  createPageMetadata,
} from '@/lib/seo';

import { createBreadcrumbs, ROUTES } from '@/lib/routes';
import { GuestOnlyRoute } from '@/routes';

import { AuthFormShell, ResetPasswordForm } from '@/components/auth';

//===================================================================

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string;
  }>;
};

//===================================================================

export const metadata = createPageMetadata({
  title: RESET_PASSWORD_TITLE,
  description: PASSWORD_RECOVERY_DESCRIPTION,
  path: ROUTES.RESET_PASSWORD,
  noIndex: true,
});

//===================================================================

async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token = '' } = await searchParams;

  return (
    <GuestOnlyRoute>
      <AuthFormShell
        title={RESET_PASSWORD_TITLE}
        text={PASSWORD_RECOVERY_DESCRIPTION}
        breadcrumbs={createBreadcrumbs(RESET_PASSWORD_TITLE)}
        showHeader={false}
      >
        <ResetPasswordForm
          token={token}
          title={RESET_PASSWORD_TITLE}
          text={PASSWORD_RECOVERY_DESCRIPTION}
        />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default ResetPasswordPage;
