export function ensurePctSumIsOne(values: number[], label = "Prozentsätze") {
  const sum = values.reduce((acc, value) => acc + value, 0);
  if (Math.abs(sum - 1) > 0.00001) {
    throw new Error(`${label} müssen zusammen 1.0 ergeben`);
  }
}
