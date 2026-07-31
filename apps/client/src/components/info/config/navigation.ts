import { FileText, RotateCcw, ShieldCheck, Truck } from 'lucide-react';

import { INFO_LINKS } from './links';

//===================================================================

const INFO_ICONS = [ShieldCheck, FileText, Truck, RotateCcw] as const;

export const INFO_SIDE_MENU_ITEMS = INFO_LINKS.map((link, index) => ({
  ...link,
  icon: INFO_ICONS[index],
}));
