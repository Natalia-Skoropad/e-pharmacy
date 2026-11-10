import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

//===================================================================

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), 'utf8');

//===================================================================

test('14.18.24: tabs respond to the first click and synchronize with URL changes', () => {
  const detail = read(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyDetailPageContent.tsx'
  );

  assert.match(
    detail,
    /const \[tabSelection, setTabSelection\] = useState\(\{/
  );

  assert.match(detail, /if \(tabSelection\.routeTab !== activeTab\)/);

  assert.match(
    detail,
    /tabSelection\.routeTab === activeTab \? tabSelection\.selectedTab : activeTab/
  );

  assert.match(
    detail,
    /if \(!window\.dispatchEvent\(navigation\)\) return;\s*setTabSelection\(\{ routeTab: activeTab, selectedTab: tab \}\);\s*router\.replace\(href, \{ scroll: false \}\)/
  );

  assert.doesNotMatch(detail, /useEffect\(\(\) => setVisibleTab/);
  assert.match(detail, /activeValue=\{visibleTab\}/);

  assert.match(detail, /result\?\.tab === activeTab/);
  assert.match(detail, /visibleTab === activeTab/);

  assert.match(detail, /<ProfileSectionHeader[\s\S]*?<ProfileResourceState/);
});

//===================================================================

test('14.18.24: created status is human-readable and disabled verification tooltip uses structured items', () => {
  const info = read(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyInformationTab.tsx'
  );

  const actions = read(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  assert.match(info, /<span className=\{css\.createdStatus\}>Created<\/span>/);
  assert.match(info, /event\.action === 'pharmacy\.deleted'/);
  assert.match(actions, /tooltipTitle="Verification requirements"/);
  assert.match(actions, /items=\{\[/);
  assert.match(actions, /escapeOverflow/);
});
