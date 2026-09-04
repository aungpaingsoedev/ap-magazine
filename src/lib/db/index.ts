import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

const DEFAULT_DB_PATH = path.join(process.cwd(), 'data', 'cms.db');

function resolveDbPath(): string {
  const fromEnv = process.env.DATABASE_URL?.trim();
  if (!fromEnv || fromEnv === ':memory:') {
    return fromEnv === ':memory:' ? ':memory:' : DEFAULT_DB_PATH;
  }
  if (fromEnv.startsWith('file:')) {
    return fromEnv.slice('file:'.length);
  }
  return fromEnv;
}

function openSqlite() {
  const dbPath = resolveDbPath();
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return sqlite;
}

const globalForDb = globalThis as typeof globalThis & {
  __apSqlite?: Database.Database;
};

const client =
  globalForDb.__apSqlite ??
  openSqlite();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__apSqlite = client;
}

export const db = drizzle(client, { schema });
