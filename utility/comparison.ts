export const compare = (result: string[], answer: string[]) => {
  const map: Record<string, [number, number]> = {};
  answer.forEach((item) => {
    if (!map[item]) map[item] = [0, 0];
    map[item][1]++;
  });
  result.forEach((item) => {
    if (map[item]) map[item][0]++;
  });
  let correctCount = 0;
  let totalCount = 0;
  Object.keys(map).forEach((key) => {
    correctCount += map[key][0];
    totalCount += map[key][1];
  });

  return ((correctCount / totalCount) * 100).toFixed(2);
};
