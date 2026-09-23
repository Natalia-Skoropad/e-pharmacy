import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const routeErrorSource = readFileSync(
  new URL('./error.tsx', import.meta.url),
  'utf8'
);

const sharedErrorPageSource = readFileSync(
  new URL(
    '../../../../packages/ui/src/status-pages/ErrorPage/ErrorPage.tsx',
    import.meta.url
  ),
  'utf8'
);

//===================================================================

test('route error wires Try again to reset without invoking reset during render', () => {
  assert.match(
    routeErrorSource,
    /onRetry=\{reset\}/,
    'Admin route error must pass the Next.js reset callback to the shared ErrorPage'
  );

  assert.doesNotMatch(
    routeErrorSource,
    /\breset\s*\(/,
    'Admin route error must not invoke reset automatically during render/effects'
  );

  assert.match(
    sharedErrorPageSource,
    /<Button[^>]*onClick=\{onRetry\}/,
    'Shared ErrorPage must invoke the provided retry callback from the Try again button'
  );
});
