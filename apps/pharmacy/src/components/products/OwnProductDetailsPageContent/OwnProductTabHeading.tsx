import {
  ShoppingBag,
  Boxes,
  Building2,
  ChartNoAxesCombined,
  History,
  PackagePlus,
  Archive,
  PackageMinus,
  MessageSquareText,
  UsersRound,
} from 'lucide-react';

import { ProfileSectionHeader } from '@e-pharmacy/ui/profile';
import { InfoTooltip } from '@e-pharmacy/ui/overlays';

import type { OwnProductDetailTab } from '@/lib/products/own-product-detail-tabs';

import css from './OwnProductDetailsPageContent.module.css';

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
      icon: <ShoppingBag size={21} />,
    },

    'stock-movement': {
      title: (
        <span className={css.titleWithHelp}>
          Stock movement
          <InfoTooltip
            label="How stock movement works"
            title="How stock movement works"
            icon={<History size={20} aria-hidden="true" />}
            escapeOverflow
            preferTopLayer
            scrollable
            items={[
              {
                title: 'Stock arrivals',
                description: 'Increase physical and available stock.',
                icon: <PackagePlus size={17} aria-hidden="true" />,
              },
              {
                title: 'Order reservations',
                description:
                  'New and In progress orders reserve available units.',
                icon: <Archive size={17} aria-hidden="true" />,
              },
              {
                title: 'Final order status',
                description:
                  'Rejected orders release reservations; Successful orders write reserved units off stock.',
                icon: <PackageMinus size={17} aria-hidden="true" />,
              },
            ]}
          />
        </span>
      ),

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
        'Review the price, stock and sale availability of this product across your pharmacies.',

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
