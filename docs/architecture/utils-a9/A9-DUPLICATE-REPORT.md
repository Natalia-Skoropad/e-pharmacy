# A9 — Duplicate/overlap Report

## Confirmed code overlap: public entity slug builder

`apps/api/src/utils/catalog/public-slug-id.ts:buildPublicEntitySlugId` and `packages/validation/src/url/slug-id.ts:buildPublicEntitySlugId` have identical function bodies after whitespace normalization. API version additionally owns local `OBJECT_ID_PATTERN`, prefixes and `normalizeSlugPart`, which also overlap conceptually with the shared validation module.

**Classification:** duplicate implementation, **not safe to auto-delete** in A9. Backend uses the API path, other consumers use shared `packages/validation`. Changing the API file would invalidate pinned G5/G6 source fingerprints and may affect relative import paths. The migration must preserve ObjectId validation, punctuation/Cyrillic slugging, `pr/ph` prefixes and exact thrown error messages. Create dual-implementation parity tests first, then approve an explicit reviewed production change in a separate stage.

## Near-duplicate: working-hours issue classifier

`apps/api/src/utils/validation/working-hours.ts:getWorkingHoursValidationIssue` and `packages/validation/src/pharmacy/working-hours.ts:getWorkingHoursValidationIssue` enforce the same issue categories (`format`, `missing-days`, `duplicate-days`, `range`, `all-closed`), while shared validation additionally owns parsing/formatting and separate shape definitions.

**Classification:** similar domain validation; **requires behavioral comparison** before deduplication. Check all seven weekdays, boundary and inverted ranges, closed-day combinations, blank segments, duplicate days, and output code precedence. No automatic merge during A9.

## Domain ownership decision

`apps/api/src/utils/dates/date-range.ts` constructs UTC day boundaries and throws on invalid input. `packages/utils/src/date/date-formatters.ts` handles locale-sensitive calendar/instant formatting and returns null for invalid inputs. Despite shared date terminology they have different error semantics and responsibilities. **Do not merge.**

The current source scan finds **no byte-equivalent exported function bodies within the API-utils + shared-utils pair**. The slug overlap is across the additional `packages/validation` comparison, not inside that pair.
