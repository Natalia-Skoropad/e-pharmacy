import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';
import { UserRound } from 'lucide-react';

import { TabPanel, Tabs } from './Tabs';

//===================================================================

test('connects tabs and tabpanels with unique ARIA relationships', () => {
  const markup = renderToStaticMarkup(
    <>
      <Tabs
        idBase="details"
        items={[
          { value: 'overview', label: 'Overview' },
          { value: 'reviews', label: 'Reviews' },
        ]}
        activeValue="overview"
        ariaLabel="Details"
        onChange={() => undefined}
      />

      <TabPanel idBase="details" value="overview" activeValue="overview">
        Overview content
      </TabPanel>

      <TabPanel idBase="details" value="reviews" activeValue="overview">
        Reviews content
      </TabPanel>
    </>
  );

  assert.match(markup, /id="details-tab-overview"/);
  assert.match(markup, /aria-controls="details-panel-overview"/);
  assert.match(markup, /id="details-panel-overview"/);
  assert.match(markup, /role="tabpanel"/);
  assert.match(markup, /aria-labelledby="details-tab-overview"/);
  assert.match(markup, /id="details-panel-reviews"[^>]*hidden/);
});

//===================================================================

test('renders an optional icon before a tab label', () => {
  const markup = renderToStaticMarkup(
    <Tabs
      idBase="icon-tabs"
      items={[
        {
          value: 'personal',
          label: 'Personal information',
          icon: <UserRound data-testid="personal-tab-icon" />,
        },
      ]}
      activeValue="personal"
      ariaLabel="Owner details"
      onChange={() => undefined}
    />
  );

  assert.match(markup, /data-testid="personal-tab-icon"/);

  assert.match(
    markup,
    /data-testid="personal-tab-icon"[\s\S]*Personal information/
  );
});
