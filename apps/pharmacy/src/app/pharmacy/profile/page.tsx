import type { Metadata } from 'next';

import { PharmacyProfilePageContent } from '@/components/profile/PharmacyProfilePageContent/PharmacyProfilePageContent';

//===================================================================

export const metadata: Metadata = {
  title: 'Owner profile',

  description:
    'Manage your owner account, private comments, documents, and active sessions.',

  robots: {
    index: false,
    follow: false,
  },
};

//===================================================================

function PharmacyProfilePage() {
  return <PharmacyProfilePageContent />;
}

export default PharmacyProfilePage;
