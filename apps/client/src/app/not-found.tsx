import { StatusPage } from '@/components/common';

import { ROUTES } from '@/lib/constants/routes';

//===================================================================

function NotFoundPage() {
  return (
    <StatusPage
      eyebrow="404"
      title="This page slipped out of the medicine cabinet"
      text="The link may be outdated, moved, or typed with a tiny typo. Let’s guide you back to trusted pharmacies and medicines without the digital headache."
      primaryActionLabel="Back to home"
      primaryActionHref={ROUTES.HOME}
      secondaryActionLabel="View medicine catalog"
      secondaryActionHref={ROUTES.MEDICINES_CATALOG}
    />
  );
}

export default NotFoundPage;
