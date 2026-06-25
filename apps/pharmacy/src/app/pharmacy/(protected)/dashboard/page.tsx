import type { Metadata } from 'next';
import Link from 'next/link';

import { PharmacyPage } from '@/components/pharmacy/PharmacyPage';
import { PlaceholderCards } from '@/components/pharmacy/PlaceholderCards';
import {
  getPharmacyOrdersFilterPath,
  getPharmacyProductsFilterPath,
  getPharmacyRequestsFilterPath,
} from '@/lib/pharmacy/routes';

//===================================================================

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Pharmacy dashboard overview.',
};

//===================================================================

function DashboardPage() {
  return (
    <PharmacyPage
      title="Dashboard"
      description="A first-stage dashboard skeleton for pharmacy status, statistics, and quick actions."
    >
      <PlaceholderCards
        items={[
          'Pharmacy status',
          'Orders statistics',
          'Clients statistics',
          'Products statistics',
          'Product requests statistics',
          'Quick actions',
        ]}
      />
      <div>
        <Link href={getPharmacyOrdersFilterPath({ status: 'new' })}>New orders</Link>{' '}
        <Link href={getPharmacyProductsFilterPath({ stock: 'empty' })}>Empty stock</Link>{' '}
        <Link href={getPharmacyRequestsFilterPath({ status: 'draft' })}>Draft requests</Link>
      </div>
    </PharmacyPage>
  );
}

export default DashboardPage;
