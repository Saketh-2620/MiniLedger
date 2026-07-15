require('dotenv').config();
const fs   = require('fs');
const path = require('path');
const pool = require('./pool');

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../../migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // runs in filename order: 001_, 002_, ...

  const client = await pool.connect();
  try {
    // Track which migrations have already run
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        filename VARCHAR(255) PRIMARY KEY,
        run_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const file of files) {
      const { rows } = await client.query(
        'SELECT filename FROM _migrations WHERE filename = $1',
        [file]
      );
      if (rows.length > 0) {
        console.log(`[skip]  ${file}`);
        continue;
      }

      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      console.log(`[ran]   ${file}`);
    }

    console.log('All migrations complete.');
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
