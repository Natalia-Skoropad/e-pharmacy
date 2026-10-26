# Cross-folder duplicate and ownership report

| Priority | Overlap | Files | Evidence | Decision |
| --- | --- | --- | --- | --- |
| P1 | Public entity slug builder | `apps/api/src/utils/catalog/public-slug-id.ts` and `packages/validation/src/url/slug-id.ts` | Same exported name/normalization/prefixes, 11 runtime parity examples | Candidate for one canonical owner after import/public API migration and contract tests; no present change |
| P1 | Working-hours issue validator | `apps/api/src/utils/validation/working-hours.ts` and `packages/validation/src/pharmacy/working-hours.ts` | Overlapping issue types and 25 runtime parity examples | Candidate for one canonical owner after expanded property-based tests and timing/precedence verification; no present change |
| P2 | Product vs pharmacy review DTO shapes | `apps/api/src/types/catalog/product.ts`, `apps/api/src/types/pharmacies/pharmacy.ts` | A8 duplicate shape finding | Separate domain contracts; do not merge on shape alone |
| P2 | Product vs pharmacy review fields | `apps/api/src/models/reviews/pharmacyReview.model.ts`, `productReview.model.ts` | A3 eight mirrored fields | Preserve independent model names and unique indexes; guard field parity |
| P2 | Identical validator expressions | A6 note-pagination, admin comments, product/pharmacy review schema families | Four A6 exact-expression groups | Shared primitives already exist; retain separate domain response contracts |
| P2 | Document upload constants | A5 admin employee vs owner/pharmacy document validation rules | Two A5 structural matches | Do not merge without examining ownership and file lifecycle |
| Intentional | Pharmacy routes | Both `/pharmacy` and `/pharmacies` mount the same router | A4 31 alias registrations yield 190 mounted endpoints from 159 declarations | Intentional compatibility; do not remove as duplicate |

None of these candidates is grounds for unreviewed cross-domain merger. Historical G0–G6 source fingerprints and model/index contracts would need new explicit approval and behavioral regression coverage.
