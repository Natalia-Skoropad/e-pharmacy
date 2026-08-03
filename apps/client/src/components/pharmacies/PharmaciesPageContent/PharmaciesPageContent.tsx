import { LinkPagination } from '@e-pharmacy/ui/navigation';
import type { PharmacyCardSummary } from '@e-pharmacy/types/pharmacies';

import type { ResourceState } from '@/lib/api/resource-state';
import type { CatalogResourceState } from '@/lib/catalog/catalog-resource-state';

import {
  buildPharmacyPath,
  getPharmaciesSeoContent,
  getPharmacyTitle,
  shouldShowPharmaciesSeoText,
  type PharmacyFilters,
} from '@/lib/catalog/pharmacies-catalog';

import { ROUTES } from '@/lib/routes';

import CatalogPageShell from '@/components/catalog/CatalogPageShell/CatalogPageShell';
import CatalogResourceStateView from '@/components/catalog/CatalogResourceState/CatalogResourceState';
import CatalogSeoCard from '@/components/catalog/CatalogSeoCard/CatalogSeoCard';
import PharmaciesCatalogFiltersForm from '@/components/pharmacies/PharmaciesCatalogFiltersForm/PharmaciesCatalogFiltersForm';
import PharmaciesList from '@/components/pharmacies/PharmaciesList/PharmaciesList';

//===================================================================

export type PharmaciesPageContentProps = Readonly<{
  pharmacies: readonly PharmacyCardSummary[];
  total: number;
  totalPages: number;
  filters: PharmacyFilters;
  cityOptions: string[];
  resourceState: CatalogResourceState;
  filtersState: ResourceState;
}>;

//===================================================================

function buildPharmacyPageHref(filters: PharmacyFilters, page: number) {
  return buildPharmacyPath({ ...filters, page });
}

//===================================================================

function PharmaciesPageContent({
  pharmacies,
  total,
  totalPages,
  filters,
  cityOptions,
  resourceState,
  filtersState,
}: PharmaciesPageContentProps) {
  const pageTitle = getPharmacyTitle(filters);
  const showSeoText = total > 0 && shouldShowPharmaciesSeoText(filters);
  const seoContent = getPharmaciesSeoContent(filters);
  const emptyIsFiltered =
    resourceState.status === 'empty' && resourceState.reason === 'no-matches';

  return (
    <CatalogPageShell
      title={pageTitle}
      titleId="pharmacies-title"
      breadcrumbs={[
        { label: 'Home', href: ROUTES.HOME },
        { label: 'Pharmacies', href: ROUTES.PHARMACIES },
        ...(filters.city ? [{ label: filters.city }] : []),
      ]}
      filters={
        <PharmaciesCatalogFiltersForm
          filters={filters}
          cityOptions={cityOptions}
          visiblePharmaciesCount={pharmacies.length}
          pharmaciesCount={total}
        />
      }
      notices={
        filtersState.status === 'unavailable' ? (
          <div role="status">
            City filters are temporarily unavailable. The pharmacy list is still
            shown without city normalization.
          </div>
        ) : undefined
      }
      results={
        <CatalogResourceStateView
          state={resourceState}
          emptyTitle={
            emptyIsFiltered
              ? 'No matching pharmacies'
              : 'No pharmacies available'
          }
          emptyMessage={
            emptyIsFiltered
              ? 'No pharmacies match the selected city or search. Try changing or resetting the filters.'
              : 'No pharmacies are available in the catalog yet.'
          }
          unavailableMessage="Pharmacies are temporarily unavailable. Please try again later."
        >
          <PharmaciesList pharmacies={pharmacies} />
        </CatalogResourceStateView>
      }
      pagination={
        resourceState.status === 'success' && totalPages > 1 ? (
          <LinkPagination
            currentPage={filters.page}
            totalPages={totalPages}
            getPageHref={(page) => buildPharmacyPageHref(filters, page)}
            ariaLabel="Pharmacies pagination"
          />
        ) : undefined
      }
      seo={
        showSeoText ? (
          <CatalogSeoCard
            title="Choose a pharmacy before preparing an order request"
            titleId="pharmacies-seo-title"
          >
            <p>{seoContent.intro}</p>
            <p>{seoContent.comparison}</p>
            <p>{seoContent.ordering}</p>
          </CatalogSeoCard>
        ) : undefined
      }
    />
  );
}

export default PharmaciesPageContent;
