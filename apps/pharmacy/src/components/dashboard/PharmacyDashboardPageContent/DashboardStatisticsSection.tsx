import type { ReactNode } from 'react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { LinkButton } from '@e-pharmacy/ui/navigation';

import {
  ProfileResourceState,
  ProfileSectionHeader,
} from '@e-pharmacy/ui/profile';

import { StatsLoadingSkeleton } from '@e-pharmacy/ui/statistics';

import css from './PharmacyDashboardPageContent.module.css';

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
  children,
}: Readonly<{
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  actionLabel: string;
  resource: Resource<T>;
  count?: number;
  filters?: ReactNode;
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
        }
      />
      {filters}
      {resource.isLoading ? (
        <StatsLoadingSkeleton
          count={count}
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
