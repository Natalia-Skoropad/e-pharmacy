'use client';

import { useState } from 'react';

import {
  getPharmacyNotes,
  createPharmacyNote,
  deletePharmacyNote,
} from '@/lib/api/browser';

import { EntityComments } from '@/components/comments/EntityComments';

import css from './OwnProductDetailsPageContent.module.css';

//===================================================================

export function OwnProductCommentsTab({
  productId,
  enabled,
  onTotalChange,
}: Readonly<{
  productId: string;
  enabled: boolean;
  onTotalChange: (value: number) => void;
}>) {
  const [total, setTotal] = useState<number | undefined>(undefined);
  if (!enabled)
    return (
      <p className={css.emptyPanel}>
        Choose a pharmacy carrying this product to manage its comments.
      </p>
    );

  return (
    <EntityComments
      entityKey={`product:${productId}`}
      initialTotal={total}
      load={(page, options) =>
        getPharmacyNotes('product', productId, page, options)
      }
      create={(text, options) =>
        createPharmacyNote(
          'product',
          productId,
          text,
          options.clientRequestId,
          options
        )
      }
      remove={(id, options) =>
        deletePharmacyNote('product', productId, id, options)
      }
      onTotalChange={(value) => {
        setTotal(value);
        onTotalChange(value);
      }}
    />
  );
}
