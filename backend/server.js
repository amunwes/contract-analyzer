// server.js - Run this with: node server.js

import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import db from "./db/index.js";
import { analyzeHandler } from "./routes/analyze.js";

dotenv.config();

db.raw('SELECT 1')
  .then(() => console.log('Database connection established'))
  .catch((err) => console.warn('Database not initialized — run npm run db:init:', err.message));

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/analyze', analyzeHandler);

app.listen(PORT, () => {
	console.log(`Backend server running on http://localhost:${PORT}`);
});
