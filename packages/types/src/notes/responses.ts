import type { ApiPaginationResponse } from '../api';
import type { PharmacyNote } from './pharmacy-note';

//===================================================================

export type PharmacyNotesResponse = Readonly<
  ApiPaginationResponse<PharmacyNote>
>;
