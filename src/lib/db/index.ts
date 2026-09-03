import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Allow build to succeed; runtime requires a real connection string
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return 'postgresql://build:build@localhost:5432/build';
    }
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}

const client = postgres(getDatabaseUrl(), {
  prepare: false, // required for Supabase transaction pooler (port 6543)
  max: 10,
});

export const db = drizzle(client, { schema });
