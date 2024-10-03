import { Pool } from "pg";

export const getDataBase = () => {
    const databaseUrl = process.env.DATABASE_URL;
  console.log('databaseurl',databaseUrl)
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const pool = new Pool({
    connectionString: databaseUrl
  });

  return pool
}