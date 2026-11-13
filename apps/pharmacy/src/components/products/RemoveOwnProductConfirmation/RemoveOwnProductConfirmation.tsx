import { Trash2, X } from 'lucide-react';

import { ConfirmationModal } from '@e-pharmacy/ui/overlays';

import css from './RemoveOwnProductConfirmation.module.css';

//===================================================================

// The owner removes a product selection across ALL owned pharmacies, never one offer.
export function RemoveOwnProductConfirmation({
  productName,
  isLoading,
  onConfirm,
  onCancel,
}: Readonly<{
  productName: string | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}>) {
  return (
    <ConfirmationModal
      isOpen={Boolean(productName)}
      eyebrow="Own products"
      title="Remove product from my pharmacies?"
      description={
        productName
          ? `Remove ${productName} from your own product catalog and all your pharmacies? This is allowed only when no orders or subsequent stock movements exist.`
          : undefined
      }
      destructive
      confirmButtonClassName={css.dangerConfirmButton}
      confirmLabel="Remove product"
      cancelLabel="Keep product"
      confirmIconLeft={<Trash2 size={17} aria-hidden="true" />}
      cancelIconLeft={<X size={17} aria-hidden="true" />}
      isLoading={isLoading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}
