
import { Pool } from 'pg';
import { randomUUID } from 'crypto';


import app from './app';


async function testPostgres(pool: Pool) {
  const id = randomUUID();
  const name = 'Satoshi';
  const email = 'Nakamoto';

  await pool.query(`DELETE FROM users;`);

  await pool.query(`
    INSERT INTO users (id, name, email)
    VALUES ($1, $2, $3);
  `, [id, name, email]);

  const { rows } = await pool.query(`
    SELECT * FROM users;
  `);

  console.log('USERS', rows);
}

async function createTables(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL
    );
  `);

  await pool.query(`
      CREATE TABLE IF NOT EXISTS blocks (
        id TEXT PRIMARY KEY,
        height INTEGER  NOT NULL,
        transactions TEXT NOT NULL
      );`);
}

async function bootstrap() {
  console.log('Bootstrapping...');
  const databaseUrl = process.env.DATABASE_URL;
  console.log('databaseurl',databaseUrl)
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({
    connectionString: databaseUrl
  });

  await createTables(pool);
  await testPostgres(pool);
}

try {
  await bootstrap();
  await app.listen({
    port: 3000,
    host: '0.0.0.0'
  })
} catch (err) {
  app.log.error(err)
  process.exit(1)
};
