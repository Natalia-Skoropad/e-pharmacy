import {
  PROFILE_DESCRIPTION,
  PROFILE_TITLE,
  createPageMetadata,
} from '@/lib/seo';

import { ROUTES } from '@/lib/routes';
import { ProtectedRoute } from '@/routes';

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
  return (
    <ProtectedRoute>
      <ProfilePageContent />
    </ProtectedRoute>
  );
}

export default ProfilePage;
