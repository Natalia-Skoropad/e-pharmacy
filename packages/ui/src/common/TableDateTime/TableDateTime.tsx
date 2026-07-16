import css from './TableDateTime.module.css';

type TableDateTimeProps = Readonly<{ value: string }>;

//===================================================================

function TableDateTime({ value }: TableDateTimeProps) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return <span>—</span>;

  const dayMonth = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
  }).format(date);

  const year = new Intl.DateTimeFormat('en-GB', { year: 'numeric' }).format(
    date
  );

  const time = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date);

  return (
    <time className={css.root} dateTime={value}>
      <span>{dayMonth}</span>
      <span>{year}</span>
      <span>{time}</span>
    </time>
  );
}

export default TableDateTime;
export { TableDateTime };
