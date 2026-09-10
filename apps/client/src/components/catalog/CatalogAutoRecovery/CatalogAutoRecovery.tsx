import CatalogCardSkeleton, {
  type CatalogCardSkeletonVariant,
} from '@/components/catalog/CatalogCardSkeleton/CatalogCardSkeleton';

import css from './CatalogAutoRecovery.module.css';

//===================================================================

export type CatalogAutoRecoveryProps = Readonly<{
  label: string;
  compact?: boolean;
  variant?: CatalogCardSkeletonVariant;
}>;

//===================================================================

function CatalogAutoRecovery({
  label,
  compact = false,
  variant = 'product',
}: CatalogAutoRecoveryProps) {
  return (
    <CatalogCardSkeleton
      count={6}
      label={`Loading ${label}`}
      variant={variant}
      className={compact ? css.compact : undefined}
    />
  );
}

export default CatalogAutoRecovery;
