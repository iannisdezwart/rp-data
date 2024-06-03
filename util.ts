import _ from "lodash";

export const stdev = (data: number[]) => {
  const mean = _.mean(data);
  const sum = _.sum(data.map((d) => (d - mean) ** 2));

  return Math.sqrt(sum / data.length);
};
