import { ProtectedRoute } from '@/routes';
import { ProfilePageContent } from '@/components/profile';

import { PROFILE_DESCRIPTION, PROFILE_TITLE } from '@/lib/constants/metadata';
import { createPageMetadata } from '@/lib/seo';

//===================================================================

export const metadata = createPageMetadata({
  title: PROFILE_TITLE,
  description: PROFILE_DESCRIPTION,
  path: '/profile',
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
