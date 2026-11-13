'use client';

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
}: Readonly<{
  productId: string;
  enabled: boolean;
}>) {
  if (!enabled)
    return (
      <p className={css.emptyPanel}>
        This product has not been added to your own catalog yet.
      </p>
    );

  return (
    <EntityComments
      entityKey={`product:${productId}`}
      presentation="profile"
      title="Comments"
      description="Private comments about this product, visible to authorized pharmacy members."
      commentTitle="Product comment"
      emptyTitle="No product comments yet."
      emptyText="Authorized pharmacy members can leave internal notes about this product."
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
    />
  );
}
