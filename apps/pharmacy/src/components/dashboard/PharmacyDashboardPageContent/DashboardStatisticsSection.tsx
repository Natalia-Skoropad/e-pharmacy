import type { ReactNode } from 'react';
import Link from 'next/link';

import {
  Boxes,
  FilePlus2,
  PackageSearch,
  ShoppingBag,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { LinkButton } from '@e-pharmacy/ui/navigation';
import { Button } from '@e-pharmacy/ui/primitives';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { StatsLoadingSkeleton } from '@e-pharmacy/ui/statistics';

import css from './PharmacyDashboardPageContent.module.css';

//===================================================================

export const DASHBOARD_SECTIONS = {
  orders: {
    id: 'orders-stats-title',
    title: 'Orders statistics',
    description:
      'Counts and amounts for the selected period and pharmacy scope.',
    icon: ShoppingBag,
    actionLabel: 'View orders',
    count: 4,
    metaCount: 4,
  },

  clients: {
    id: 'clients-stats-title',
    title: 'Clients statistics',
    description: 'Clients associated with the selected pharmacy scope.',
    icon: Users,
    actionLabel: 'View clients',
    count: 3,
  },

  ownProducts: {
    id: 'own-products-stats-title',
    title: 'Own product statistics',
    description:
      'Stock, reservations and availability across the selected pharmacy scope.',
    icon: Boxes,
    actionLabel: 'View own products',
    count: 4,
    metaCount: 3,
  },

  allProducts: {
    id: 'all-products-stats-title',
    title: 'All product statistics',
    description:
      'Global catalog products and their availability in your pharmacies.',
    icon: PackageSearch,
    actionLabel: 'View all products',
    count: 4,
  },

  requests: {
    id: 'requests-stats-title',
    title: 'Product request statistics',
    description: 'Product requests created by your owner account.',
    icon: FilePlus2,
    actionLabel: 'View requests',
    count: 4,
  },
} as const;

//===================================================================

type Resource<T> = Readonly<{
  data: T | null;
  isLoading: boolean;
  error: boolean;
  retry: () => void;
}>;

//===================================================================

export function DashboardStatisticsSection<T>({
  id,
  title,
  description,
  icon: Icon,
  href,
  actionLabel,
  resource,
  count = 4,
  filters,
  metaCount = 0,
  children,
}: Readonly<{
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  actionLabel: string;
  resource: Resource<T>;
  count?: number;
  filters?: ReactNode;
  metaCount?: number;
  children: (data: T) => ReactNode;
}>) {
  return (
    <section className={css.section} aria-labelledby={id}>
      <ProfileSectionHeader
        titleId={id}
        title={title}
        description={description}
        icon={<Icon size={23} />}
        action={
          href ? (
            <LinkButton
              className={css.sectionButton}
              href={href}
              variant="secondary"
              iconLeft={<Icon size={17} aria-hidden="true" />}
              renderLink={({ href, className, children, ...props }) => (
                <Link href={href} className={className} {...props}>
                  {children}
                </Link>
              )}
            >
              {actionLabel}
            </LinkButton>
          ) : (
            <Button
              className={css.sectionButton}
              variant="secondary"
              disabled
              iconLeft={<Icon size={17} aria-hidden="true" />}
            >
              {actionLabel}
            </Button>
          )
        }
      />
      {filters}
      {resource.isLoading ? (
        <StatsLoadingSkeleton
          count={count}
          metaCount={metaCount}
          columns={count}
          tabletColumns={2}
          label={`Loading ${title.toLowerCase()}`}
        />
      ) : resource.error || resource.data === null ? (
        <ProfileResourceState
          variant="error"
          title={`${title} could not be loaded`}
          description="The statistics are temporarily unavailable."
          retryLabel="Try again"
          sideActionOnDesktop
          onRetry={resource.retry}
        />
      ) : (
        children(resource.data)
      )}
    </section>
  );
}
