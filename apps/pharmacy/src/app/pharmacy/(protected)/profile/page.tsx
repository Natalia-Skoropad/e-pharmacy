import type { Metadata } from 'next';

import { PharmacyProfilePageContent } from '@/components/profile';

//===================================================================

export const metadata: Metadata = {
  title: 'Pharmacy profile',
  description: 'Manage pharmacy profile data, verification details, payment data, reviews, and sessions.',
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
