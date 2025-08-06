import sql from '../db';

async function addLanguageToUsers() {
  try {
    await sql`
      ALTER TABLE users
      ADD COLUMN language VARCHAR(10) DEFAULT 'en'
    `;
    console.log('Migration successful: Added language column to users table.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

addLanguageToUsers();