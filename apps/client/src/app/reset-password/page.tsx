import {
  AuthFormShell,
  GuestOnlyRoute,
  ResetPasswordForm,
} from '@/components/auth';

import {
  PASSWORD_RECOVERY_DESCRIPTION,
  RESET_PASSWORD_BENEFITS,
  RESET_PASSWORD_TITLE,
} from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

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
