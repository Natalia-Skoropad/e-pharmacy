import assert from 'node:assert/strict';
import test from 'node:test';

import { documentAttachmentDisposition } from './document-attachment';

//===================================================================

// A1: exact parity with the previous encoding used by four controllers.
test('document attachment filenames preserve UTF-8 and reserved-character encoding', () => {
  for (const filename of [
    'document.pdf',
    'owner document (final)!.pdf',
    "name'and*extra.pdf",
    'Заява №1.pdf',
    'a+b%20c.pdf',
  ]) {
    const previous = `attachment; filename*=UTF-8''${encodeURIComponent(
      filename
    ).replace(
      /[!'()*]/g,
      (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`
    )}`;

    assert.equal(documentAttachmentDisposition(filename), previous);
  }
});

//===================================================================

test('document attachment filenames cannot introduce a response-header newline', () => {
  assert.equal(
    documentAttachmentDisposition('name\r\nX-Injected: yes.pdf'),
    "attachment; filename*=UTF-8''name%0D%0AX-Injected%3A%20yes.pdf"
  );
});
