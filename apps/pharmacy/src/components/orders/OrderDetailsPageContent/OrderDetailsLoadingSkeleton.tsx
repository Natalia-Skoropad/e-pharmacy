import {
  Boxes,
  CreditCard,
  History,
  MessageSquareText,
  Truck,
} from 'lucide-react';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { LoadingSpinner } from '@e-pharmacy/ui/primitives';

import css from './OrderDetailsPageContent.module.css';

//===================================================================

export function CreateOrderLoading() {
  return (
    <main className={css.page} aria-label="Preparing order" aria-busy="true">
      <section className={css.contentCard}>
        <div className={css.loaderBox}>
          <LoadingSpinner label="Preparing order..." />
        </div>
      </section>
    </main>
  );
}

//===================================================================

const LABELS = {
  products: {
    title: 'Order products',
    description: 'Loading products in this order.',
    icon: Boxes,
  },

  delivery: {
    title: 'Delivery method',
    description: 'Choose how the client will receive the order.',
    icon: Truck,
  },

  payment: {
    title: 'Payment method',
    description: 'Choose how the client will pay for the order.',
    icon: CreditCard,
  },

  comment: {
    title: 'Order comments',
    description: 'Private comments about this order.',
    icon: MessageSquareText,
  },

  history: {
    title: 'Order history',
    description: 'Review the order timeline.',
    icon: History,
  },
} as const;

//===================================================================

export function OrderDetailsLoadingSkeleton({
  tab,
}: Readonly<{ tab: keyof typeof LABELS }>) {
  const current = LABELS[tab];
  const Icon = current.icon;

  return (
    <main
      className={css.page}
      aria-label="Loading order details"
      aria-busy="true"
    >
      <section className={`${css.contentCard} ${css.headerCard}`}>
        <h1 className="visually-hidden" id="order-details-page-title">
          Loading order details
        </h1>

        <div className={css.orderHeaderSkeleton} aria-hidden="true">
          <div className={css.skeletonTitleRow}>
            <span className={`${css.skeletonPulse} ${css.skeletonTitleIcon}`} />
            <span className={`${css.skeletonPulse} ${css.skeletonHeading}`} />
          </div>

          <div className={css.skeletonBadgeRow}>
            <span className={`${css.skeletonPulse} ${css.skeletonBadge}`} />
            <span className={`${css.skeletonPulse} ${css.skeletonBadge}`} />
          </div>
          <span className={`${css.skeletonPulse} ${css.skeletonBanner}`} />
        </div>
      </section>

      <section className={css.contentCard}>
        <div className={css.skeletonTabs} aria-hidden="true">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              className={`${css.skeletonPulse} ${css.skeletonTab}`}
              key={index}
            />
          ))}
        </div>

        <div className={css.orderTabHeader}>
          <ProfileSectionHeader
            title={current.title}
            description={current.description}
            icon={<Icon size={22} aria-hidden="true" />}
          />
        </div>
        {tab !== 'comment' ? (
          <ProfileResourceState
            variant="loading"
            title={`Loading ${current.title.toLowerCase()}`}
            description="The order information is being loaded."
          />
        ) : null}
      </section>
    </main>
  );
}
