import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import 'dotenv/config';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../data');

mkdirSync(dataDir, { recursive: true });

const config = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_URL ?? resolve(dataDir, 'contract_analyzer.db'),
    },
    migrations: {
      directory: resolve(__dirname, 'migrations'),
    },
    seeds: {
      directory: resolve(__dirname, 'seeds'),
    },
    useNullAsDefault: true,
  },
};

export default config;
