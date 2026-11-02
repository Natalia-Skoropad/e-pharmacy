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
    /setTabSelection\(\{ routeTab: activeTab, selectedTab: tab \}\);\s*router.replace\(buildOwnedPharmacyDetailUrl/
  );

  assert.doesNotMatch(detail, /useEffect\(\(\) => setVisibleTab/);
  assert.match(detail, /activeValue=\{visibleTab\}/);

  assert.match(detail, /result\?\.tab === activeTab/);
  assert.match(detail, /visibleTab === activeTab/);

  assert.match(detail, /<ProfileSectionHeader[\s\S]*?<ProfileResourceState/);
});

//===================================================================

test('14.18.24: owner profile Documents and Comments icons align with admin counterparts', () => {
  const profile = read(
    '../profile/PharmacyProfilePageContent/PharmacyProfilePageContent.tsx'
  );

  const docs = read('../profile/OwnerDocumentsPanel/OwnerDocumentsPanel.tsx');

  const comments = read(
    '../profile/OwnerPrivateComments/OwnerPrivateComments.tsx'
  );

  assert.match(profile, /icon: <Files size=\{17\}/);
  assert.match(docs, /headerIcon=\{<Files size=\{22\}/);
  assert.match(comments, /emptyIcon=\{<MessageSquareLock size=\{22\}/);
});

//===================================================================

test('14.18.24: created status is human-readable and disabled verification tooltip uses structured items', () => {
  const info = read(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyInformationTab.tsx'
  );

  const actions = read(
    './OwnedPharmacyDetailPageContent/OwnedPharmacyActions.tsx'
  );

  assert.match(info, /fallback="Created"/);
  assert.match(info, /event\.action === 'pharmacy\.deleted'/);
  assert.match(actions, /tooltipTitle="Verification requirements"/);
  assert.match(actions, /items=\{\[/);
  assert.match(actions, /escapeOverflow/);
});
