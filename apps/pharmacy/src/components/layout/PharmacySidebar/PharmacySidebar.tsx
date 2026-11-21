'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CabinetSidebar } from '@e-pharmacy/ui/cabinet';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { getOwnedPharmacyStatistics } from '@/lib/api/browser/owned-pharmacy-registry.api';
import { subscribeToPharmacyCounterRefresh } from '@/lib/pharmacies/pharmacy-counter-refresh';
import { PHARMACY_NAVIGATION } from '@/lib/layout/navigation';

import {
  isLegacyOperationalPharmacyPath,
  withSelectedPharmacyQuery,
} from '@/lib/pharmacies/selected-pharmacy-scope';

import { usePharmacySelection } from '@/providers/PharmacySelectionProvider';

import {
  useOrderNavigationCounts,
  useProductRequestNavigationCounts,
} from '@/hooks/usePharmacyNavigationCounters';

import {
  formatVisibleOrderCount,
  getCollapsedOrderNotificationLabel,
  getOrderCountAriaLabel,
  hasOrderNotifications,
} from './order-counter-presentation';

import css from './PharmacySidebar.module.css';

//===================================================================

type PharmacySidebarProps = Readonly<{
  isCollapsed: boolean;
  onToggleCollapsed: () => void;
}>;

//===================================================================

