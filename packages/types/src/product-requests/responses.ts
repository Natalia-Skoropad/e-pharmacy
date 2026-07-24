import type { ApiPaginationResponse } from '../api';
import type { CalendarDateString } from '../primitives';
import type { ProductRequestResponseDto } from './transport';

//=============================================================================

export type ProductRequestsResponseDto = Readonly<
  ApiPaginationResponse<ProductRequestResponseDto> & {
    earliestCreatedAt: CalendarDateString | null;
  }
>;
