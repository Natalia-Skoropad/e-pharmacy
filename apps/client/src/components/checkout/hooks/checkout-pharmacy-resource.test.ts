import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

//===================================================================

test('checkout pharmacy loader keeps loading, success and error states distinct', async () => {
  const source = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/checkout/hooks/useCheckoutPharmacy.ts'
    ),
    'utf8'
  );

  assert.match(source, /'idle' \| 'loading' \| 'success' \| 'error'/);
  assert.match(source, /pharmacyError/);
  assert.match(source, /status: 'error'/);
  assert.match(source, /status: 'success'/);
});

//===================================================================

test('checkout shows the shared page skeleton until pharmacy details load', async () => {
  const page = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/checkout/CheckoutPageContent/CheckoutPageContent.tsx'
    ),
    'utf8'
  );

  assert.match(page, /shouldShowPageSkeleton\s*=\s*[\s\S]*?isPharmacyLoading/);

  assert.match(
    page,
    /shouldShowPageSkeleton \|\| isRedirecting \?\s*\(\s*<OrderPageSkeleton variant="checkout"/
  );

  assert.doesNotMatch(page, /Loading pharmacy details\.\.\./);

  assert.match(
    page,
    /!shouldShowPageSkeleton && !isRedirecting && selectedOrderGroup/
  );
});

//===================================================================

test('checkout waits for the first cart load and provides a route fallback', async () => {
  const [cartHook, loading] = await Promise.all([
    readFile(
      path.resolve(
        process.cwd(),
        'src/components/checkout/hooks/useCheckoutCart.ts'
      ),
      'utf8'
    ),

    readFile(
      path.resolve(process.cwd(), 'src/app/(private)/checkout/loading.tsx'),
      'utf8'
    ),
  ]);

  assert.match(cartHook, /isLoaded: isCartLoaded/);
  assert.match(cartHook, /!isCartLoaded \|\| isCartLoading/);
  assert.match(loading, /OrderPageSkeleton variant="checkout"/);
  assert.match(loading, /CheckoutLoading/);
});

//===================================================================

test('bank details keep the previous panel and a consistent copy button column', async () => {
  const component = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/checkout/CheckoutPaymentMethod/CheckoutPaymentMethod.tsx'
    ),
    'utf8'
  );

  const styles = await readFile(
    path.resolve(
      process.cwd(),
      'src/components/checkout/CheckoutPaymentMethod/CheckoutPaymentMethod.module.css'
    ),
    'utf8'
  );

  assert.match(component, /className=\{css\.bankCard\}/);
  assert.match(component, /className=\{css\.bankRow\}/);
  assert.match(component, /className=\{css\.copyAction\}/);

  assert.match(
    styles,
    /\.bankRow\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 44px/
  );

  assert.match(styles, /\.copyAction\s*\{[\s\S]*?grid-column:\s*2/);

  assert.match(
    styles,
    /@media only screen and \(min-width:\s*768px\)[\s\S]*?\.copyAction\s*\{\s*grid-column:\s*3/
  );

  assert.doesNotMatch(component, /className=\{css\.bankHeader\}/);
});
