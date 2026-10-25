import type { PipelineStage } from 'mongoose';

import { getEndOfDay, getStartOfDay } from '../../utils/date-range';
import { createSafeRegExp } from '../../utils/regexp';
import type { ClientsQuery } from '../../schemas/clients/client.schema';

//===============================================================

export function buildClientFilterStages(
  query: ClientsQuery
): PipelineStage.FacetPipelineStage[] {
  const match: Record<string, unknown> = {};

  if (query.firstOrderFrom || query.firstOrderTo) {
    match.firstOrderAt = {
      ...(query.firstOrderFrom
        ? { $gte: getStartOfDay(query.firstOrderFrom) }
        : {}),

      ...(query.firstOrderTo ? { $lte: getEndOfDay(query.firstOrderTo) } : {}),
    };
  }

  if (query.clientId?.trim()) {
    match.id = createSafeRegExp(query.clientId.trim());
  }

  if (query.name?.trim()) {
    match.name = createSafeRegExp(query.name.trim());
  }

  if (query.contact?.trim()) {
    const contact = createSafeRegExp(query.contact.trim());

    match.$or = [{ email: contact }, { phone: contact }, { address: contact }];
  }

  if (query.email?.trim()) {
    match.email = createSafeRegExp(query.email.trim());
  }

  if (query.phone?.trim()) {
    match.phone = createSafeRegExp(query.phone.trim());
  }

  if (query.address?.trim()) {
    match.address = createSafeRegExp(query.address.trim());
  }

  if (query.status) {
    match.status = query.status;
  }

  if (query.successfulOrders === 'repeat') {
    match.successfulOrdersCount = { $gte: 2 };
  } else if (query.successfulOrders === 'successful') {
    match.successfulOrdersCount = { $gte: 1 };
  } else if (query.successfulOrders === 'other') {
    match.successfulOrdersCount = 0;
  }

  return Object.keys(match).length ? [{ $match: match }] : [];
}
