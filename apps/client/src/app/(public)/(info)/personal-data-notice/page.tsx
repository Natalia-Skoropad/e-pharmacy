import { createPageMetadata } from '@/lib/seo/server';

import InfoPage from '@/components/info/InfoPage/InfoPage';
import { PERSONAL_DATA_NOTICE_INFO, isInfoDocumentNoIndex } from '@/components/info/config';

//===================================================================

export const metadata = createPageMetadata({
  title: PERSONAL_DATA_NOTICE_INFO.title,
  description: PERSONAL_DATA_NOTICE_INFO.description,
  path: PERSONAL_DATA_NOTICE_INFO.path,
  noIndex: isInfoDocumentNoIndex(PERSONAL_DATA_NOTICE_INFO),
});

//===================================================================

function PersonalDataNoticePage() {
  return (
    <InfoPage data={PERSONAL_DATA_NOTICE_INFO} />
  );
}

export default PersonalDataNoticePage;
