import { Building2, FileText, CreditCard, Files } from 'lucide-react';

import type { TabItem } from '@e-pharmacy/ui/navigation';

import type {
  PharmacyEditorField,
  PharmacyEditorTab,
} from './pharmacy-editor-fields';

//===================================================================

export const FIELD_LABELS: Record<PharmacyEditorField, string> = {
  name: 'Pharmacy name',

  address: 'Address',
  settlement: 'Settlement',
  region: 'Region',

  phone: 'Phone',
  email: 'Email',

  workingHours: 'Working hours',

  imageUrl: 'Pharmacy photo',

  description: 'Description',
  shortDescription: 'Short description',

  recipientName: 'Recipient name',
  taxId: 'Tax ID / EDRPOU',
  iban: 'IBAN',
  bankName: 'Bank name',
  receiptEmail: 'Receipt email',
  paymentPurpose: 'Payment purpose',
};

//===================================================================

export const FIELD_HINTS: Partial<Record<PharmacyEditorField, string>> = {
  name: 'This name appears on your pharmacy page, in search results and in the pharmacy list.',

  shortDescription:
    'Clients see this introduction near your pharmacy name (at least 10 characters).',

  phone: 'Clients can use this phone number to contact the pharmacy.',
  email: 'Clients can use this email address to contact the pharmacy.',
  region: 'Enter at least 2 characters for the region.',
  settlement: 'Enter at least 2 characters for the city or town.',
  address: 'Use at least 10 Latin characters, e.g. 15 Shevchenka Street.',
};

//===================================================================

// Same tab component used by Admin pharmacy details and existing profile pages.
export const TAB_ITEMS: TabItem<PharmacyEditorTab>[] = [
  { value: 'data', label: 'Pharmacy data', icon: <Building2 size={17} /> },
  { value: 'about', label: 'About pharmacy', icon: <FileText size={17} /> },
  {
    value: 'payment',
    label: 'Payment details',
    icon: <CreditCard size={17} />,
  },
  {
    value: 'documents',
    label: 'Pharmacy documents',
    icon: <Files size={17} />,
  },
];
