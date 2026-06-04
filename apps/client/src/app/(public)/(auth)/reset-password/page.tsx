import { AuthFormShell, ResetPasswordForm } from '@/components/auth';

import {
  PASSWORD_RECOVERY_DESCRIPTION,
  RESET_PASSWORD_BENEFITS,
  RESET_PASSWORD_TITLE,
} from '@e-pharmacy/config/seo';

import { ROUTES } from '@e-pharmacy/config/routes';
import { createBreadcrumbs } from '@e-pharmacy/config/routes';
import { createPageMetadata } from '@/lib/seo';

import { GuestOnlyRoute } from '@/routes';

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
        descriptionItems={[...RESET_PASSWORD_BENEFITS]}
        breadcrumbs={createBreadcrumbs(RESET_PASSWORD_TITLE)}
      >
        <ResetPasswordForm token={token} />
      </AuthFormShell>
    </GuestOnlyRoute>
  );
}

export default ResetPasswordPage;
