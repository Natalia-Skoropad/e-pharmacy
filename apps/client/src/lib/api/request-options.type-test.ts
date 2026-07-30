import type {
  MutationRequestOptions,
  ReadRequestOptions,
} from './request-options';

//===================================================================

const readOptions: ReadRequestOptions = {
  signal: new AbortController().signal,
};
const mutationOptions: MutationRequestOptions = { timeoutMs: 5_000 };

//===================================================================

void readOptions;
void mutationOptions;

//===================================================================

// @ts-expect-error Endpoint readers own the GET method.
const invalidReadMethod: ReadRequestOptions = { method: 'POST' };

// @ts-expect-error Endpoint readers never accept request bodies.
const invalidReadBody: ReadRequestOptions = { body: { value: true } };

// @ts-expect-error Endpoint mutations own their HTTP method.
const invalidMutationMethod: MutationRequestOptions = { method: 'DELETE' };

//===================================================================

void invalidReadMethod;
void invalidReadBody;
void invalidMutationMethod;
