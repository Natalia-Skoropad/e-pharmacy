/**
 * Returns `true` only when the tuple contains every member of `Union` and no
 * value outside that union.
 */
export type IsExactValueSet<
  Union,
  Values extends readonly unknown[],
> = [Exclude<Union, Values[number]>] extends [never]
  ? [Exclude<Values[number], Union>] extends [never]
    ? true
    : false
  : false;

//===================================================================

/** Produces a compile-time error when the asserted condition is not `true`. */
export type Assert<TCondition extends true> = TCondition;
