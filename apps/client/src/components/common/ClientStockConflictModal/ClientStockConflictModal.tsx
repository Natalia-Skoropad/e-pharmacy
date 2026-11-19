'use client';

import Link from 'next/link';
import { useId } from 'react';

import {
  AlertTriangle,
  ExternalLink,
  PencilLine,
  RefreshCw,
} from 'lucide-react';

import { ModalBase, ModalRoot } from '@e-pharmacy/ui/overlays';
import { Button, CloseIconButton } from '@e-pharmacy/ui/primitives';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { formatInitials } from '@e-pharmacy/ui/data-display';

import { buildProductPath } from '@/lib/routes';

import css from './ClientStockConflictModal.module.css';

//===================================================================

export type ClientStockConflictProduct = Readonly<{
  productId: string;
  name: string;
  imageUrl?: string;
  requested: number;
  available: number | null;
}>;

type ClientStockConflictModalProps = Readonly<{
  products: readonly ClientStockConflictProduct[];
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}>;

//===================================================================

export function ClientStockConflictModal({
  products,
  description = 'Another order reserved some of the requested products while you were preparing your order. No products were reserved for this order. Review the updated quantities before trying again.',
  confirmLabel = 'Review cart',
  cancelLabel = 'Keep editing',
  onConfirm,
  onCancel,
}: ClientStockConflictModalProps) {
  const titleId = useId();
  const noticeId = useId();

  return (
    <ModalRoot>
      <ModalBase
        isOpen
        labelledBy={titleId}
        describedBy={noticeId}
        dialogClassName={css.scrollableDialog}
        onClose={onCancel}
      >
        <div className={css.content}>
          <div className={css.header}>
            <div className={css.heading}>
              <p className={css.eyebrow}>Stock update</p>
              <h2 id={titleId} className={css.title}>
                Not enough products are available
              </h2>
            </div>
            <CloseIconButton label="Close stock update" onClick={onCancel} />
          </div>

          <section className={css.notice} id={noticeId}>
            <span className={css.noticeIcon} aria-hidden="true">
              <AlertTriangle size={18} />
            </span>
            <div className={css.noticeCopy}>
              <strong>Available quantities changed</strong>
              <p>{description}</p>
            </div>
          </section>

          <section className={css.details} aria-label="Products to review">
            <h3 className={css.detailsTitle}>
              Products to review ({products.length})
            </h3>
            {products.length ? (
              <ul className={css.detailsList}>
                {products.map((product) => {
                  const href = buildProductPath(
                    product.name,
                    product.productId
                  );
                  return (
                    <li key={product.productId} className={css.detailItem}>
                      <TableImagePreview
                        src={product.imageUrl}
                        alt={`${product.name} photo`}
                        fallback={formatInitials(product.name, 'P')}
                        size={40}
                      />
                      <div className={css.productInfo}>
                        <Link
                          href={href}
                          className={css.productLink}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {product.name}
                        </Link>
                        <p>
                          Requested {product.requested}, available{' '}
                          {product.available === null
                            ? 'not yet verified'
                            : product.available}
                          .
                        </p>
                      </div>
                      <Link
                        href={href}
                        className={css.linkIcon}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${product.name} in a new tab`}
                      >
                        <ExternalLink size={16} aria-hidden="true" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className={css.detailsFallback}>
                Current quantities could not be verified. Review the cart before
                trying again.
              </p>
            )}
          </section>

          <div className={css.actions}>
            <Button
              type="button"
              iconLeft={<RefreshCw size={17} aria-hidden="true" />}
              onClick={onConfirm}
            >
              {confirmLabel}
            </Button>
            <Button
              type="button"
              variant="secondary"
              iconLeft={<PencilLine size={17} aria-hidden="true" />}
              onClick={onCancel}
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </ModalBase>
    </ModalRoot>
  );
}
