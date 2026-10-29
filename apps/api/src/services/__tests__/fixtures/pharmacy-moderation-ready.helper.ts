import { createHash } from 'node:crypto';
import { Types } from 'mongoose';

//===============================================================

const workingHours = [
  'Mon: 09:00-18:00',
  'Tue: 09:00-18:00',
  'Wed: 09:00-18:00',
  'Thu: 09:00-18:00',
  'Fri: 09:00-18:00',
  'Sat: Closed',
  'Sun: Closed',
].join('; ');

//===============================================================

// These integration tests exercise moderation of an already approved pharmacy.
// An active pharmacy must contain the required fields and document metadata;
// the private document binary/download flow is covered by separate tests.
export function moderationReadyPharmacyFields(contact: {
  email: string;
  phone: string;
}) {
  const documentContent = Buffer.from('%PDF-1.4');

  // The User phone is globally unique. Derive test-only financial identifiers
  // from it so separate integration pharmacies never share reserved values.
  const phoneDigits = contact.phone.replace(/\D/g, '').slice(-9);

  return {
    email: contact.email,
    phone: contact.phone,

    location: {
      address: '10 Central Street',
      settlement: 'Odesa',
      region: 'Odesa region',
      countryCode: 'UA',
    },

    workingHours,
    imageUrl: 'https://example.com/pharmacy.webp',
    description: 'Approved description',
    shortDescription: 'A local pharmacy serving the community.',

    bankDetails: {
      recipientName: 'Moderation Pharmacy LLC',
      taxId: phoneDigits,
      iban: `UA${'0'.repeat(18)}${phoneDigits}`,
      bankName: 'Example Bank',
      receiptEmail: contact.email,
      paymentPurpose: 'Payment for medicines',
    },

    documents: [
      {
        id: new Types.ObjectId().toHexString(),
        name: 'pharmacy-license.pdf',
        size: documentContent.length,
        type: 'application/pdf',
        sha256: createHash('sha256').update(documentContent).digest('hex'),
        uploadedAt: new Date().toISOString(),
      },
    ],
  };
}
