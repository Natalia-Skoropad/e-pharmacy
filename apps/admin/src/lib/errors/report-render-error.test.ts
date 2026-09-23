import assert from 'node:assert/strict';
import test from 'node:test';

import { createRenderErrorDiagnostic } from './report-render-error';

//===================================================================

test('render error diagnostics expose only approved correlation fields', () => {
  const error = Object.assign(new Error('secret backend detail'), {
    digest: 'digest-123',
    stack: 'private stack',
    token: 'private-token',
  });

  const diagnostic = createRenderErrorDiagnostic(error, 'route-boundary');

  assert.deepEqual(diagnostic, {
    application: 'admin',
    category: 'render_error',
    context: 'route-boundary',
    digest: 'digest-123',
  });

  const serialized = JSON.stringify(diagnostic);
  assert.doesNotMatch(serialized, /secret backend detail/);
  assert.doesNotMatch(serialized, /private stack/);
  assert.doesNotMatch(serialized, /private-token/);
});

//===================================================================

test('render error diagnostics omit the digest when Next.js does not provide one', () => {
  const diagnostic = createRenderErrorDiagnostic(
    new Error('private detail'),
    'root-layout'
  );

  assert.deepEqual(diagnostic, {
    application: 'admin',
    category: 'render_error',
    context: 'root-layout',
  });
});
