import assert from 'node:assert/strict';
import test from 'node:test';

import { renderToStaticMarkup } from 'react-dom/server';

import type { ActiveSession } from '@e-pharmacy/types/auth';
import type { ISODateTimeString } from '@e-pharmacy/types/primitives';

import { ActiveSessionsPanel } from './ActiveSessionsPanel';
import { ChangePasswordForm } from './ChangePasswordForm';
import { DocumentsPanel } from './DocumentsPanel';
import { ProfileIdentityCard } from './ProfileIdentityCard';
import { ProfileTabPanel, ProfileTabsLayout } from './ProfileTabsLayout';

//===================================================================

test('profile identity presentation stays domain-neutral', () => {
  const markup = renderToStaticMarkup(
    <ProfileIdentityCard
      name="Natalia"
      email="natalia@example.com"
      roleLabel="Platform Owner"
      statusLabel="Active"
      pictureEditor={<div>Picture editor</div>}
    />
  );

  assert.match(markup, /Natalia/);
  assert.match(markup, /natalia@example\.com/);
  assert.match(markup, /Platform Owner/);
  assert.match(markup, /Active/);
  assert.doesNotMatch(markup, /pharmacy/i);
});

//===================================================================

test('profile tabs layout preserves canonical tab relationships', () => {
  const markup = renderToStaticMarkup(
    <ProfileTabsLayout
      idBase="profile"
      items={[
        { value: 'personal', label: 'Personal information' },
        { value: 'documents', label: 'Documents' },
      ]}
      activeValue="personal"
      ariaLabel="Profile sections"
      sidebar={<div>Summary</div>}
      onChange={() => undefined}
    >
      <ProfileTabPanel idBase="profile" value="personal" activeValue="personal">
        Personal content
      </ProfileTabPanel>
    </ProfileTabsLayout>
  );

  assert.match(markup, /id="profile-tab-personal"/);
  assert.match(markup, /aria-controls="profile-panel-personal"/);
  assert.match(markup, /id="profile-panel-personal"/);
  assert.match(markup, /aria-labelledby="profile-tab-personal"/);
});

//===================================================================

test('read-only documents panel does not expose upload controls', () => {
  const markup = renderToStaticMarkup(
    <DocumentsPanel
      id="documents"
      editable={false}
      value={[
        {
          id: 'document-1',
          name: 'employment.pdf',
          size: 1024,
          type: 'application/pdf',
        },
      ]}
      onDownloadFile={async () => 'blob:test'}
    />
  );

  assert.match(markup, /employment\.pdf/);
  assert.match(markup, />Download</);
  assert.doesNotMatch(markup, /type="file"/);
});

//===================================================================

test('active sessions panel renders auth sessions without app-specific copy', () => {
  const sessions: ActiveSession[] = [
    {
      id: 'session-1',
      deviceName: 'Chrome on Windows',
      roleAtLogin: 'admin',
      lastUsedAt: '2026-09-24T10:00:00.000Z' as ISODateTimeString,
      expiresAt: '2026-10-24T10:00:00.000Z' as ISODateTimeString,
      isCurrent: true,
    },
  ];

  const markup = renderToStaticMarkup(
    <ActiveSessionsPanel sessions={sessions} status="success" />
  );

  assert.match(markup, /Chrome on Windows/);
  assert.match(markup, /Current session/);
});

//===================================================================

test('active sessions panel supports client-compatible IP and date copy', () => {
  const sessions: ActiveSession[] = [
    {
      id: 'session-1',
      deviceName: 'Unknown device',
      ip: '46.211.56.205',
      roleAtLogin: 'client',
      lastUsedAt: '2026-09-18T10:00:00.000Z' as ISODateTimeString,
      expiresAt: '2026-10-18T10:00:00.000Z' as ISODateTimeString,
      isCurrent: false,
    },
  ];

  const markup = renderToStaticMarkup(
    <ActiveSessionsPanel
      sessions={sessions}
      status="success"
      showIp
      lastUsedLabel="Last active"
      formatLastUsedAt={() => '18 Sep 2026'}
    />
  );

  assert.match(markup, /46\.211\.56\.205/);
  assert.match(markup, /Last active: 18 Sep 2026/);
});

//===================================================================

test('session history remains visible with an empty active-session state', () => {
  const sessions: ActiveSession[] = [
    {
      id: 'expired-session',
      deviceName: 'Previous device',
      roleAtLogin: 'pharmacy',
      lastUsedAt: '2026-09-18T10:00:00.000Z' as ISODateTimeString,
      expiresAt: '2000-10-18T10:00:00.000Z' as ISODateTimeString,
      isCurrent: false,
    },
  ];

  const markup = renderToStaticMarkup(
    <ActiveSessionsPanel sessions={sessions} status="success" />
  );

  assert.match(markup, /No active sessions found/);
  assert.match(markup, /Session history/);
  assert.match(markup, /Previous device/);
  assert.match(markup, /Showing 1 of 1 sessions/);
});

//===================================================================

test('sessions use one combined ten-record batch and only a load-more button', () => {
  const activeSessions: ActiveSession[] = Array.from(
    { length: 2 },
    (_, index) => ({
      id: `active-${index}`,
      deviceName: `Active device ${index}`,
      roleAtLogin: 'client' as const,
      lastUsedAt: '2026-10-18T10:00:00.000Z' as ISODateTimeString,
      expiresAt: '2099-10-18T10:00:00.000Z' as ISODateTimeString,
      isCurrent: index === 0,
    })
  );

  const history: ActiveSession[] = Array.from({ length: 12 }, (_, index) => ({
    id: `expired-${index}`,
    deviceName: `Previous device ${index}`,
    roleAtLogin: 'client' as const,
    lastUsedAt: '2026-09-18T10:00:00.000Z' as ISODateTimeString,
    expiresAt: '2000-10-18T10:00:00.000Z' as ISODateTimeString,
    isCurrent: false,
  }));

  const markup = renderToStaticMarkup(
    <ActiveSessionsPanel
      sessions={[...activeSessions, ...history]}
      status="success"
    />
  );

  assert.match(markup, /Active device 0/);
  assert.match(markup, /Active device 1/);
  assert.match(markup, /Previous device 7/);
  assert.doesNotMatch(markup, /Previous device 8/);
  assert.match(markup, /Showing 8 of 12 sessions/);
  assert.match(markup, /Show more sessions \(4\)/);
  assert.doesNotMatch(markup, /Sessions pagination/);
});

//===================================================================

test('shared password form includes explicit password confirmation', () => {
  const markup = renderToStaticMarkup(
    <ChangePasswordForm onSubmit={() => undefined} />
  );

  assert.match(markup, /Current password/);
  assert.match(markup, /New password/);
  assert.match(markup, /Confirm new password/);
});

//===================================================================

test('shared password form can preserve legacy two-field profile flows', () => {
  const markup = renderToStaticMarkup(
    <ChangePasswordForm
      requireConfirmation={false}
      onSubmit={() => undefined}
    />
  );

  assert.match(markup, /Current password/);
  assert.match(markup, /New password/);
  assert.doesNotMatch(markup, /Confirm new password/);
});
