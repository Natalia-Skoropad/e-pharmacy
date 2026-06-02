export function formatPrice(price: number): string {
  const amount = new Intl.NumberFormat('uk-UA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  return `${amount} UAH`;
}
