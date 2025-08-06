import { createPool, sql } from '@vercel/postgres';

const db = createPool();

export { db };
export default sql;