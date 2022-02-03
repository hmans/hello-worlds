export const dictIntersection = (
  dictA: Record<string, any>,
  dictB: Record<string, any>
) => {
  const intersection: Record<string, any> = {};
  for (let k in dictB) {
    if (k in dictA) {
      intersection[k] = dictA[k];
    }
  }
  return intersection;
};

export const dictDifference = (
  dictA: Record<string, any>,
  dictB: Record<string, any>
) => {
  const diff = { ...dictA };
  for (let k in dictB) {
    delete diff[k];
  }
  return diff;
};
