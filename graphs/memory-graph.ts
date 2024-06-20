import { parse } from "csv-parse";
import { createReadStream } from "fs";
import _ from "lodash";
import { stdev } from "../util";

const optimOrder = [
  "none",
  "compact-token",
  "class-ids",
  "compact-type",
  "struct-of-arrays",
];

export const memoryGraph = () =>
  new Promise((resolve) => {
    const csvStream = createReadStream("memory-results.csv");

    const parser = parse({
      delimiter: ",",
      columns: true,
    });
    // csv format: branch,program,iteration,checkpoint,vsz_pr,rss_pr,vsz_tc,rss_ts,vsz_cg,rss_cg

    const results: { opt: string; program: string; value: number }[] = [];
    parser.on("readable", () => {
      let record;
      while ((record = parser.read())) {
        let astSize = parseInt(record.rss_pr) + parseInt(record.rss_ts); // kB
        results.push({
          opt: record.branch,
          program: record.program,
          value: astSize,
        });
      }
    });
    parser.on("end", () => {
      // Group by optimisation and program. We can then calculate the mean and
      // standard deviation of the memory usage for each optimisation and program.

      const dataByProgram = Object.entries(
        _.groupBy(results, (d) => d.program)
      ).map(([program, programData]) => {
        const grouped = _.groupBy(programData, (d) => d.opt);
        return Object.entries(grouped)
          .map(([key, group]) => {
            const values = group.map((d) => d.value);
            return {
              optim: key,
              mean: _.mean(values),
              stdev: stdev(values),
              program,
            };
          })
          .sort(
            (a, b) => optimOrder.indexOf(a.optim) - optimOrder.indexOf(b.optim)
          );
      });

      resolve({
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
            text: "Average AST memory size across optimisations by program",
          },
          xaxis: {
            title: {
              text: "Optimisation",
            },
          },
          yaxis: {
            // type: "log",
            title: {
              text: "AST memory size (kB)",
            },
          },
        },
      });
    });

    csvStream.pipe(parser);
  });
