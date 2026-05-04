import { StatusPage } from '@/components/common';

import { ROUTES } from '@/lib/constants/routes';

//===================================================================

function NotFoundPage() {
  return (
    <StatusPage
      eyebrow="404"
      title="Page not found"
      text="The page you are looking for does not exist or may have been moved."
      primaryActionLabel="Back to home"
      primaryActionHref={ROUTES.HOME}
      secondaryActionLabel="View medicine catalog"
      secondaryActionHref={ROUTES.MEDICINE_STORE}
    />
  );
}

export default NotFoundPage;
