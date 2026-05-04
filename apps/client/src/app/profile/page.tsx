import { PagePlaceholder } from '@/components/common';

import { PROFILE_DESCRIPTION, PROFILE_TITLE } from '@/lib/constants/metadata';
import { createBreadcrumbs } from '@/lib/routes';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: PROFILE_TITLE,
  description: PROFILE_DESCRIPTION,
  path: '/profile',
  noIndex: true,
});

function ProfilePage() {
  return (
    <PagePlaceholder
      title={PROFILE_TITLE}
      text={PROFILE_DESCRIPTION}
      breadcrumbs={createBreadcrumbs(PROFILE_TITLE)}
    />
  );
}

export default ProfilePage;
