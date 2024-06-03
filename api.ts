import express from "express";
import pg from "pg";
import { tcRelSpeedupByMachine } from "./graphs/tc-rel-speedup-by-machine";
import { tcRelSpeedupByProgram } from "./graphs/tc-rel-speedup-by-program";
import {
  tcRelSpeedupMerged
} from "./graphs/tc-rel-speedup-merged";

const dbPool = new pg.Pool({
  user: "postgres",
  host: "localhost",
  database: "db",
  password: "password",
  port: 5432,
});

const createTable = async () => {
  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS benchmark_data (
      id SERIAL PRIMARY KEY,
      tc FLOAT NOT NULL,
      cg FLOAT NOT NULL,
      program TEXT NOT NULL,
      platform TEXT NOT NULL,
      optimisations TEXT NOT NULL
    );
  `);
};

createTable();

const app = express();

app.use(express.json());

app.get("/data", async (req, res) => {
  console.log("[GetData] ", req.body);

  try {
    const dbResult = await dbPool.query(`
      SELECT * FROM benchmark_data;
    `);

    res.json(dbResult.rows);
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    console.log("[GetData] Internal server error", e);
  }
});

app.post("/data", async (req, res) => {
  const { tc, cg, program, platform, optimisations } = req.body;

  console.log("[AddData] ", req.body);

  if (
    typeof tc !== "number" ||
    typeof cg !== "number" ||
    typeof program !== "string" ||
    typeof platform !== "string" ||
    typeof optimisations !== "string"
  ) {
    res.status(400).json({ error: "Invalid input" });
    console.log("[AddData] Invalid input");
    return;
  }

  try {
    const dbResult = await dbPool.query(
      `
      INSERT INTO benchmark_data (tc, cg, program, platform, optimisations)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id;
    `,
      [tc, cg, program, platform, optimisations]
    );

    res.json({ id: dbResult.rows[0].id });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    console.log("[AddData] Internal server error", e);
  }
});

app.delete("/data", async (req, res) => {
  console.log("[DeleteData] ", req.body);

  try {
    await dbPool.query(`
      DELETE FROM benchmark_data;
    `);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    console.log("[DeleteData] Internal server error", e);
  }
});

app.get("/chart/:id", async (req, res) => {
  const chartGenerators: any = {
    "tc-rel-speedup-merged": tcRelSpeedupMerged,
    "tc-rel-speedup-by-machine": tcRelSpeedupByMachine,
    "tc-rel-speedup-by-program": tcRelSpeedupByProgram,
  };

  const chartId = req.params.id;
  if (!(chartId in chartGenerators)) {
    res.status(404).json({ error: "Chart not found" });
    return;
  }

  const data = await chartGenerators[chartId]();
  console.log("[GetChart] ", chartId, data);
  const baseJson64Data = Buffer.from(JSON.stringify(data)).toString("base64");

  res.setHeader("Content-Type", "text/html");
  res.send(`
<head>
	<script src="https://cdn.plot.ly/plotly-2.32.0.min.js"></script>
</head>

<body>
	<div id="chart"></div>
  <script>
    const plot = JSON.parse(atob("${baseJson64Data}"));
    Plotly.newPlot("chart", plot.data, plot.layout, { responsive: true });
  </script>
</body>
  `);
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
