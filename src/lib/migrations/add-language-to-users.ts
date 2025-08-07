import sql from '../db';
import logger from '../logger';

async function addLanguageToUsers() {
  try {
    await sql`
      ALTER TABLE users
      ADD COLUMN language VARCHAR(10) DEFAULT 'en'
    `;
    logger.info('Migration successful: Added language column to users table.');
  } catch (error) {
    logger.error({ err: error }, 'Migration failed');
  }
}

addLanguageToUsers();