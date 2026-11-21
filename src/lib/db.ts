import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL_NON_POOLING;

export const isDbConfigured = Boolean(connectionString);

/**
 * Cliente SQL Serverless para Neon / Vercel Postgres
 */
export const sql = connectionString ? neon(connectionString) : null;
