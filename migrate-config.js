require('dotenv').config({ path: '.env.local' });

module.exports = {
  databaseUrl: process.env.POSTGRES_URL,
  dir: 'src/lib/migrations',
  migrationsTable: 'pgmigrations',
  // The following are recommended settings for Vercel Postgres
  ssl: {
    rejectUnauthorized: false,
  },
  // It's recommended to specify the schema for migrations
  migrationsSchema: 'public',
};