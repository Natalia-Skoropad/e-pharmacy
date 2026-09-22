import assert from 'node:assert/strict';
import test from 'node:test';

import { isValidElement, type ReactElement, type ReactNode } from 'react';

import { ErrorPage, PageLoader } from '@e-pharmacy/ui/status-pages';
import type { CurrentPharmacySummary } from '@e-pharmacy/types/pharmacies';

import { PharmacyCabinetBoundaryRuntime } from './PharmacyCabinetBoundary';

//===================================================================

function requireElement(
  value: ReactNode
): ReactElement<Record<string, unknown>> {
  assert.equal(isValidElement(value), true);
  return value as ReactElement<Record<string, unknown>>;
}

//===================================================================

const blockedSummary: CurrentPharmacySummary = {
  id: '507f1f77bcf86cd799439011' as CurrentPharmacySummary['id'],
  name: 'Blocked Pharmacy',
  status: 'blocked',
  membershipRole: 'owner',
};

//===================================================================

test('initial summary loading blocks cabinet children', () => {
  const rendered = PharmacyCabinetBoundaryRuntime({
    profile: null,
    isLoading: true,
    error: null,
    onRetry: () => undefined,
    children: 'cabinet-content',
  });

  const element = requireElement(rendered);
  assert.equal(element.type, PageLoader);
  assert.equal(element.props.label, 'Loading pharmacy cabinet...');
});

//===================================================================

test('initial summary failure renders the branded cabinet error instead of children', () => {
  const error = new Error('503');
  const onRetry = () => undefined;

  const rendered = PharmacyCabinetBoundaryRuntime({
    profile: null,
    isLoading: false,
    error,
    onRetry,
    children: 'cabinet-content',
  });

  const element = requireElement(rendered);
  assert.equal(element.type, ErrorPage);
  assert.equal(element.props.title, 'We could not load your pharmacy cabinet');
  assert.equal(element.props.onRetry, onRetry);
  assert.notEqual(element.props.children, 'cabinet-content');
});

//===================================================================

test('blocked and last-known-good summaries keep cabinet children renderable', () => {
  const blockedContent = PharmacyCabinetBoundaryRuntime({
    profile: blockedSummary,
    isLoading: false,
    error: null,
    onRetry: () => undefined,
    children: 'blocked-cabinet-content',
  });

  assert.equal(blockedContent, 'blocked-cabinet-content');

  const backgroundFailureContent = PharmacyCabinetBoundaryRuntime({
    profile: blockedSummary,
    isLoading: false,
    error: new Error('background 503'),
    onRetry: () => undefined,
    children: 'last-known-good-content',
  });

  assert.equal(backgroundFailureContent, 'last-known-good-content');
});
