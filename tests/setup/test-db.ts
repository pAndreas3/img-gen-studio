import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';

let testDb: PGlite;
let db: ReturnType<typeof drizzle>;

export async function setupTestDatabase() {
  try {
    testDb = new PGlite();

    db = drizzle(testDb);

    await migrate(db, { migrationsFolder: './drizzle' });

    return db;
  }
  catch (error) {
    console.error('Error setting up test database:', error);
    throw error;
  }
}

export async function cleanupTestDatabase() {
  if (testDb) {
    await testDb.close();
  }
}

export function getTestDb() {
  if (!db) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return db;
} 