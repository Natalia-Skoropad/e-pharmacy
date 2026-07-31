import { ROUTES } from '@/lib/routes';

//===================================================================

export const INFO_LINKS = [
  {
    label: 'Personal data notice',
    href: ROUTES.PERSONAL_DATA_NOTICE,
  },
  {
    label: 'User agreement',
    href: ROUTES.USER_AGREEMENT,
  },
  {
    label: 'Delivery and payment',
    href: ROUTES.DELIVERY_PAYMENT,
  },
  {
    label: 'Return policy',
    href: ROUTES.RETURN_POLICY,
  },
] as const;
