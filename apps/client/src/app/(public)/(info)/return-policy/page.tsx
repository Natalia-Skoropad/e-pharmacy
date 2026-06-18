import { InfoPage } from '@/components/info';

import { RETURN_POLICY_INFO } from '@/components/info/config';
import { createPageMetadata } from '@/lib/seo';

//===================================================================

export const metadata = createPageMetadata({
  title: RETURN_POLICY_INFO.title,
  description: RETURN_POLICY_INFO.description,
  path: RETURN_POLICY_INFO.path,
});

//===================================================================

function ReturnPolicyPage() {
  return (
    <InfoPage
      title={RETURN_POLICY_INFO.title}
      description={RETURN_POLICY_INFO.description}
      activePath={RETURN_POLICY_INFO.path}
      updatedAt={RETURN_POLICY_INFO.updatedAt}
      sections={RETURN_POLICY_INFO.sections}
    />
  );
}

export default ReturnPolicyPage;
