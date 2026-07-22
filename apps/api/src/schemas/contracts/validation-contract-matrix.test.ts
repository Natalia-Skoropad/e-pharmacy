import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import type { ZodType } from 'zod';

import {
  sharedBankNameSchema,
  sharedBankRecipientNameSchema,
  sharedEmailSchema,
  sharedIbanSchema,
  sharedOrderCommentSchema,
  sharedPasswordSchema,
  sharedPaymentPurposeSchema,
  sharedPharmacyNameSchema,
  sharedPictureUrlSchema,
  sharedRequiredAddressSchema,
  sharedRequiredPhoneSchema,
  sharedReviewCommentSchema,
  sharedUserNameSchema,
  sharedWorkingHoursSchema,
} from '../shared-validation.schema';

import { calendarDateSchema } from '../shared/date.schema';
import { productRequestFormSchema } from '../product-request.schema';

//===============================================================

type ContractName =
  | 'userName'
  | 'pharmacyName'
  | 'bankRecipientName'
  | 'bankName'
  | 'email'
  | 'password'
  | 'phone'
  | 'address'
  | 'reviewComment'
  | 'orderComment'
  | 'paymentPurpose'
  | 'iban'
  | 'workingHours'
  | 'pictureUrl'
  | 'calendarDate'
  | 'productRequestArticle'
  | 'productRequestLongText';

//===============================================================

type ContractCase = Readonly<{
  id: string;
  contract: ContractName;
  input: string;
  valid: boolean;
  normalized?: string;
}>;

type ContractResult = Readonly<{
  valid: boolean;
  normalized?: string;
}>;

//===============================================================

const CONTRACT_NAMES: readonly ContractName[] = [
  'userName',
  'pharmacyName',
  'bankRecipientName',
  'bankName',
  'email',
  'password',
  'phone',
  'address',
  'reviewComment',
  'orderComment',
  'paymentPurpose',
  'iban',
  'workingHours',
  'pictureUrl',
  'calendarDate',
  'productRequestArticle',
  'productRequestLongText',
];

//===============================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

//===============================================================

function isContractName(value: unknown): value is ContractName {
  return (
    typeof value === 'string' &&
    CONTRACT_NAMES.some((contractName) => contractName === value)
  );
}

//===============================================================

function parseContractCase(value: unknown): ContractCase {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !isContractName(value.contract) ||
    typeof value.input !== 'string' ||
    typeof value.valid !== 'boolean' ||
    (value.normalized !== undefined && typeof value.normalized !== 'string')
  ) {
    throw new Error('Invalid backend validation contract case');
  }

  return {
    id: value.id,
    contract: value.contract,
    input: value.input,
    valid: value.valid,
    ...(value.normalized === undefined ? {} : { normalized: value.normalized }),
  };
}

function readContractCases(): ContractCase[] {
  const fixturePath = path.join(__dirname, 'validation-contract-cases.json');

  const parsed: unknown = JSON.parse(readFileSync(fixturePath, 'utf8'));
  if (!isRecord(parsed) || !Array.isArray(parsed.cases)) {
    throw new Error('Invalid backend validation contract fixture');
  }

  return parsed.cases.map(parseContractCase);
}

//===============================================================

function evaluateStringSchema(schema: ZodType, input: string): ContractResult {
  const result = schema.safeParse(input);
  if (!result.success) return { valid: false };

  return {
    valid: true,
    ...(typeof result.data === 'string' ? { normalized: result.data } : {}),
  };
}

//===============================================================

function evaluateProductRequestCase(
  contractCase: ContractCase
): ContractResult {
  const payload = {
    status: 'draft' as const,
    name: 'Product',
    category: 'medicine' as const,
    ...(contractCase.contract === 'productRequestArticle'
      ? { article: contractCase.input }
      : { article: 'MED-001', fullDescription: contractCase.input }),
  };

  const result = productRequestFormSchema.safeParse(payload);
  if (!result.success) return { valid: false };

  return {
    valid: true,
    normalized:
      contractCase.contract === 'productRequestArticle'
        ? result.data.article
        : result.data.fullDescription,
  };
}

//===============================================================

function evaluateContractCase(contractCase: ContractCase): ContractResult {
  switch (contractCase.contract) {
    case 'userName':
      return evaluateStringSchema(sharedUserNameSchema, contractCase.input);

    case 'pharmacyName':
      return evaluateStringSchema(sharedPharmacyNameSchema, contractCase.input);

    case 'bankRecipientName':
      return evaluateStringSchema(
        sharedBankRecipientNameSchema,
        contractCase.input
      );

    case 'bankName':
      return evaluateStringSchema(sharedBankNameSchema, contractCase.input);

    case 'email':
      return evaluateStringSchema(sharedEmailSchema, contractCase.input);

    case 'password':
      return evaluateStringSchema(sharedPasswordSchema, contractCase.input);

    case 'phone':
      return evaluateStringSchema(
        sharedRequiredPhoneSchema,
        contractCase.input
      );

    case 'address':
      return evaluateStringSchema(
        sharedRequiredAddressSchema,
        contractCase.input
      );

    case 'reviewComment':
      return evaluateStringSchema(
        sharedReviewCommentSchema,
        contractCase.input
      );

    case 'orderComment':
      return evaluateStringSchema(sharedOrderCommentSchema, contractCase.input);

    case 'paymentPurpose':
      return evaluateStringSchema(
        sharedPaymentPurposeSchema,
        contractCase.input
      );

    case 'iban':
      return evaluateStringSchema(sharedIbanSchema, contractCase.input);

    case 'workingHours':
      return evaluateStringSchema(sharedWorkingHoursSchema, contractCase.input);

    case 'pictureUrl':
      return evaluateStringSchema(sharedPictureUrlSchema, contractCase.input);

    case 'calendarDate':
      return evaluateStringSchema(calendarDateSchema, contractCase.input);

    case 'productRequestArticle':

    case 'productRequestLongText':
      return evaluateProductRequestCase(contractCase);
  }
}

//===============================================================

for (const contractCase of readContractCases()) {
  test(`backend contract: ${contractCase.id}`, () => {
    const result = evaluateContractCase(contractCase);

    assert.equal(result.valid, contractCase.valid);

    if (contractCase.normalized !== undefined && result.valid) {
      assert.equal(result.normalized, contractCase.normalized);
    }
  });
}
