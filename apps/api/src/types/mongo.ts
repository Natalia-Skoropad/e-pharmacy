export type MongoDuplicateKeyError = Error & {
  code: 11000;
  keyPattern?: Record<string, number>;
  keyValue?: Record<string, unknown>;
};
