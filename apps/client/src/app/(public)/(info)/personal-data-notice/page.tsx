import { InfoPage } from '@/components/info';

import { PERSONAL_DATA_NOTICE_INFO } from '@/components/info/config';
import { createPageMetadata } from '@/lib/seo';

//===================================================================

export const metadata = createPageMetadata({
  title: PERSONAL_DATA_NOTICE_INFO.title,
  description: PERSONAL_DATA_NOTICE_INFO.description,
  path: PERSONAL_DATA_NOTICE_INFO.path,
});

//===================================================================

function PersonalDataNoticePage() {
  return (
    <InfoPage
      title={PERSONAL_DATA_NOTICE_INFO.title}
      description={PERSONAL_DATA_NOTICE_INFO.description}
      activePath={PERSONAL_DATA_NOTICE_INFO.path}
      updatedAt={PERSONAL_DATA_NOTICE_INFO.updatedAt}
      sections={PERSONAL_DATA_NOTICE_INFO.sections}
    />
  );
}

export default PersonalDataNoticePage;
