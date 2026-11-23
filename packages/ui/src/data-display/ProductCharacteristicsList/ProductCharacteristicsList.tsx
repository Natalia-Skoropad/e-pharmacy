import {
  Award,
  Building2,
  FlaskConical,
  Layers3,
  ListOrdered,
  PackageOpen,
} from 'lucide-react';

import css from './ProductCharacteristicsList.module.css';

//===================================================================

/** One characteristic vocabulary and icon set for pharmacy and public catalogs. */
export type ProductCharacteristicValues = Readonly<{
  brand?: string;
  series?: string;
  manufacturer?: string;
  releaseForm?: string;
  activeIngredients?: string;
  activeIngredientCount?: string;
}>;

//===================================================================

export function ProductCharacteristicsList({
  product,
}: Readonly<{ product: ProductCharacteristicValues }>) {
  const rows = [
    { label: 'Brand', value: product.brand, Icon: Award },
    { label: 'Series / Line', value: product.series, Icon: Layers3 },
    { label: 'Manufacturer', value: product.manufacturer, Icon: Building2 },
    { label: 'Release form', value: product.releaseForm, Icon: PackageOpen },
    {
      label: 'Active ingredients',
      value: product.activeIngredients,
      Icon: FlaskConical,
    },
    {
      label: 'Active ingredient count',
      value: product.activeIngredientCount,
      Icon: ListOrdered,
    },
  ] as const;

  const populatedRows = rows.filter(
    ({ value }) => typeof value === 'string' && value.trim().length > 0
  );

  if (populatedRows.length === 0) return null;

  return (
    <dl className={css.list}>
      {populatedRows.map(({ label, value, Icon }) => (
        <div className={css.item} key={label}>
          <dt>
            <span className={css.icon} aria-hidden="true">
              <Icon size={16} />
            </span>
            {label}
          </dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
