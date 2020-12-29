let uniqueIdCursor = 0;

export function getUniqueNodeId(): number {
  return (uniqueIdCursor += 1);
}
