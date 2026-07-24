import { register } from 'node:module';

//===================================================================

register(
  new URL('./server-only-test-loader.mjs', import.meta.url),
  import.meta.url
);
