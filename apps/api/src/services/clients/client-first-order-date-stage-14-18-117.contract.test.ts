import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';

//===============================================================

const readService = (file: string) =>
  readFile(resolve(process.cwd(), `src/services/clients/${file}`), 'utf8');

//===============================================================

test('purchased product date filters compare the Kyiv calendar day of first successful order', async () => {
  const pipeline = await readService('client-purchases-aggregation.ts');

  assert.match(pipeline, /firstOrderDate: \{ \$min: '\$createdAt' \}/);

  assert.match(
    pipeline,
    /firstOrderCalendarDate: \{[\s\S]*?\$dateToString:[\s\S]*?timezone: 'Europe\/Kyiv'/
  );

  assert.match(pipeline, /match\.firstOrderCalendarDate = \{/);
  assert.match(pipeline, /\$gte: query\.dateFrom/);
  assert.match(pipeline, /\$lte: query\.dateTo/);
  assert.doesNotMatch(pipeline, /getStartOfDay|getEndOfDay/);
});

//===============================================================

test('calendar availability comes from unfiltered purchases, not current table page', async () => {
  const [pipeline, service] = await Promise.all([
    readService('client-purchases-aggregation.ts'),
    readService('client-purchases.service.ts'),
  ]);

  assert.match(
    pipeline,
    /availableFirstOrderDates: \{ \$addToSet: '\$firstOrderCalendarDate' \}/
  );

  assert.match(pipeline, /metadata: metadataFacet/);
  assert.match(pipeline, /const metadataFacet:[\s\S]*?\$group/);

  assert.doesNotMatch(
    pipeline.slice(
      pipeline.indexOf('const metadataFacet'),
      pipeline.indexOf('return [', pipeline.indexOf('const metadataFacet'))
    ),
    /\.\.\.filterStages/
  );

  assert.match(service, /availableFirstOrderDates: \[/);
  assert.match(service, /\]\.sort\(\)/);
});
