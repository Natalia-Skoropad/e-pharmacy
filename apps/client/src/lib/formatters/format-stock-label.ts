export function formatStockLabel(stockQuantity: number): string {
  return stockQuantity === 1
    ? '1 item available in this pharmacy'
    : `${stockQuantity} items available in this pharmacy`;
}
