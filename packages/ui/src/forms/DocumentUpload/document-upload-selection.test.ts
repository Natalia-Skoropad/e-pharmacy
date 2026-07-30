import assert from 'node:assert/strict';
import test from 'node:test';

import { mergeUploadFileSelection } from './document-upload-selection.ts';

//===================================================================

function createFile(name: string, contents: string, lastModified = 1): File {
  return new File([contents], name, {
    type: 'application/pdf',
    lastModified,
  });
}

//===================================================================

test('adds unique files and reports duplicate selections', () => {
  const first = createFile('license.pdf', 'first');
  const duplicate = createFile('license.pdf', 'first');
  const second = createFile('certificate.pdf', 'second', 2);

  const initial = mergeUploadFileSelection([], [first], true);

  const next = mergeUploadFileSelection(
    initial.files,
    [duplicate, second],
    true
  );

  assert.equal(next.duplicateCount, 1);

  assert.deepEqual(
    next.files.map((file) => file.name),
    ['license.pdf', 'certificate.pdf']
  );

  assert.notEqual(next.files[0]?.id, next.files[1]?.id);
});

//===================================================================

test('single-file mode replaces the previous file without accepting duplicates', () => {
  const first = createFile('license.pdf', 'first');
  const replacement = createFile('updated-license.pdf', 'updated', 2);

  const initial = mergeUploadFileSelection([], [first], false);

  const replaced = mergeUploadFileSelection(
    initial.files,
    [replacement],
    false
  );

  const duplicate = mergeUploadFileSelection(
    replaced.files,
    [replacement],
    false
  );

  assert.deepEqual(
    replaced.files.map((file) => file.name),
    ['updated-license.pdf']
  );

  assert.equal(duplicate.duplicateCount, 1);
  assert.deepEqual(duplicate.files, replaced.files);
});
