import { PackagePlus, X } from 'lucide-react';

import { ConfirmationModal } from '@e-pharmacy/ui/overlays';

import css from './OwnerAddProductConfirmation.module.css';

//===================================================================

/** Shared owner-wide confirmation for the catalog list and product details. */
export function OwnerAddProductConfirmation({
  isOpen,
  productName,
  isLoading = false,
  onConfirm,
  onCancel,
}: Readonly<{
  isOpen: boolean;
  productName?: string;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
    <ConfirmationModal
      isOpen={isOpen}
      eyebrow="ALL PRODUCTS"
      title="Add product to eligible pharmacies?"
      description={
        <div className={css.copy}>
          {productName ? (
            <p>
              <strong>{productName}</strong> will be added to all your Active
              and On moderation pharmacies.
            </p>
          ) : null}
          <p>
            When another pharmacy becomes Active, missing selected products will
            be added automatically. Existing products, prices and stock will not
            be duplicated or overwritten.
          </p>
        </div>
      }
      confirmLabel="Add to pharmacy"
      cancelLabel="Cancel"
      confirmIconLeft={<PackagePlus size={17} aria-hidden="true" />}
      cancelIconLeft={<X size={17} aria-hidden="true" />}
      isLoading={isLoading}
      closeOnBackdrop={!isLoading}
      closeOnEscape={!isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
