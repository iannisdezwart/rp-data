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

const optimConsts: { [k: string]: number } = {
  None: 1.0,
  "Optim 1": 0.9,
  "Optim 2": 0.77,
  "Optim 3": 0.73,
  "Optim 4": 0.55,
};

for (const pl in platforms) {
  const platform = pl;

  for (const prog in platforms[pl]) {
    const program = prog;
    const data = platforms[pl][prog];

    for (const optim in optimConsts) {
      const optimisations = optim;
      const factor = optimConsts[optim];

      for (const _ of Array(10)) {
        const tcVar = Math.random() * 0.2 - 0.1;
        const cgVar = Math.random() * 0.2 - 0.1;

        addData({
          tc: data.tc * (factor + tcVar),
          cg: data.cg * (factor + cgVar),
          program,
          platform,
          optimisations,
        });
      }
    }
  }
}
