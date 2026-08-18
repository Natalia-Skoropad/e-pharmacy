import { createPageMetadata } from '@/lib/seo/server';

import InfoPage from '@/components/info/InfoPage/InfoPage';
import { USER_AGREEMENT_INFO, isInfoDocumentNoIndex } from '@/components/info/config';

//===================================================================

export const metadata = createPageMetadata({
  title: USER_AGREEMENT_INFO.title,
  description: USER_AGREEMENT_INFO.description,
  path: USER_AGREEMENT_INFO.path,
  noIndex: isInfoDocumentNoIndex(USER_AGREEMENT_INFO),
});

//===================================================================

function UserAgreementPage() {
  return (
    <InfoPage data={USER_AGREEMENT_INFO} />
  );
}

export default UserAgreementPage;
