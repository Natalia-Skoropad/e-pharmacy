export function readFileAsDataUrl(
  file: File,
  signal?: AbortSignal
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const cleanup = () => {
      signal?.removeEventListener('abort', handleAbort);
      reader.onload = null;
      reader.onerror = null;
      reader.onabort = null;
    };

    const rejectRead = () => {
      cleanup();
      reject(new Error('Could not read selected file.'));
    };

    const handleAbort = () => {
      if (reader.readyState === FileReader.LOADING) reader.abort();
      cleanup();
      reject(new DOMException('File reading was aborted.', 'AbortError'));
    };

    if (signal?.aborted) {
      handleAbort();
      return;
    }

    signal?.addEventListener('abort', handleAbort, { once: true });

    reader.onload = () => {
      const result = reader.result;
      cleanup();

      if (typeof result === 'string') {
        resolve(result);
        return;
      }

      reject(new Error('Could not read selected file.'));
    };
    reader.onerror = rejectRead;
    reader.onabort = rejectRead;
    reader.readAsDataURL(file);
  });
}
