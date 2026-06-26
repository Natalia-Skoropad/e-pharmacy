import css from '../CabinetPage/CabinetPage.module.css';

//===================================================================

type PlaceholderCardsProps = Readonly<{
  items: readonly string[];
}>;

//===================================================================

export function PlaceholderCards({ items }: PlaceholderCardsProps) {
  return (
    <div className={css.placeholderGrid}>
      {items.map((item) => (
        <article key={item} className={css.placeholderCard}>
          <strong>{item}</strong>
          <p>UI skeleton is ready. API integration will be connected in the next implementation step.</p>
        </article>
      ))}
    </div>
  );
}
