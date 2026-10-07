import {
  Boxes,
  Building2,
  FilePenLine,
  FilePlus2,
  FileText,
  MessageSquareText,
  Settings,
  ShoppingBag,
  Tags,
  UserCog,
  UserRound,
  Users,
} from 'lucide-react';

import { TextActionButton } from '@e-pharmacy/ui/primitives';

import type {
  AdminAuditListItem,
  AdminAuditSection,
} from '@/lib/audit/admin-audit';
import { getAdminAuditLocation } from '@/lib/audit/admin-audit-presentation';

import css from './ActivityHistory.module.css';

//===================================================================

function SectionIcon({ section }: Readonly<{ section: AdminAuditSection }>) {
  const props = { size: 16, 'aria-hidden': true as const };

  switch (section) {
    case 'profile':
      return <UserRound {...props} />;
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
      return <Settings {...props} />;
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
  >;
}>;

//===================================================================

export function ActivitySectionLink({ item }: ActivitySectionLinkProps) {
  const location = getAdminAuditLocation(item);

  return (
    <TextActionButton className={css.sectionLink} href={location.href}>
      <SectionIcon section={location.section} />
      <span>{location.label}</span>
    </TextActionButton>
  );
}
