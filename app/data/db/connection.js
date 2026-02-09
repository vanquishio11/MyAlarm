/**
 * Database connection and migration runner.
 * Use with SQLiteProvider onInit: onInit={runMigrations}
 * Then use useSQLiteContext() in components to get db.
 */

import * as SQLite from "expo-sqlite";
import migration001 from "./migrations/001_initial.js";

const DB_NAME = "alarms.db";

const MIGRATIONS = [migration001];

/**
 * Run all pending migrations on the given db instance.
 * Call this from SQLiteProvider onInit.
 * @param {import('expo-sqlite').SQLiteDatabase} db
 */
export async function runMigrations(db) {
  await db.execAsync("PRAGMA journal_mode = WAL");
  await db.execAsync(
    "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER NOT NULL)"
  );
  let row = await db.getFirstAsync("SELECT version FROM schema_version");
  let currentVersion = row ? row.version : 0;
  if (!row) {
    await db.runAsync("INSERT INTO schema_version (version) VALUES (?)", 0);
  }

  for (const m of MIGRATIONS) {
    if (m.version > currentVersion) {
      await db.execAsync(m.sql);
      await db.runAsync(
        "INSERT OR REPLACE INTO schema_version (version) VALUES (?)",
        m.version
      );
      currentVersion = m.version;
    }
  }
}

/**
 * Open the alarms database. Use when not using SQLiteProvider (e.g. in services).
 * Caller must close when done, or use SQLiteProvider for component tree.
 */
export async function openDb() {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await runMigrations(db);
  return db;
}

export { DB_NAME };
