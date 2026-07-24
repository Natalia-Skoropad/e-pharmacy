export type EditablePharmacyBankDetails = Partial<{
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  receiptEmail: string;
  paymentPurpose: string;
}>;

export type CompletePharmacyBankDetails = Readonly<{
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  receiptEmail: string;
  paymentPurpose: string;
}>;

export type PublicPaymentBankDetails = Readonly<{
  recipientName: string;
  taxId: string;
  iban: string;
  bankName: string;
  receiptEmail: string;
  paymentPurpose: string;
}>;
