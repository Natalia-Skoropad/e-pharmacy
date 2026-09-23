import type { ForgotPasswordInput } from '../types/auth';

//===============================================================

type PasswordResetAppUrls = Readonly<{
  client: string;
  pharmacy?: string;
  admin?: string;
}>;

//===============================================================

export function resolvePasswordResetAppUrl(
  application: ForgotPasswordInput['application'],
  urls: PasswordResetAppUrls
): string {
  const appUrls = {
    client: urls.client,
    pharmacy: urls.pharmacy || urls.client,
    admin: urls.admin,
  } satisfies Record<ForgotPasswordInput['application'], string | undefined>;

  const appUrl = appUrls[application];

  if (!appUrl) {
    throw new Error(
      `Password reset URL is not configured for application: ${application}`
    );
  }

  return appUrl;
}
