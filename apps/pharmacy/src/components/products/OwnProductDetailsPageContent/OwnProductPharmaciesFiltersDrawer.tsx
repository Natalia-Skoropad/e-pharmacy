import {
  Archive,
  Ban,
  Map,
  MapPin,
  MapPinned,
  PackageCheck,
  PackageX,
  Search,
  ShoppingBag,
} from 'lucide-react';

import { PHARMACY_STATUS_PRESENTATION } from '@e-pharmacy/config/presentation';

import {
  DateFilter,
  SelectField,
  type SelectOption,
} from '@e-pharmacy/ui/forms';

import { FilterDrawer, InfoTooltip } from '@e-pharmacy/ui/overlays';
import { StatusBadge } from '@e-pharmacy/ui/statistics';

import {
  type OwnProductPharmaciesRouteState,
  type ProductPharmacyStockFilter,
  getProductPharmacyLocationKey,
} from '@/lib/products/own-product-pharmacies-paths';

import css from './OwnProductPharmaciesTab.module.css';

//===================================================================

const STATUS_OPTIONS: SelectOption<OwnProductPharmaciesRouteState['status']>[] =
  [
    { value: 'all', label: 'All statuses' },
    ...(
      [
        'new',
        'on_verification',
        'active',
        'on_moderation',
        'on_reactivation',
        'blocked',
      ] as const
    ).map((status) => ({
      value: status,
      label: PHARMACY_STATUS_PRESENTATION[status].label,
      content: <StatusBadge {...PHARMACY_STATUS_PRESENTATION[status]} />,
    })),
  ];

//===================================================================

const AVAILABILITY_OPTIONS: SelectOption<ProductPharmacyStockFilter>[] = [
  { value: 'all', label: 'All availability' },
  {
    value: 'available',
    label: 'Available to sell',
    content: (
      <span className={css.locationOption}>
        <span className={css.locationIcon}>
          <PackageCheck size={16} />
        </span>
        Available to sell
      </span>
    ),
  },
  {
    value: 'reserved',
    label: 'Reserved only',

    content: (
      <span className={css.locationOption}>
        <span className={css.locationIcon}>
          <ShoppingBag size={16} />
        </span>
        Reserved only
      </span>
    ),
  },
  {
    value: 'out-of-stock',
    label: 'Out of stock',

    content: (
      <span className={css.locationOption}>
        <span className={css.locationIcon}>
          <PackageX size={16} />
        </span>
        Out of stock
      </span>
    ),
  },
  {
    value: 'unavailable',
    label: 'Unavailable',

    content: (
      <span className={css.locationOption}>
        <span className={css.locationIcon}>
          <Ban size={16} />
        </span>
        Unavailable
      </span>
    ),
  },
];

//===================================================================

export function OwnProductPharmaciesFiltersDrawer({
  state,
  dates,
  locationOptions,
  locationsLoading,
  onChange,
  onReset,
  onClose,
}: Readonly<{
  state: OwnProductPharmaciesRouteState;
  dates: readonly string[];

  locationOptions: Readonly<{
    regions: readonly string[];
    settlements: readonly string[];
  }>;

  locationsLoading: boolean;
  onChange: (next: Partial<OwnProductPharmaciesRouteState>) => void;
  onReset: () => void;
  onClose: () => void;
}>) {
  const active =
    state.status !== 'all' ||
    state.stock !== 'all' ||
    Boolean(
      state.region || state.settlement || state.date.from || state.date.to
    );

  return (
    <FilterDrawer
      id="own-product-pharmacies-filters-panel"
      eyebrow="Product pharmacies"
      title="Pharmacies filters"
      hasActiveFilters={active}
      onReset={() => {
        onReset();
        onClose();
      }}
      onClose={onClose}
    >
      <DateFilter
        id="product-added-to-pharmacy-date"
        label="Date added to pharmacy"
        value={state.date}
        isActive={Boolean(state.date.from || state.date.to)}
        minDate={dates[0]}
        maxDate={dates[dates.length - 1]}
        availableDates={dates}
        disabled={dates.length === 0}
        applyOnSubmit
        applyLabel="Apply"
        onChange={(date) => onChange({ date })}
      />

      <SelectField
        id="product-pharmacy-status"
        label="Pharmacy status"
        value={state.status}
        options={STATUS_OPTIONS}
        isActive={state.status !== 'all'}
        onChange={(status) => onChange({ status })}
      />

      <SelectField
        id="product-pharmacy-availability"
        label="Product availability"
        value={state.stock}
        options={AVAILABILITY_OPTIONS}
        isActive={state.stock !== 'all'}
        onChange={(stock) => onChange({ stock })}
      />

      <div className={css.regionFilter}>
        <span className={css.regionHelp}>
          <InfoTooltip
            label="How location filters work"
            title="Choose a region first"
            icon={<MapPinned size={19} />}
            escapeOverflow
            items={[
              {
                title: 'Select a region',
                description:
                  'Choose a region to enable the Settlement filter. Only settlements in that region will be available.',
                icon: <Map size={17} />,
              },
              {
                title: 'Narrow the results',
                description:
                  'Select a settlement, or leave All settlements for the whole region.',
                icon: <Search size={17} />,
              },
            ]}
          />
        </span>

        <SelectField
          id="product-pharmacy-region"
          label="Region"
          isLoading={locationsLoading}
          value={state.region}
          options={[
            { value: '', label: 'All regions' },
            ...locationOptions.regions.map((value) => ({
              value: getProductPharmacyLocationKey(value),
              label: value,

              content: (
                <span className={css.locationOption}>
                  <span className={css.locationIcon}>
                    <Map size={16} />
                  </span>
                  {value}
                </span>
              ),
            })),
          ]}
          isActive={Boolean(state.region)}
          onChange={(region) => onChange({ region, settlement: '' })}
        />
      </div>
      <SelectField
        id="product-pharmacy-settlement"
        label="Settlement"
        isLoading={locationsLoading}
        value={state.region ? state.settlement : ''}
        disabled={!state.region}
        options={[
          { value: '', label: 'All settlements' },
          ...locationOptions.settlements.map((value) => ({
            value: getProductPharmacyLocationKey(value),
            label: value,

            content: (
              <span className={css.locationOption}>
                <span className={css.locationIcon}>
                  <MapPin size={16} />
                </span>
                {value}
              </span>
            ),
          })),
        ]}
        isActive={Boolean(state.settlement)}
        onChange={(settlement) => onChange({ settlement })}
      />

      <p className={css.filterNote}>
        <Archive size={16} aria-hidden="true" /> Physical stock and sale
        availability are not the same. Blocked pharmacies may still have stock.
      </p>
    </FilterDrawer>
  );
}
