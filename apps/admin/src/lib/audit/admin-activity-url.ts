import { isCalendarDateString } from '@e-pharmacy/validation/dates';
import { isValidObjectId } from '@e-pharmacy/validation/url';

import { ADMIN_ROUTES } from '@/lib/routes';

import {
  ADMIN_AUDIT_ACTIONS,
  ADMIN_AUDIT_ACTOR_TYPES,
  ADMIN_AUDIT_SECTIONS,
  type AdminAuditAction,
  type AdminAuditActorType,
  type AdminAuditSection,
} from './admin-audit';

//===================================================================

export type ActivityUrlState = Readonly<{
  dateFrom: string;
  dateTo: string;
  action: '' | AdminAuditAction;
  actorType: '' | AdminAuditActorType;
  section: '' | AdminAuditSection;
  employeeUserId: string;
  ownerUserId: string;
  page: number;
  perPage: 20 | 50 | 100;
}>;

//===================================================================

export const DEFAULT_ACTIVITY_URL_STATE: ActivityUrlState = {
  dateFrom: '',
  dateTo: '',
  action: '',
  actorType: '',
  section: '',
  employeeUserId: '',
  ownerUserId: '',
  page: 1,
  perPage: 20,
};

//===================================================================

const actionSlug = (value: string) =>
  value
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replaceAll('.', '-')
    .toLowerCase();

const actionSlugs = new Map(
  ADMIN_AUDIT_ACTIONS.map((value) => [actionSlug(value), value])
);

const sectionSlugs = new Map(
  ADMIN_AUDIT_SECTIONS.map((value) => [
    value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
    value,
  ])
);

const actorSlugs = new Map(
  ADMIN_AUDIT_ACTOR_TYPES.map((value) => [
    value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
    value,
  ])
);

//===================================================================

export function parseAdminActivityUrl(
  segments: readonly string[] = []
): ActivityUrlState {
  const next: {
    -readonly [K in keyof ActivityUrlState]: ActivityUrlState[K];
  } = { ...DEFAULT_ACTIVITY_URL_STATE };

  for (const segment of segments) {
    if (segment.startsWith('date-from-')) {
      const date = segment.slice('date-from-'.length);
      if (isCalendarDateString(date)) next.dateFrom = date;
    } else if (segment.startsWith('date-to-')) {
      const date = segment.slice('date-to-'.length);
      if (isCalendarDateString(date)) next.dateTo = date;
    } else if (segment.startsWith('change-type-')) {
      next.action = actionSlugs.get(segment.slice('change-type-'.length)) ?? '';
    } else if (segment.startsWith('changed-by-')) {
      next.actorType =
        actorSlugs.get(segment.slice('changed-by-'.length)) ?? '';
    } else if (segment.startsWith('section-')) {
      const section = sectionSlugs.get(segment.slice('section-'.length));
      next.section = section === 'profile' ? 'employees' : (section ?? '');
    } else if (segment.startsWith('employee-id-')) {
      const id = segment.slice('employee-id-'.length);
      if (isValidObjectId(id)) next.employeeUserId = id;
    } else if (segment.startsWith('owner-id-')) {
      const id = segment.slice('owner-id-'.length);
      if (isValidObjectId(id)) next.ownerUserId = id;
    } else if (/^page-[1-9]\d*$/.test(segment)) {
      const page = Number(segment.slice(5));
      if (Number.isSafeInteger(page)) next.page = page;
    } else if (segment === 'per-page-50') next.perPage = 50;
    else if (segment === 'per-page-100') next.perPage = 100;
  }

  if (next.dateFrom && next.dateTo && next.dateFrom > next.dateTo) {
    next.dateFrom = '';
    next.dateTo = '';
  }

  if (next.employeeUserId && next.ownerUserId) next.ownerUserId = '';

  return next;
}

//===================================================================

export function buildAdminActivityUrl(state: ActivityUrlState): string {
  const segments: string[] = [];

  if (isCalendarDateString(state.dateFrom))
    segments.push(`date-from-${state.dateFrom}`);

  if (isCalendarDateString(state.dateTo))
    segments.push(`date-to-${state.dateTo}`);

  if (state.action && ADMIN_AUDIT_ACTIONS.includes(state.action))
    segments.push(`change-type-${actionSlug(state.action)}`);

  if (state.actorType && ADMIN_AUDIT_ACTOR_TYPES.includes(state.actorType))
    segments.push(
      `changed-by-${state.actorType.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
    );

  if (state.section && ADMIN_AUDIT_SECTIONS.includes(state.section))
    segments.push(
      `section-${(state.section === 'profile' ? 'employees' : state.section).replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`
    );

  if (isValidObjectId(state.employeeUserId))
    segments.push(`employee-id-${state.employeeUserId}`);
  else if (isValidObjectId(state.ownerUserId))
    segments.push(`owner-id-${state.ownerUserId}`);

  if (Number.isSafeInteger(state.page) && state.page > 1)
    segments.push(`page-${state.page}`);

  if (state.perPage === 50 || state.perPage === 100)
    segments.push(`per-page-${state.perPage}`);

  return segments.length
    ? `${ADMIN_ROUTES.SETTINGS_ACTIVITY}/${segments.join('/')}`
    : ADMIN_ROUTES.SETTINGS_ACTIVITY;
}
