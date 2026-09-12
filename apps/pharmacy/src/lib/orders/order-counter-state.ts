export type OrderMenuCounts = Readonly<{
  new: number;
  inProgress: number;
}>;

//===================================================================

export type OrderCounterState =
  | Readonly<{
      status: 'not_loaded' | 'unavailable';
      counts: null;
    }>
  | Readonly<{
      status: 'ready';
      counts: OrderMenuCounts;
    }>;

//===================================================================

export const INITIAL_ORDER_COUNTER_STATE: OrderCounterState = {
  status: 'not_loaded',
  counts: null,
};

//===================================================================

export function createReadyOrderCounterState(
  counts: OrderMenuCounts
): OrderCounterState {
  return {
    status: 'ready',
    counts,
  };
}

//===================================================================

export function createUnavailableOrderCounterState(): OrderCounterState {
  return {
    status: 'unavailable',
    counts: null,
  };
}

//===================================================================

export function getVisibleOrderCounts(
  state: OrderCounterState
): OrderMenuCounts | null {
  return state.status === 'ready' ? state.counts : null;
}
