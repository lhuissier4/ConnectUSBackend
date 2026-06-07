import { readdirSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { DataSource } from 'typeorm';

const MIGRATIONS_DIR = resolve(__dirname, '..', '..', 'bdd', 'migrations');

/**
 * Applique les migrations Flyway (`bdd/migrations/V*.sql`), dans l'ordre de
 * version, à un Postgres éphémère utilisé par les tests (testcontainers).
 * Crée le schéma complet et injecte le seed utilisateurs (V5).
 */
export async function applyMigrations(dataSource: DataSource): Promise<void> {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => /^V\d+__.*\.sql$/.test(f))
    .sort(
      (a, b) => Number(/^V(\d+)/.exec(a)![1]) - Number(/^V(\d+)/.exec(b)![1]),
    );

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    await dataSource.query(sql);
  }
}
