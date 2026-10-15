import type {
  PharmacyCardSummary,
  PharmacyLocationFilterOption,
  PharmacyOption,
} from '@e-pharmacy/types/pharmacies';

import { LinkPagination } from '@e-pharmacy/ui/navigation';

import type { ResourceState } from '@/lib/api/resource-state';
import type { CatalogResourceState } from '@/lib/catalog/catalog-resource-state';

import {
  buildPharmacyPath,
  formatPharmacyLocationLabel,
  getPharmaciesSeoContent,
  getPharmacyTitle,
  normalizeLocationKey,
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
  locationOptions: readonly PharmacyLocationFilterOption[];
  pharmacyOptions: readonly PharmacyOption[];
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
  locationOptions,
  pharmacyOptions,
  resourceState,
}: PharmaciesPageContentProps) {
  const selectedPharmacyName = filters.pharmacyId
    ? pharmacyOptions.find((option) => option.id === filters.pharmacyId)?.name
    : undefined;

  const pageTitle = getPharmacyTitle(filters, selectedPharmacyName);
  const showSeoText = total > 0 && shouldShowPharmaciesSeoText(filters);
  const seoContent = getPharmaciesSeoContent(filters, selectedPharmacyName);

  const emptyIsFiltered =
    resourceState.status === 'empty' && resourceState.reason === 'no-matches';

  const selectedLocation = filters.settlement
    ? locationOptions.find(
        (option) =>
          normalizeLocationKey(option.settlement) ===
            normalizeLocationKey(filters.settlement) &&
          normalizeLocationKey(option.region ?? '') ===
            normalizeLocationKey(filters.region)
      )
    : undefined;

  const selectedLocationLabel = filters.settlement
    ? formatPharmacyLocationLabel(
        selectedLocation?.settlement ?? filters.settlement,
        selectedLocation?.region ?? filters.region
      )
    : '';

  return (
    <CatalogPageShell
      title={pageTitle}
      titleId="pharmacies-title"
      breadcrumbs={[
        { label: 'Home', href: ROUTES.HOME },
        { label: 'Pharmacies', href: ROUTES.PHARMACIES },
        ...(selectedLocationLabel
          ? [
              {
                label: selectedLocationLabel,
                ...(filters.pharmacyId
                  ? {
                      href: buildPharmacyPath({
                        settlement: filters.settlement,
                        region: filters.region,
                      }),
                    }
                  : {}),
              },
            ]
          : []),

        ...(filters.pharmacyId
          ? [{ label: selectedPharmacyName || 'Selected pharmacy' }]
          : []),
      ]}
      filters={
        <PharmaciesCatalogFiltersForm
          filters={filters}
          locationOptions={locationOptions}
          pharmacyOptions={pharmacyOptions}
          visiblePharmaciesCount={pharmacies.length}
          pharmaciesCount={total}
        />
      }
      notices={undefined}
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
              ? 'No pharmacies match the selected location or search. ' +
                'Try changing or resetting the filters.'
              : 'No pharmacies are available in the catalog yet.'
          }
          unavailableMessage="Pharmacies are loading."
          recoveryLabel="pharmacies"
          skeletonVariant="pharmacy"
          emptyVariant="resource"
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
            title="Choose a pharmacy for your order"
            titleId="pharmacies-seo-title"
          >
            <p>
              {filters.pharmacyId && selectedPharmacyName ? (
                <>
                  Explore <strong>{selectedPharmacyName}</strong>
                  {selectedLocationLabel ? (
                    <>
                      {' '}
                      in <strong>{selectedLocationLabel}</strong>
                    </>
                  ) : null}{' '}
                  on E-PHARMACY.
                </>
              ) : selectedLocationLabel && !filters.pharmacyId ? (
                <>
                  Browse <strong>pharmacies in {selectedLocationLabel}</strong>{' '}
                  participating in E-PHARMACY.
                </>
              ) : (
                seoContent.intro
              )}
            </p>
            <p>{seoContent.comparison}</p>
            <p>{seoContent.ordering}</p>
          </CatalogSeoCard>
        ) : undefined
      }
    />
  );
}

export default PharmaciesPageContent;
