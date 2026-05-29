import { Minus, Plus } from 'lucide-react';

import css from './QuantityCounter.module.css';

//===================================================================

type QuantityCounterProps = {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  isLoading?: boolean;
  ariaLabel?: string;
  onIncrement: () => void;
  onDecrement: () => void;
};

//===================================================================

function QuantityCounter({
  value,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  disabled = false,
  isLoading = false,
  ariaLabel = 'Quantity controls',
  onIncrement,
  onDecrement,
}: QuantityCounterProps) {
  const isDisabled = disabled || isLoading;

  return (
    <div className={css.control} role="group" aria-label={ariaLabel}>
      <button
        className={css.button}
        type="button"
        disabled={isDisabled || value <= min}
        onClick={onDecrement}
        aria-label="Decrease quantity"
      >
        <Minus size={18} aria-hidden="true" />
      </button>

      <span className={css.value} aria-live="polite">
        {value}
      </span>

      <button
        className={css.button}
        type="button"
        disabled={isDisabled || value >= max}
        onClick={onIncrement}
        aria-label="Increase quantity"
      >
        <Plus size={18} aria-hidden="true" />
      </button>
    </div>
  );
}

export default QuantityCounter;
