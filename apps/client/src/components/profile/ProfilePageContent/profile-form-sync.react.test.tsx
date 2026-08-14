import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

//===================================================================

async function readProfileSource(): Promise<string> {
  return readFile(new URL('./ProfilePageContent.tsx', import.meta.url), 'utf8');
}

//===================================================================

test('background auth revalidation preserves a dirty client profile draft', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /const profileValues = profileDraft\?\.values \?\? serverProfileValues/
  );

  assert.match(
    source,
    /const baseline = current\?\.baseline \?\? serverProfileValues/
  );

  assert.doesNotMatch(
    source,
    /useEffect\([\s\S]{0,1200}setProfileDraft\([\s\S]{0,400}\[user\]/
  );
});

//===================================================================

test('successful save returns the form to canonical AuthUser-backed state', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /const response = await updateCurrentUser\(\{[\s\S]*?expectedRevision: user\.revision[\s\S]*?\}\);[\s\S]*?applyCurrentUser\(response\.user\);[\s\S]*?setProfileDraft\(null\)/
  );

  assert.doesNotMatch(source, /reloadCurrentUser/);
  assert.match(source, /setProfileTouchedFields\(\{\}\)/);
});

//===================================================================

test('picture PATCH success is applied directly without a second current-user request', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /const response = await updateCurrentUser\(\{\s*pictureUrl,[\s\S]*?expectedRevision: user\.revision[\s\S]*?\}\);[\s\S]*?applyCurrentUser\(response\.user\)/
  );
});

//===================================================================

test('account switching remounts private profile state for the next identity', async () => {
  const source = await readProfileSource();

  assert.match(
    source,
    /<AuthenticatedProfilePageContent key=\{user\.id\} user=\{user\} \/>/
  );
});
