import { FileText, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

import { ROUTES } from '@/lib/routes';

//===================================================================

export const INFO_NAV_LINKS = [
  {
    label: 'Personal data notice',
    href: ROUTES.PERSONAL_DATA_NOTICE,
    icon: ShieldCheck,
  },
  {
    label: 'User agreement',
    href: ROUTES.USER_AGREEMENT,
    icon: FileText,
  },
  {
    label: 'Delivery and payment',
    href: ROUTES.DELIVERY_PAYMENT,
    icon: Truck,
  },
  {
    label: 'Return policy',
    href: ROUTES.RETURN_POLICY,
    icon: RotateCcw,
  },
] as const;
