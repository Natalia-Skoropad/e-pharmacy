export function countTrueConditions(...conditions: readonly boolean[]): number {
  return conditions.reduce((count, condition) => count + Number(condition), 0);
}
