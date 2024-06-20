import { parse } from "csv-parse";
import { createReadStream } from "fs";
import { BenchmarkData } from "./types";

// First CLI argument is the file path
// Second CLI argument is the platform

const filePath = process.argv[2];
const platform = process.argv[3];
const csvStream = createReadStream(filePath);

// CSV format:
// Header: branch,program,iteration,type_time,codegen_time
// Data: optimisation_1,SampleTranspiledPrograms/chibicc_combined.tea,1,4276,1373

const parser = parse({
  delimiter: ",",
  columns: true,
});

const addData = (data: BenchmarkData) => {
  (async () => {
    const res = await fetch("http://localhost:3000/data", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log(await res.json());
  })();
};

const mapOpt = (branch: string) => {
  if (branch === "main") {
    return "none";
  }
  return branch;
};

parser.on("readable", () => {
  let record;
  while ((record = parser.read())) {
    addData({
      tc: parseInt(record.type_time),
      cg: parseInt(record.codegen_time),
      program: record.program.replace("SampleTranspiledPrograms/", ""),
      platform: platform,
      optimisations: mapOpt(record.branch),
    });
  }
});

csvStream.pipe(parser);
