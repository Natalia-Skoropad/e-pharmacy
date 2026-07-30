import {
  PROFILE_DESCRIPTION,
  PROFILE_TITLE,
  createPageMetadata,
} from '@/lib/seo/server';

import { ROUTES } from '@/lib/routes';
import { ProfilePageContent } from '@/components/profile';

//===================================================================

export const metadata = createPageMetadata({
  title: PROFILE_TITLE,
  description: PROFILE_DESCRIPTION,
  path: ROUTES.PROFILE,
  noIndex: true,
});

//===================================================================

function ProfilePage() {
  return <ProfilePageContent />;
}

export default ProfilePage;