export function PharmacySidebar({
  isCollapsed,
  onToggleCollapsed,
}: PharmacySidebarProps) {
  const pathname = usePathname();
  const { selectedId } = usePharmacySelection();
  const orderCounts = useOrderNavigationCounts();
  const productRequestCounts = useProductRequestNavigationCounts();

  const scopedHref = (href: string) =>
    selectedId && isLegacyOperationalPharmacyPath(href)
      ? withSelectedPharmacyQuery(href, '', selectedId)
      : href;

  const [pharmacyCounts, setPharmacyCounts] = useState<null | {
    new: number;
    onVerification: number;
    onModeration: number;
    onReactivation: number;
  }>(null);

  useEffect(() => {
    let generation = 0;
    let activeController: AbortController | null = null;

    const refresh = async () => {
      const version = ++generation;

      activeController?.abort();

      const controller = new AbortController();

      activeController = controller;

      try {
        const stats = await getOwnedPharmacyStatistics({
          signal: controller.signal,
        });

        if (controller.signal.aborted || generation !== version) return;

        setPharmacyCounts({
          new: stats.new,
          onVerification: stats.onVerification,
          onModeration: stats.onModeration,
          onReactivation: stats.onReactivation,
        });
      } catch {
        if (!controller.signal.aborted && generation === version) {
          setPharmacyCounts(null);
        }
      } finally {
        if (activeController === controller) activeController = null;
      }
    };

    const onFocus = () => {
      if (activeController) return;

      void refresh();
    };

    void refresh();

    const unsubscribe = subscribeToPharmacyCounterRefresh(onFocus);

    window.addEventListener('focus', onFocus);

    return () => {
      generation += 1;
      activeController?.abort();
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return (
    <CabinetSidebar
      className={css.sidebar}
      items={PHARMACY_NAVIGATION}
      activePath={pathname}
      ariaLabel="Pharmacy navigation"
      logoHref={PHARMACY_ROUTES.DASHBOARD}
      logoLabel="E-PHARMACY"
      logoAriaLabel="E-PHARMACY pharmacy dashboard"
      isCollapsed={isCollapsed}
      collapseLabel="Collapse pharmacy menu"
      expandLabel="Expand pharmacy menu"
      onToggleCollapsed={onToggleCollapsed}
      renderLogoLink={({ href, className, children, ...props }) => (
        <Link href={scopedHref(href)} className={className} {...props}>
          {children}
        </Link>
      )}
      renderLink={({ item, href, className, children, ...props }) => {
        const isOrdersLink = item.href === PHARMACY_ROUTES.ORDERS;
        const isPharmaciesLink = item.href === PHARMACY_ROUTES.PHARMACIES;

        const isProductRequestsLink =
          item.href === PHARMACY_ROUTES.PRODUCT_REQUESTS;

        const showPharmacyCounters = Boolean(
          isPharmaciesLink &&
          pharmacyCounts &&
          (pharmacyCounts.new ||
            pharmacyCounts.onVerification ||
            pharmacyCounts.onModeration ||
            pharmacyCounts.onReactivation)
        );

        const hasNotifications = Boolean(
          isOrdersLink && orderCounts && hasOrderNotifications(orderCounts)
        );

        const showProductRequestCounters = Boolean(
          isProductRequestsLink &&
          productRequestCounts &&
          (productRequestCounts.draft ||
            productRequestCounts.new ||
            productRequestCounts.inProgress)
        );

        return (
          <Link
            href={scopedHref(href)}
            className={
              isOrdersLink || isPharmaciesLink || isProductRequestsLink
                ? `${className} ${css.ordersLink}`
                : className
            }
            {...props}
          >
            {children}

            {!isCollapsed && hasNotifications && orderCounts ? (
              <span className={css.orderCounters}>
                {orderCounts.new > 0 ? (
                  <span
                    className={css.newCounter}
                    aria-label={getOrderCountAriaLabel(orderCounts.new, 'new')}
                  >
                    {formatVisibleOrderCount(orderCounts.new)}
                  </span>
                ) : null}

                {orderCounts.inProgress > 0 ? (
                  <span
                    className={css.progressCounter}
                    aria-label={getOrderCountAriaLabel(
                      orderCounts.inProgress,
                      'in_progress'
                    )}
                  >
                    {formatVisibleOrderCount(orderCounts.inProgress)}
                  </span>
                ) : null}
              </span>
            ) : null}

            {!isCollapsed && showPharmacyCounters && pharmacyCounts ? (
              <span
                className={css.orderCounters}
                aria-label="Pharmacy status totals"
              >
                {pharmacyCounts.new > 0 ? (
                  <span
                    className={css.newCounter}
                    aria-label={`${pharmacyCounts.new} new pharmacies`}
                  >
                    {formatVisibleOrderCount(pharmacyCounts.new)}
                  </span>
                ) : null}

                {pharmacyCounts.onVerification > 0 ? (
                  <span
                    className={css.verificationCounter}
                    aria-label={`${pharmacyCounts.onVerification} pharmacies on verification`}
                  >
                    {formatVisibleOrderCount(pharmacyCounts.onVerification)}
                  </span>
                ) : null}

                {pharmacyCounts.onModeration > 0 ? (
                  <span
                    className={css.moderationCounter}
                    aria-label={`${pharmacyCounts.onModeration} pharmacies on moderation`}
                  >
                    {formatVisibleOrderCount(pharmacyCounts.onModeration)}
                  </span>
                ) : null}

                {pharmacyCounts.onReactivation > 0 ? (
                  <span
                    className={css.reactivationCounter}
                    aria-label={`${pharmacyCounts.onReactivation} pharmacies awaiting reactivation`}
                  >
                    {formatVisibleOrderCount(pharmacyCounts.onReactivation)}
                  </span>
                ) : null}
              </span>
            ) : null}
            {!isCollapsed &&
            showProductRequestCounters &&
            productRequestCounts ? (
              <span
                className={css.orderCounters}
                aria-label="Product request status totals"
              >
                {productRequestCounts.draft > 0 ? (
                  <span
                    className={css.draftCounter}
                    aria-label={`${productRequestCounts.draft} draft product requests`}
                  >
                    {formatVisibleOrderCount(productRequestCounts.draft)}
                  </span>
                ) : null}

                {productRequestCounts.new > 0 ? (
                  <span
                    className={css.newCounter}
                    aria-label={`${productRequestCounts.new} new product requests`}
                  >
                    {formatVisibleOrderCount(productRequestCounts.new)}
                  </span>
                ) : null}

                {productRequestCounts.inProgress > 0 ? (
                  <span
                    className={css.moderationCounter}
                    aria-label={`${productRequestCounts.inProgress} product requests in work`}
                  >
                    {formatVisibleOrderCount(productRequestCounts.inProgress)}
                  </span>
                ) : null}
              </span>
            ) : null}

            {isCollapsed &&
            showProductRequestCounters &&
            productRequestCounts ? (
              <span
                className={css.collapsedProductRequestCounters}
                aria-label={[
                  productRequestCounts.draft > 0
                    ? `${productRequestCounts.draft} draft product requests`
                    : '',

                  productRequestCounts.new > 0
                    ? `${productRequestCounts.new} new product requests`
                    : '',

                  productRequestCounts.inProgress > 0
                    ? `${productRequestCounts.inProgress} product requests in work`
                    : '',
                ]
                  .filter(Boolean)
                  .join(', ')}
              >
                {productRequestCounts.draft > 0 ? (
                  <span className={css.collapsedDraftDot} aria-hidden="true" />
                ) : null}

                {productRequestCounts.new > 0 ? (
                  <span className={css.collapsedNewDot} aria-hidden="true" />
                ) : null}

                {productRequestCounts.inProgress > 0 ? (
                  <span
                    className={css.collapsedModerationDot}
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            ) : null}

            {isCollapsed &&
            showPharmacyCounters &&
            pharmacyCounts &&
            (pharmacyCounts.new > 0 ||
              pharmacyCounts.onVerification > 0 ||
              pharmacyCounts.onModeration > 0 ||
              pharmacyCounts.onReactivation > 0) ? (
              <span
                className={css.collapsedPharmacyCounters}
                aria-label={[
                  pharmacyCounts.new > 0
                    ? `${pharmacyCounts.new} new pharmacies`
                    : '',

                  pharmacyCounts.onVerification > 0
                    ? `${pharmacyCounts.onVerification} on verification`
                    : '',

                  pharmacyCounts.onModeration > 0
                    ? `${pharmacyCounts.onModeration} on moderation`
                    : '',

                  pharmacyCounts.onReactivation > 0
                    ? `${pharmacyCounts.onReactivation} awaiting reactivation`
                    : '',
                ]
                  .filter(Boolean)
                  .join(', ')}
              >
                {pharmacyCounts.new > 0 ? (
                  <span className={css.collapsedNewDot} aria-hidden="true" />
                ) : null}

                {pharmacyCounts.onVerification > 0 ? (
                  <span
                    className={css.collapsedVerificationDot}
                    aria-hidden="true"
                  />
                ) : null}

                {pharmacyCounts.onModeration > 0 ? (
                  <span
                    className={css.collapsedModerationDot}
                    aria-hidden="true"
                  />
                ) : null}

                {pharmacyCounts.onReactivation > 0 ? (
                  <span
                    className={css.collapsedReactivationDot}
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            ) : null}

            {isCollapsed && hasNotifications && orderCounts ? (
              <span
                className={css.collapsedOrderCounters}
                aria-label={getCollapsedOrderNotificationLabel(orderCounts)}
              >
                {orderCounts.new > 0 ? (
                  <span className={css.collapsedNewDot} aria-hidden="true" />
                ) : null}

                {orderCounts.inProgress > 0 ? (
                  <span
                    className={css.collapsedModerationDot}
                    aria-hidden="true"
                  />
                ) : null}
              </span>
            ) : null}
          </Link>
        );
      }}
    />
  );
}
