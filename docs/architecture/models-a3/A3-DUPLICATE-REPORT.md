# A3 — Duplicate and similarity review

| Case | Classification | Evidence | Decision |
|---|---|---|---|
| `pharmacyReview.model.ts` versus `productReview.model.ts` | **Exact repeated field definitions / intentional domain similarity** | Eight common fields (`userId`, `userName`, `rating`, `comment`, `status`, `moderationReason`, `moderatedBy`, `moderatedAt`) have identical AST definitions; separate entity `ref`, ownership indexes and model names | Keep two separate models. Add exact field-parity regression guard (implemented); defer optional extraction pending runtime comparison |
| Pharmacy verification documents versus owner/admin documents | Intentional similarity | Overlapping file metadata but separate owner authorization, data retention, MIME/size rules and audit policies | Do not combine schemas without contract-by-contract comparison |
| User/admin/owner private comments and notes | Intentional similarity | Similar text/date structures but distinct access-control and audit/collection boundaries | Do not deduplicate cross-domain persisted documents |
| `productRequest.model.ts` file and image subdocuments | Already deduplicated | `createProductRequestFileSchema` parameterizes two variants with different MIME, size and required-data rules | Retain existing factory; avoid a second wrapper |
| Multiple createdAt/status/owner compound indexes across models | False-positive cross-collection similarity | Indexes belong to different collections and query workloads | Preserve; assess only with query plans |
| Repeated explicit `.index()` keys inside a single schema | No confirmed duplicate | AST scan of 91 explicit calls: 0 exact key collisions per schema | No index deletions |

A *shared helper* for the eight mirrored review fields may be worthwhile in a later controlled refactor, but must preserve `Schema` paths, error messages, selected index options and compiled model behavior. A purely textual deduplication is not accepted as sufficient evidence.
