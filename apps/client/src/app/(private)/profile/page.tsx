import { ProfilePageContent } from '@/components/profile';

import { PROFILE_DESCRIPTION, PROFILE_TITLE } from '@e-pharmacy/config/seo';
import { ROUTES } from '@e-pharmacy/config/routes';
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
