import assert from 'node:assert/strict';
import test from 'node:test';

import { createRenderErrorDiagnostic } from './report-render-error';

//===================================================================

test('render error diagnostics expose only redacted correlation data', () => {
  const error = Object.assign(new Error('secret backend detail'), {
    digest: 'digest-123',
    stack: 'private stack',
  });

  const diagnostic = createRenderErrorDiagnostic(
    error,
    'route-boundary',
    '/pharmacy/orders/123'
  );

  assert.deepEqual(diagnostic, {
    category: 'render_error',
    context: 'route-boundary',
    digest: 'digest-123',
    route: '/pharmacy/orders/123',
  });

  const serialized = JSON.stringify(diagnostic);
  assert.doesNotMatch(serialized, /secret backend detail/);
  assert.doesNotMatch(serialized, /private stack/);
});
