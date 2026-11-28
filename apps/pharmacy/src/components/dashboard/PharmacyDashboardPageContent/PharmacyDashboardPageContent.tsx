'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard } from 'lucide-react';

import { PageHeader } from '@e-pharmacy/ui/layout';

import {
  SalesPeriodFilters,
  getSalesPeriodDateRange,
  type SalesPeriodMonth,
} from '@e-pharmacy/ui/charts';

import {
  AllProductStatistics,
  ClientStatistics,
  OrderStatistics,
  OwnProductStatistics,
  ProductRequestStatistics,
} from '@/components/statistics';

import { PHARMACY_ROUTES } from '@/lib/routes';
import { buildOrdersPath } from '@/lib/orders/order-paths';

import { DEFAULT_ORDERS_FILTERS } from '@/lib/orders/orders-filters';

import {
  buildClientsPath,
  DEFAULT_CLIENTS_FILTERS,
} from '@/lib/clients/client-paths';

import { buildOwnProductsPath } from '@/lib/products/own-product-paths';
import { DEFAULT_OWN_PRODUCTS_FILTERS } from '@/lib/products/own-products-filters';
import { buildAllProductsPath } from '@/lib/products/all-product-paths';
import { DEFAULT_ALL_PRODUCTS_FILTERS } from '@/lib/products/all-products-filters';
import { buildProductRequestsPath } from '@/lib/product-requests/product-request-paths';
import { DEFAULT_PRODUCT_REQUESTS_FILTERS } from '@/lib/product-requests/product-requests';

import { OwnedPharmacySearch } from '@/components/pharmacies/OwnedPharmacySearch/OwnedPharmacySearch';
import { SalesChartFilterToolbar } from '@/components/statistics/SalesChartFilterToolbar';

import {
  CURRENT_YEAR,
  loadOrders,
  loadClients,
  loadOwnProducts,
  loadAllProducts,
  loadRequests,
  useDashboardResource,
} from './dashboard-resources';

import {
  DASHBOARD_SECTIONS,
  DashboardStatisticsSection,
} from './DashboardStatisticsSection';

import { DashboardSalesChart } from './DashboardSalesChart';

import css from './PharmacyDashboardPageContent.module.css';

//===================================================================

function GlobalCatalogStatistics() {
  const allProducts = useDashboardResource(loadAllProducts, '');
  const requests = useDashboardResource(loadRequests, '');

  return (
    <>
      <DashboardStatisticsSection
        {...DASHBOARD_SECTIONS.allProducts}
        href={PHARMACY_ROUTES.ALL_PRODUCTS}
        resource={allProducts}
      >
        {(counts) => (
          <AllProductStatistics
            counts={counts}
            getStatisticHref={(key) =>
              buildAllProductsPath({
                ...DEFAULT_ALL_PRODUCTS_FILTERS,
                status: key === 'active' || key === 'blocked' ? key : 'all',
                addedToMyPharmacy:
                  key === 'addedToPharmacy'
                    ? 'yes'
                    : key === 'notAddedToPharmacy'
                      ? 'no'
                      : 'all',
              })
            }
          />
        )}
      </DashboardStatisticsSection>

      <DashboardStatisticsSection
        {...DASHBOARD_SECTIONS.requests}
        href={PHARMACY_ROUTES.PRODUCT_REQUESTS}
        resource={requests}
      >
        {(counts) => (
          <ProductRequestStatistics
            counts={counts}
            getStatusHref={(status) =>
              buildProductRequestsPath({
                ...DEFAULT_PRODUCT_REQUESTS_FILTERS,
                status,
              })
            }
          />
        )}
      </DashboardStatisticsSection>
    </>
  );
}

//===================================================================

function DashboardOrders({ pharmacyId }: Readonly<{ pharmacyId: string }>) {
  const [year, setYear] = useState(CURRENT_YEAR);
  const [month, setMonth] = useState<SalesPeriodMonth>('all');
  const orders = useDashboardResource(loadOrders, pharmacyId, year, month);
  const { dateFrom, dateTo } = getSalesPeriodDateRange(year, month);

  const filters = {
    ...DEFAULT_ORDERS_FILTERS,
    pharmacyId,
    date: { from: dateFrom, to: dateTo },
  };

  return (
    <DashboardStatisticsSection
      {...DASHBOARD_SECTIONS.orders}
      href={buildOrdersPath(filters)}
      resource={orders}
      filters={
        <SalesChartFilterToolbar
          hasFilters={year !== CURRENT_YEAR || month !== 'all'}
          onReset={() => {
            setYear(CURRENT_YEAR);
            setMonth('all');
          }}
        >
          <SalesPeriodFilters
            idPrefix="dashboard-order"
            year={year}
            month={month}
            onYearChange={setYear}
            onMonthChange={setMonth}
          />
        </SalesChartFilterToolbar>
      }
    >
      {(counts) => (
        <OrderStatistics
          counts={counts}
          getStatusHref={(status) => buildOrdersPath({ ...filters, status })}
        />
      )}
    </DashboardStatisticsSection>
  );
}

//===================================================================

function PharmacyDashboardPageContent({
  pharmacyId = '',
}: Readonly<{ pharmacyId?: string }>) {
  const router = useRouter();
  const clients = useDashboardResource(loadClients, pharmacyId);
  const products = useDashboardResource(loadOwnProducts, pharmacyId);
  const clientsFilters = { ...DEFAULT_CLIENTS_FILTERS, pharmacyId };
  const productFilters = { ...DEFAULT_OWN_PRODUCTS_FILTERS, pharmacyId };

  return (
    <main className={css.page} aria-labelledby="dashboard-page-title">
      <section className={css.section}>
        <PageHeader
          title="Dashboard"
          titleId="dashboard-page-title"
          icon={<LayoutDashboard size={23} aria-hidden="true" />}
        />

        <OwnedPharmacySearch
          id="dashboard-pharmacy-search"
          label="Select pharmacy"
          value={pharmacyId}
          explainStatistics
          statisticsContext="dashboard"
          onChange={(id) =>
            router.push(
              id
                ? `${PHARMACY_ROUTES.DASHBOARD}/pharmacy-id-${id}`
                : PHARMACY_ROUTES.DASHBOARD,
              { scroll: false }
            )
          }
        />
      </section>

      <DashboardOrders pharmacyId={pharmacyId} />
      <DashboardSalesChart pharmacyId={pharmacyId} />

      <DashboardStatisticsSection
        {...DASHBOARD_SECTIONS.clients}
        href={buildClientsPath(clientsFilters)}
        resource={clients}
      >
        {(counts) => (
          <ClientStatistics
            counts={counts}
            getStatisticHref={(key) =>
              buildClientsPath({
                ...clientsFilters,
                status: key === 'active' || key === 'blocked' ? key : 'all',
              })
            }
          />
        )}
      </DashboardStatisticsSection>

      <DashboardStatisticsSection
        {...DASHBOARD_SECTIONS.ownProducts}
        href={buildOwnProductsPath(productFilters)}
        resource={products}
      >
        {(counts) => (
          <OwnProductStatistics
            counts={counts}
            getStatisticHref={(key) =>
              buildOwnProductsPath({
                ...productFilters,
                stock:
                  key === 'outOfStock'
                    ? 'empty'
                    : key === 'inStock'
                      ? 'in-stock'
                      : key,
              })
            }
          />
        )}
      </DashboardStatisticsSection>
      {!pharmacyId ? <GlobalCatalogStatistics /> : null}
    </main>
  );
}

export default PharmacyDashboardPageContent;
export { PharmacyDashboardPageContent };
