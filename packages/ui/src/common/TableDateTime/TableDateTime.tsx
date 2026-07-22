import { formatTableDateTimeParts } from '@e-pharmacy/utils/date';

import css from './TableDateTime.module.css';

//===============================================================

type TableDateTimeProps = Readonly<{ value: string }>;

//===============================================================

function TableDateTime({ value }: TableDateTimeProps) {
  const parts = formatTableDateTimeParts(value);

  if (!parts) return <span>—</span>;

  return (
    <time className={css.root} dateTime={value}>
      <span>{parts.dayMonth}</span>
      <span>{parts.year}</span>
      <span>{parts.time}</span>
    </time>
  );
}

export default TableDateTime;
export { TableDateTime };
