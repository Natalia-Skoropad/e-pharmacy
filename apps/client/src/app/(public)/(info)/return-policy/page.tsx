import { createPageMetadata } from '@/lib/seo/server';

import InfoPage from '@/components/info/InfoPage/InfoPage';
import { RETURN_POLICY_INFO, isInfoDocumentNoIndex } from '@/components/info/config';

//===================================================================

export const metadata = createPageMetadata({
  title: RETURN_POLICY_INFO.title,
  description: RETURN_POLICY_INFO.description,
  path: RETURN_POLICY_INFO.path,
  noIndex: isInfoDocumentNoIndex(RETURN_POLICY_INFO),
});

//===================================================================

function ReturnPolicyPage() {
  return (
    <InfoPage data={RETURN_POLICY_INFO} />
  );
}

export default ReturnPolicyPage;
