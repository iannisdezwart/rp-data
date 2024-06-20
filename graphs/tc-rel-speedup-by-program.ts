import _ from "lodash";
import { BenchmarkDataWithId } from "../types";
import { stdev } from "../util";

const optimOrder = [
  "none",
  "compact-token",
  "class-ids",
  "compact-type",
  "struct-of-arrays",
];

export const tcRelSpeedupByProgram = async () => {
  const res = await fetch("http://localhost:3000/data");
  const data = (await res.json()) as BenchmarkDataWithId[];

  // Each combination of platform and program has a baseline,
  // which is the mean of the data points with optimisation "none".
  const baselines = Object.entries(
    _.groupBy(data, (d) => `${d.platform}-${d.program}`)
  ).map(([key, group]) => {
    const baseline = _.meanBy(
      group.filter((d) => d.optimisations === "none"),
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

  // Group by optimisation and program. We can then calculate the mean and
  // standard deviation of the speedup for each optimisation and program.
  const dataByProgram = Object.entries(
    _.groupBy(speedups, (d) => d.program)
  ).map(([program, programData]) => {
    const grouped = _.groupBy(programData, (d) => d.optimisations);
    return Object.entries(grouped)
      .map(([key, group]) => {
        const speedups = group.map((d) => d.speedup);
        return {
          optim: key,
          mean: _.mean(speedups),
          stdev: stdev(speedups),
          program,
        };
      })
      .sort(
        (a, b) => optimOrder.indexOf(a.optim) - optimOrder.indexOf(b.optim)
      );
  });

  return {
    data: dataByProgram.map((d) => ({
      x: d.map((d) => d.optim),
      y: d.map((d) => d.mean),
      error_y: {
        type: "data",
        array: d.map((d) => d.stdev),
        visible: true,
      },
      type: "bar",
      name: d[0].program,
    })),
    layout: {
      font: { family: "serif" },
      title: {
        text: "Average speedup of AST optimisations (type-check phase) by program",
      },
      xaxis: {
        title: {
          text: "Optimisation",
        },
      },
      yaxis: {
        type: "log",
        title: {
          text: "Speedup",
        },
      },
    },
  };
};
