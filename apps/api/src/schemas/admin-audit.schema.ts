import { z } from 'zod';

import {
  ADMIN_AUDIT_LIMITS,
  isAdminAuditAction,
  isAdminAuditEntityType,
  type AdminAuditAction,
  type AdminAuditEntityType,
} from '../constants/admin-audit';

import { mongoIdSchema } from './shared';

//===============================================================

function isValidCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

//===============================================================

const calendarDateSchema = z
  .string()
  .refine(isValidCalendarDate, 'Expected a valid YYYY-MM-DD date.');

const auditActionSchema = z.custom<AdminAuditAction>(isAdminAuditAction, {
  message: 'Unknown audit action.',
});

const auditEntityTypeSchema = z.custom<AdminAuditEntityType>(
  isAdminAuditEntityType,
  { message: 'Unknown audit entity type.' }
);

//===============================================================

export const adminAuditListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    perPage: z.coerce
      .number()
      .int()
      .refine((value) => value === 20 || value === 50 || value === 100, {
        message: 'perPage must be 20, 50, or 100.',
      })
      .default(20),

    dateFrom: calendarDateSchema.optional(),
    dateTo: calendarDateSchema.optional(),
    action: auditActionSchema.optional(),
    entityType: auditEntityTypeSchema.optional(),

    entityId: z
      .string()
      .trim()
      .min(1)
      .max(ADMIN_AUDIT_LIMITS.entityId)
      .optional(),

    actorUserId: mongoIdSchema.optional(),

    requestId: z
      .string()
      .trim()
      .min(1)
      .max(ADMIN_AUDIT_LIMITS.requestId)
      .optional(),
  })

  .superRefine((query, context) => {
    if (query.dateFrom && query.dateTo && query.dateFrom > query.dateTo) {
      context.addIssue({
        code: 'custom',
        path: ['dateTo'],
        message: 'dateTo must not be earlier than dateFrom.',
      });
    }
  });

//===============================================================

export const adminAuditLogParamsSchema = z.object({
  auditLogId: mongoIdSchema,
});

//===============================================================

export type AdminAuditListQuery = z.infer<typeof adminAuditListQuerySchema>;
export type AdminAuditLogParams = z.infer<typeof adminAuditLogParamsSchema>;
