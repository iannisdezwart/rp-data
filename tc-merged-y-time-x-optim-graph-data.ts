import _ from "lodash";
import { BenchmarkDataWithId } from "./types";

const stdev = (data: number[]) => {
  const mean = _.mean(data);
  const sum = _.sum(data.map((d) => (d - mean) ** 2));

  return Math.sqrt(sum / data.length);
};

export const tc_merged_y_time_x_optim_graph_data = async () => {
  const res = await fetch("http://localhost:3000/data");
  const data = (await res.json()) as BenchmarkDataWithId[];

  // Each combination of platform and program has a baseline,
  // which is the mean of the data points with optimisation "None".
  const baselines = Object.entries(
    _.groupBy(data, (d) => `${d.platform}-${d.program}`)
  ).map(([key, group]) => {
    const baseline = _.meanBy(
      group.filter((d) => d.optimisations === "None"),
      (d) => d.tc
    );
    return { key, baseline };
  });

  // Now for each other data point, we calculate the speedup
  // relative to the baseline.
  const speedups = data.map((d) => {
    const baseline = baselines.find(
      (b) => b.key === `${d.platform}-${d.program}`
    )?.baseline;
    if (baseline === undefined) {
      throw new Error("Baseline not found");
    }

    return {
      ...d,
      speedup: baseline / d.tc,
    };
  });

  // Group by optimisation. We can then calculate the mean and
  // standard deviation of the speedup for each optimisation.
  const grouped = _.groupBy(speedups, (d) => d.optimisations);
  const optimData = Object.entries(grouped).map(([key, group]) => {
    const speedups = group.map((d) => d.speedup);
    return {
      optim: key,
      mean: _.mean(speedups),
      stdev: stdev(speedups),
    };
  });

  return {
    data: [
      {
        x: optimData.map((d) => d.optim),
        y: optimData.map((d) => d.mean),
        type: "scatter",
      },
    ],
    layout: {
      font: { family: "serif" },
      title: {
        text: "Average speedup of AST optimisations (type-check phase)",
      },
      xaxis: { title: "AST optimisation" },
      yaxis: {
        title: "Relative speedup",
      },
    },
  };
};
