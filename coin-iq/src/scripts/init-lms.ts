import pool from '../lib/db';
import fs from 'fs';
import path from 'path';

async function initLMS() {
  const sql = fs.readFileSync(path.join(__dirname, '../lib/lms-schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('✅ LMS tables created');
  await pool.end();
}

initLMS().catch(e => { console.error(e); process.exit(1); });
