import type { ClientSession } from 'mongoose';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ENTITY_TYPES,
  ADMIN_AUDIT_SECTIONS,
} from '../../constants/admin/audit/admin-audit';

import { User } from '../../models/accounts/user.model';
import { AdminAuditLog } from '../../models/audit/adminAuditLog.model';

import type { ProductRequestResponseDto } from '../../types/catalog/product-request';
import type { ProductCategoryReferenceDto } from '../../types/catalog/product-category';

import {
  serializeProductRequest,
  type ProductRequestDocument,
} from './product-request-projection';

//===============================================================

// Capture the authenticated actor's name at the time of a real status event.
// Never substitute the current owner for the person who performed an action.
export async function getProductRequestHistoryActorName(
  userId: string,
  session: ClientSession
): Promise<string | undefined> {
  const actor = await User.findById(userId)
    .select('name')
    .session(session)
    .lean<{ name?: string } | null>();

  return actor?.name?.trim() || undefined;
}

//===============================================================

// Both authorized detail surfaces expose lifecycle actor names, as pharmacy
// lifecycle history already does. Never expose raw audit records or private notes.
async function withProductRequestHistoryActors(
  request: ProductRequestDocument,
  response: ProductRequestResponseDto,
  currentOwner?: { id: string; name: string }
): Promise<ProductRequestResponseDto> {
  if (!request.history?.length || !response.history) return response;

  const history = request.history;

  const isCreation = (entry: (typeof history)[number]) =>
    entry.status === 'new' &&
    ['request created', 'draft created'].includes(
      entry.title.trim().toLowerCase()
    );

  // Requests created before this change already have a separate audit event.
  // Restore its recorded author only when the creation event is unambiguous.
  const creationEntries = history.filter(isCreation);

  let creationActor: string | undefined;
  let currentOwnerName: string | undefined;

  if (creationEntries.length === 1 && !creationEntries[0]?.actorNameSnapshot) {
    const records = await AdminAuditLog.find({
      section: ADMIN_AUDIT_SECTIONS.PRODUCT_REQUESTS,
      entityType: ADMIN_AUDIT_ENTITY_TYPES.PRODUCT_REQUEST,
      entityId: String(request._id),
      action: ADMIN_AUDIT_ACTIONS.PRODUCT_REQUEST_CREATED,
    })
      .select('actorNameSnapshot')
      .limit(2)
      .lean<{ actorNameSnapshot: string }[]>();

    if (records.length === 1) {
      creationActor = records[0]?.actorNameSnapshot?.trim();
    } else if (records.length === 0 && request.ownerId) {
      // Owner-scoped creation was owner-only. The current name is not a
      // historical snapshot; label it explicitly. Never use legacy pharmacy
      // ownership or an ambiguous audit record to assign a creator.
      const owner =
        currentOwner?.id === String(request.ownerId)
          ? currentOwner
          : await User.findById(request.ownerId)
              .select('name')
              .lean<{ name?: string } | null>();

      currentOwnerName = owner?.name?.trim() || undefined;
    }
  }

  return {
    ...response,

    history: response.history.map((entry, index) => {
      const saved = history[index];

      if (entry.isInferred || !saved) return entry;

      const actorName =
        saved.actorNameSnapshot ||
        (isCreation(saved) ? creationActor : undefined);

      if (actorName) return { ...entry, actorName };

      if (isCreation(saved) && currentOwnerName) {
        return {
          ...entry,
          actorName: currentOwnerName,
          actorNameSource: 'current_owner' as const,
        };
      }

      return entry;
    }),
  };
}

//===============================================================

// Call only after owner scope or Admin permission has been established.
export async function serializeProductRequestDetail(
  request: ProductRequestDocument,
  commentsTotal = 0,
  category?: ProductCategoryReferenceDto,
  currentOwner?: { id: string; name: string }
): Promise<ProductRequestResponseDto> {
  return withProductRequestHistoryActors(
    request,
    serializeProductRequest(request, commentsTotal, category),
    currentOwner
  );
}
