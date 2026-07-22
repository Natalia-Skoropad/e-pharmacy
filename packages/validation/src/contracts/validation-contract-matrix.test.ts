import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import {
  buildAddressError,
  buildEmailError,
  buildOrderCommentError,
  buildPasswordError,
  buildPhoneError,
  buildReviewCommentError,
  buildUserNameError,
} from '../shared/errors';

import { normalizeEmail, normalizeIban } from '../shared/sanitizers';

import {
  buildBankNameError,
  buildBankRecipientNameError,
  buildIbanError,
  buildPaymentPurposeError,
  buildPharmacyNameError,
  buildWorkingHoursError,
} from '../pharmacy/pharmacy-field-errors';

import { buildPictureUrlError } from '../files/picture-validation';
import { isCalendarDate } from '../url/date-validation';

import {
  PRODUCT_REQUEST_INITIAL_VALUES,
  normalizeProductRequestForm,
  validateProductRequestForm,
} from '../product-requests';

//===================================================================

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

//===================================================================

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

//===================================================================

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

//===================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

//===================================================================

function isContractName(value: unknown): value is ContractName {
  return (
    typeof value === 'string' &&
    CONTRACT_NAMES.some((contractName) => contractName === value)
  );
}

//===================================================================

function parseContractCase(value: unknown): ContractCase {
  if (
    !isRecord(value) ||
    typeof value.id !== 'string' ||
    !isContractName(value.contract) ||
    typeof value.input !== 'string' ||
    typeof value.valid !== 'boolean' ||
    (value.normalized !== undefined && typeof value.normalized !== 'string')
  ) {
    throw new Error('Invalid frontend validation contract case');
  }

  return {
    id: value.id,
    contract: value.contract,
    input: value.input,
    valid: value.valid,
    ...(value.normalized === undefined ? {} : { normalized: value.normalized }),
  };
}

//===================================================================

function readContractCases(): ContractCase[] {
  const fixturePath = path.join(
    process.cwd(),
    'src',
    'contracts',
    'validation-contract-cases.json'
  );
  const parsed: unknown = JSON.parse(readFileSync(fixturePath, 'utf8'));

  if (!isRecord(parsed) || !Array.isArray(parsed.cases)) {
    throw new Error('Invalid frontend validation contract fixture');
  }

  return parsed.cases.map(parseContractCase);
}

//===================================================================

function createResult(error: string, normalized?: string): ContractResult {
  return {
    valid: error === '',
    ...(normalized === undefined ? {} : { normalized }),
  };
}

//===================================================================

function evaluateProductRequestCase(
  contractCase: ContractCase
): ContractResult {
  const values = {
    ...PRODUCT_REQUEST_INITIAL_VALUES,
    name: 'Product',
    category: 'medicine' as const,
    ...(contractCase.contract === 'productRequestArticle'
      ? { article: contractCase.input }
      : { article: 'MED-001', fullDescription: contractCase.input }),
  };

  const errors = validateProductRequestForm(values, 'draft');
  const error =
    contractCase.contract === 'productRequestArticle'
      ? (errors.article ?? '')
      : (errors.fullDescription ?? '');

  if (error) return { valid: false };

  const payload = normalizeProductRequestForm(values, 'draft');
  const normalized =
    contractCase.contract === 'productRequestArticle'
      ? payload.article
      : payload.fullDescription;

  return createResult('', normalized);
}

//===================================================================

function evaluateContractCase(contractCase: ContractCase): ContractResult {
  const { contract, input } = contractCase;

  switch (contract) {
    case 'userName':
      return createResult(
        buildUserNameError(input, { required: true }),
        input.trim()
      );

    case 'pharmacyName':
      return createResult(
        buildPharmacyNameError(input, { required: true }),
        input.trim()
      );

    case 'bankRecipientName':
      return createResult(
        buildBankRecipientNameError(input, { required: true }),
        input.trim()
      );

    case 'bankName':
      return createResult(
        buildBankNameError(input, { required: true }),
        input.trim()
      );

    case 'email':
      return createResult(buildEmailError(input), normalizeEmail(input));

    case 'password':
      return createResult(buildPasswordError(input), input);

    case 'phone':
      return createResult(
        buildPhoneError(input, { required: true }),
        input.trim()
      );

    case 'address':
      return createResult(
        buildAddressError(input, { required: true }),
        input.trim()
      );

    case 'reviewComment':
      return createResult(
        buildReviewCommentError(input, { required: true }),
        input.trim()
      );

    case 'orderComment':
      return createResult(buildOrderCommentError(input), input.trim());

    case 'paymentPurpose':
      return createResult(
        buildPaymentPurposeError(input, { required: true }),
        input.trim()
      );

    case 'iban':
      return createResult(
        buildIbanError(input, { required: true }),
        normalizeIban(input)
      );

    case 'workingHours':
      return createResult(
        buildWorkingHoursError(input, { required: true }),
        input.trim()
      );

    case 'pictureUrl':
      return createResult(
        buildPictureUrlError(input, { required: true }),
        input.trim()
      );

    case 'calendarDate':
      return {
        valid: isCalendarDate(input),
        ...(isCalendarDate(input) ? { normalized: input.trim() } : {}),
      };

    case 'productRequestArticle':

    case 'productRequestLongText':
      return evaluateProductRequestCase(contractCase);
  }
}

//===================================================================

for (const contractCase of readContractCases()) {
  test(`frontend contract: ${contractCase.id}`, () => {
    const result = evaluateContractCase(contractCase);

    assert.equal(result.valid, contractCase.valid);

    if (contractCase.normalized !== undefined && result.valid) {
      assert.equal(result.normalized, contractCase.normalized);
    }
  });
}
