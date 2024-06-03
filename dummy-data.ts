import { BenchmarkData } from "./types";

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

const platforms: {
  [pl: string]: {
    [pr: string]: {
      tc: number;
      cg: number;
    };
  };
} = {
  "Intel Xeon E5-2630 v4": {
    program_1: {
      tc: 16.68,
      cg: 4.13,
    },
    program_2: {
      tc: 30.0,
      cg: 8.0,
    },
    program_3: {
      tc: 70.0,
      cg: 20.0,
    },
  },
  "Apple M2 Pro 12-core": {
    program_1: {
      tc: 7.0,
      cg: 2.0,
    },
    program_2: {
      tc: 14.0,
      cg: 4.4,
    },
    program_3: {
      tc: 24.0,
      cg: 9.5,
    },
  },
  "AMD Ryzen XXX": {
    program_1: {
      tc: 12.0,
      cg: 3.0,
    },
    program_2: {
      tc: 22.0,
      cg: 6.0,
    },
    program_3: {
      tc: 45.0,
      cg: 14.0,
    },
  },
};

const optimConsts: {
  [opt: string]: {
    [pl: string]: { tc: number; cg: number };
  };
} = {
  None: {
    "Intel Xeon E5-2630 v4": { tc: 1.0, cg: 1.0 },
    "Apple M2 Pro 12-core": { tc: 1.0, cg: 1.0 },
    "AMD Ryzen XXX": { tc: 1.0, cg: 1.0 },
  },
  "Optim 1": {
    "Intel Xeon E5-2630 v4": { tc: 0.9, cg: 0.93 },
    "Apple M2 Pro 12-core": { tc: 0.83, cg: 0.87 },
    "AMD Ryzen XXX": { tc: 0.94, cg: 0.94 },
  },
  "Optim 2": {
    "Intel Xeon E5-2630 v4": { tc: 0.77, cg: 0.81 },
    "Apple M2 Pro 12-core": { tc: 0.67, cg: 0.75 },
    "AMD Ryzen XXX": { tc: 0.78, cg: 0.8 },
  },
  "Optim 3": {
    "Intel Xeon E5-2630 v4": { tc: 0.73, cg: 0.81 },
    "Apple M2 Pro 12-core": { tc: 0.69, cg: 0.74 },
    "AMD Ryzen XXX": { tc: 0.65, cg: 0.78 },
  },
  "Optim 4": {
    "Intel Xeon E5-2630 v4": { tc: 0.65, cg: 0.77 },
    "Apple M2 Pro 12-core": { tc: 0.48, cg: 0.71 },
    "AMD Ryzen XXX": { tc: 0.62, cg: 0.76 },
  },
};

for (const pl in platforms) {
  const platform = pl;

  for (const prog in platforms[pl]) {
    const program = prog;
    const data = platforms[pl][prog];

    for (const optim in optimConsts) {
      const optimisations = optim;
      const factor = optimConsts[optim][pl];

      for (const _ of Array(10)) {
        const tcVar = Math.random() * 0.2 - 0.1;
        const cgVar = Math.random() * 0.2 - 0.1;

        addData({
          tc: data.tc * (factor.tc + tcVar),
          cg: data.cg * (factor.cg + cgVar),
          program,
          platform,
          optimisations,
        });
      }
    }
  }
}
