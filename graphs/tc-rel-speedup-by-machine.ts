import _ from "lodash";
import { BenchmarkDataWithId } from "../types";
import { stdev } from "../util";

export const tcRelSpeedupByMachine = async () => {
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

  // Group by optimisation and machine. We can then calculate the mean and
  // standard deviation of the speedup for each optimisation and machine.
  const dataByPlatform = Object.entries(
    _.groupBy(speedups, (d) => d.platform)
  ).map(([platform, platformData]) => {
    const grouped = _.groupBy(platformData, (d) => d.optimisations);
    return Object.entries(grouped)
      .map(([key, group]) => {
        const speedups = group.map((d) => d.speedup);
        return {
          optim: key,
          mean: _.mean(speedups),
          stdev: stdev(speedups),
          platform,
        };
      })
      .sort((a, b) => a.optim.localeCompare(b.optim));
  });

  return {
    data: dataByPlatform.map((d) => ({
      x: d.map((d) => d.optim),
      y: d.map((d) => d.mean),
      error_y: {
        type: "data",
        array: d.map((d) => d.stdev),
        visible: true,
      },
      type: "scatter",
      name: d[0].platform,
    })),
    layout: {
      font: { family: "serif" },
      title: {
        text: "Average speedup of AST optimisations (type-check phase) by machine",
      },
      xaxis: {
        title: {
          text: "Machine",
        },
      },
      yaxis: {
        title: {
          text: "Speedup",
        },
      },
    },
  };
};