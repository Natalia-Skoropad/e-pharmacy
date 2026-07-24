const SERVER_ONLY_STUB_URL =
  'data:text/javascript,export default undefined;';

//===================================================================

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'server-only') {
    return {
      url: SERVER_ONLY_STUB_URL,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
