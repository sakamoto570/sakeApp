export function cosineSimilarity(left: number[], right: number[]): number {
  if (left.length === 0 || left.length !== right.length) {
    throw new Error("Vectors must be non-empty and have the same dimensions");
  }

  const dotProduct = left.reduce(
    (sum, value, index) => sum + value * (right[index] ?? 0),
    0,
  );
  const leftMagnitude = Math.sqrt(
    left.reduce((sum, value) => sum + value ** 2, 0),
  );
  const rightMagnitude = Math.sqrt(
    right.reduce((sum, value) => sum + value ** 2, 0),
  );

  if (leftMagnitude === 0 || rightMagnitude === 0) {
    return 0;
  }

  return dotProduct / (leftMagnitude * rightMagnitude);
}

