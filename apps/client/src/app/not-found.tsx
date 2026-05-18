import { StatusPage } from '@/components/common';

import { ROUTES } from '@/lib/constants/routes';

//===================================================================

function NotFoundPage() {
  return (
    <StatusPage
      eyebrow="404"
      title="Page not found"
      text="The link may be outdated, moved, or typed with a tiny typo. Go back home or open the medicine catalog to continue shopping safely."
      primaryActionLabel="Back to home"
      primaryActionHref={ROUTES.HOME}
      secondaryActionLabel="View medicine catalog"
      secondaryActionHref={ROUTES.MEDICINES_CATALOG}
    />
  );
}

export default NotFoundPage;
