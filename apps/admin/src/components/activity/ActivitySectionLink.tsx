import {
  Boxes,
  Building2,
  FilePenLine,
  FilePlus2,
  FileText,
  MessageSquareText,
  BriefcaseBusiness,
  ShoppingBag,
  Tags,
  UserCog,
  Users,
} from 'lucide-react';

import { formatInitials } from '@e-pharmacy/ui/data-display';
import { TableImagePreview } from '@e-pharmacy/ui/media';
import { TextActionButton } from '@e-pharmacy/ui/primitives';

import type {
  AdminAuditListItem,
  AdminAuditSection,
} from '@/lib/audit/admin-audit';

import {
  getAdminAuditLocation,
  getAdminAuditPageLocation,
} from '@/lib/audit/admin-audit-presentation';

import css from './ActivityHistory.module.css';

//===================================================================

function SectionIcon({ section }: Readonly<{ section: AdminAuditSection }>) {
  const props = { size: 16, 'aria-hidden': true as const };

  switch (section) {
    case 'profile':
      return <UserCog {...props} />;
    case 'pharmacyOwners':
      return <UserCog {...props} />;
    case 'pharmacies':
      return <Building2 {...props} />;
    case 'products':
      return <Boxes {...props} />;
    case 'productRequests':
      return <FilePlus2 {...props} />;
    case 'clients':
      return <Users {...props} />;
    case 'orders':
      return <ShoppingBag {...props} />;
    case 'productReviews':
    case 'pharmacyReviews':
      return <MessageSquareText {...props} />;
    case 'employees':
      return <UserCog {...props} />;
    case 'positions':
      return <BriefcaseBusiness {...props} />;
    case 'sitePages':
      return <FileText {...props} />;
    case 'categories':
      return <Tags {...props} />;
    default:
      return <FilePenLine {...props} />;
  }
}

//===================================================================

type ActivitySectionLinkProps = Readonly<{
  item: Pick<
    AdminAuditListItem,
    | 'actorUserId'
    | 'entityId'
    | 'entityLabelSnapshot'
    | 'entityType'
    | 'section'
    | 'scopeEntityType'
    | 'scopeEntityId'
  >;
}>;

//===================================================================

export function ActivitySectionLink({ item }: ActivitySectionLinkProps) {
  const location = getAdminAuditLocation(item);

  return (
    <TextActionButton className={css.sectionLink} href={location.href}>
      <span className={css.sectionIcon}>
        <SectionIcon section={location.section} />
      </span>
      <span className={css.sectionLinkLabel}>{location.label}</span>
    </TextActionButton>
  );
}

//===================================================================

export function ActivityPageLink({
  item,
  photoUrl,
  pageName,
}: ActivitySectionLinkProps &
  Readonly<{ photoUrl?: string; pageName?: string }>) {
  const location = getAdminAuditPageLocation(item);
  if (!location) return <span className={css.pageLinkEmpty}>—</span>;
  return (
    <TextActionButton className={css.sectionLink} href={location.href}>
      {location.section === 'pharmacyOwners' ||
      location.section === 'employees' ? (
        <TableImagePreview
          src={photoUrl}
          alt=""
          fallback={formatInitials(pageName ?? location.label, 'P')}
          size={22}
        />
      ) : (
        <span className={css.sectionIcon}>
          <SectionIcon section={location.section} />
        </span>
      )}
      <span className={css.sectionLinkLabel}>{pageName ?? location.label}</span>
    </TextActionButton>
  );
}
