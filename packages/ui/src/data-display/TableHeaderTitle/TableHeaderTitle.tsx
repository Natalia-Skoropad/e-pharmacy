import css from './TableHeaderTitle.module.css';

//===================================================================

type TableHeaderTitleProps = Readonly<{
  parts: readonly string[];
}>;

//===================================================================

function TableHeaderTitle({ parts }: TableHeaderTitleProps) {
  return (
    <span className={css.title}>
      {parts.map((part) => (
        <span key={part}>{part}</span>
      ))}
    </span>
  );
}

export default TableHeaderTitle;
export { TableHeaderTitle };
export type { TableHeaderTitleProps };
