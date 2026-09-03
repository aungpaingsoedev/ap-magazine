import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    // Allow build to succeed; runtime requires a real connection string
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return 'postgresql://build:build@localhost/build';
    }
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}

const sql = neon(getDatabaseUrl());
export const db = drizzle(sql, { schema });
