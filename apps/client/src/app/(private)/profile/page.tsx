import { ProfilePageContent } from '@/components/profile';

import { PROFILE_DESCRIPTION, PROFILE_TITLE } from '@/lib/constants/metadata';
import { ROUTES } from '@/lib/constants/routes';
import { createPageMetadata } from '@/lib/seo';

import { ProtectedRoute } from '@/routes';

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
