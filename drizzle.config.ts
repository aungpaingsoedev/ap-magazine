import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';
import path from 'node:path';

const url =
  process.env.DATABASE_URL?.replace(/^file:/, '') ||
  path.join(process.cwd(), 'data', 'cms.db');

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url,
  },
});
