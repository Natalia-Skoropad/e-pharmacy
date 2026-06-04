import { InfoPage } from '@/components/info';

import { USER_AGREEMENT_INFO } from '@e-pharmacy/config/info-pages';
import { createPageMetadata } from '@/lib/seo';

//===================================================================

export const metadata = createPageMetadata({
  title: USER_AGREEMENT_INFO.title,
  description: USER_AGREEMENT_INFO.description,
  path: USER_AGREEMENT_INFO.path,
});

//===================================================================

function UserAgreementPage() {
  return (
    <InfoPage
      title={USER_AGREEMENT_INFO.title}
      description={USER_AGREEMENT_INFO.description}
      activePath={USER_AGREEMENT_INFO.path}
      updatedAt={USER_AGREEMENT_INFO.updatedAt}
      sections={USER_AGREEMENT_INFO.sections}
    />
  );
}

export default UserAgreementPage;
