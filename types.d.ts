export type BenchmarkData = {
  tc: number;
  cg: number;
  program: string;
  platform: string;
  optimisations: string;
};

export type BenchmarkDataWithId = BenchmarkData & {
  id: number;
};
