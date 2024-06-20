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

export const cacheGraph = (cacheLevel: string) => () =>
  new Promise((resolve) => {
    const csvStream = createReadStream("cache-results.csv");

    const parser = parse({
      delimiter: ",",
      columns: true,
    });
    // csv format: branch,program,i_refs,i1_misses,d_refs,d1_misses,lld_misses,ll_refs,ll_misses

    const results: {
      opt: string;
      program: string;
      d1MissRate: number;
      lldMissRate: number;
      llMissRate: number;
    }[] = [];

    parser.on("readable", () => {
      let record;
      while ((record = parser.read())) {
        let d1MissRate = parseInt(record.d1_misses) / parseInt(record.d_refs);
        let lldMissRate = parseInt(record.lld_misses) / parseInt(record.d_refs);
        let llMissRate = parseInt(record.ll_misses) / parseInt(record.ll_refs);
        results.push({
          opt: record.branch,
          program: record.program,
          d1MissRate,
          lldMissRate,
          llMissRate,
        });
      }
    });

    parser.on("end", () => {
      // Group by optimisation and program. We can then calculate the mean and
      // standard deviation of the memory usage for each optimisation and program.

      console.log(results);

      const dataByProgram = Object.entries(
        _.groupBy(results, (d) => d.program)
      ).map(([program, programData]) => {
        const grouped = _.groupBy(programData, (d) => d.opt);
        return Object.entries(grouped)
          .map(([key, group]) => {
            const d1MissRates = group.map((d) => d.d1MissRate);
            const lldMissRates = group.map((d) => d.lldMissRate);
            const llMissRates = group.map((d) => d.llMissRate);
            return {
              optim: key,
              d1MissRate: _.mean(d1MissRates),
              lldMissRate: _.mean(lldMissRates),
              llMissRate: _.mean(llMissRates),
              program,
            };
          })
          .sort(
            (a, b) => optimOrder.indexOf(a.optim) - optimOrder.indexOf(b.optim)
          );
      });

      // Just group by optimisation, combine the data for all programs

      const data = Object.entries(_.groupBy(results, (d) => d.opt)).map(
        ([optim, optimData]) => {
          const d1MissRates = optimData.map((d) => d.d1MissRate);
          const lldMissRates = optimData.map((d) => d.lldMissRate);
          const llMissRates = optimData.map((d) => d.llMissRate);
          return {
            optim,
            d1MissRate: _.mean(d1MissRates),
            d1StdDev: stdev(d1MissRates),
            lldMissRate: _.mean(lldMissRates),
            lldStdDev: stdev(lldMissRates),
            llMissRate: _.mean(llMissRates),
            llStdDev: stdev(llMissRates),
          };
        }
      );

      resolve({
        data: dataByProgram
          .map((d) => ({
            x: d.map((d) => d.optim),
            y: d.map((d) => {
              if (cacheLevel === "d1") return d.d1MissRate;
              if (cacheLevel === "lld") return d.lldMissRate;
              if (cacheLevel === "ll") return d.llMissRate;
              throw new Error(`Invalid cache level: ${cacheLevel}`);
            }),
            error_y: {},
            type: "bar",
            name: d[0].program,
          }))
          .concat({
            x: data.map((d) => d.optim),
            y: data.map((d) => {
              if (cacheLevel === "d1") return d.d1MissRate;
              if (cacheLevel === "lld") return d.lldMissRate;
              if (cacheLevel === "ll") return d.llMissRate;
              throw new Error(`Invalid cache level: ${cacheLevel}`);
            }),
            error_y: {
              type: "data",
              array: data.map((d) => {
                if (cacheLevel === "d1") return d.d1StdDev;
                if (cacheLevel === "lld") return d.lldStdDev;
                if (cacheLevel === "ll") return d.llStdDev;
                throw new Error(`Invalid cache level: ${cacheLevel}`);
              }),
              visible: true,
            },
            type: "bar",
            name: "average",
          }),
        layout: {
          font: { family: "serif" },
          title: {
            text: `Cache miss rate (${
              cacheLevel == "d1" ? "L1" : cacheLevel == "lld" ? "LLd" : "LL"
            })`,
          },
          xaxis: {
            title: {
              text: "Optimisation",
            },
          },
          yaxis: {
            // type: "log",
            title: {
              text: "Cache miss rate",
            },
          },
        },
      });
    });

    csvStream.pipe(parser);
  });
