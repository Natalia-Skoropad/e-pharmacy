import {
  BarChart3,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  History,
  MessageSquareText,
  UsersRound,
} from 'lucide-react';

import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';

import type { OwnProductDetailTab } from '@/lib/products/own-product-detail-tabs';

//===================================================================

export function OwnProductTabHeading({
  tab,
}: Readonly<{ tab: OwnProductDetailTab }>) {
  const presentation = {
    details: {
      title: 'Product details',

      description:
        'Review your product information, current status and pharmacy availability.',

      icon: <Boxes size={21} />,
    },

    statistics: {
      title: 'Statistics',

      description:
        'Review successful product sales for all your pharmacies or one selected pharmacy.',

      icon: <ChartNoAxesCombined size={21} />,
    },

    'related-orders': {
      title: 'Related orders',
      description: 'See orders containing this product across your pharmacies.',
      icon: <BarChart3 size={21} />,
    },

    'stock-movement': {
      title: 'Stock movement',

      description:
        'Track stock changes for this product in the selected pharmacy.',

      icon: <History size={21} />,
    },

    clients: {
      title: 'Clients',
      description: 'See your clients who have ordered this product.',
      icon: <UsersRound size={21} />,
    },

    pharmacies: {
      title: 'Pharmacies',

      description:
        'Review the pharmacies in your account that carry this product.',

      icon: <Building2 size={21} />,
    },

    comments: {
      title: 'Comments',
      description: 'View and manage internal notes about this product.',
      icon: <MessageSquareText size={21} />,
    },
  };

  return <ProfileSectionHeader {...presentation[tab]} />;
}
