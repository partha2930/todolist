const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres.lrsbckwyfkulmbjnrsiq:Adap@76800612@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

// Helper to match mysql2 API so we don't have to rewrite everything
pool.execute = async (sql, params) => {
  let pgSql = sql;

  // Translate MySQL INSERT IGNORE to Postgres ON CONFLICT DO NOTHING
  const isInsertIgnore = /INSERT IGNORE INTO/i.test(pgSql);
  if (isInsertIgnore) {
    pgSql = pgSql.replace(/INSERT IGNORE INTO/ig, 'INSERT INTO');
    pgSql = pgSql.trim();
    if (pgSql.endsWith(';')) pgSql = pgSql.slice(0, -1);
    pgSql += ' ON CONFLICT DO NOTHING';
  }

  // Convert ? to $1, $2, etc for postgres
  if (params && params.length > 0) {
    let i = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${i++}`);
  }
  
  const isInsert = pgSql.trim().toUpperCase().startsWith('INSERT');
  const isUpdate = pgSql.trim().toUpperCase().startsWith('UPDATE');
  const isDelete = pgSql.trim().toUpperCase().startsWith('DELETE');

  // Append RETURNING id for inserts so we can get insertId
  if (isInsert && !pgSql.toUpperCase().includes('RETURNING')) {
    pgSql += ' RETURNING id';
  }

  try {
    const result = await pool.query(pgSql, params);
    
    if (isInsert || isUpdate || isDelete) {
      return [{
        insertId: (isInsert && result.rows.length > 0) ? result.rows[0].id : null,
        affectedRows: result.rowCount
      }];
    }

    // mysql2 returns [rows, fields] for SELECTs
    return [result.rows, result.fields];
  } catch (err) {
    console.error('Database Error:', err.message, 'Query:', pgSql);
    throw err;
  }
};

module.exports = pool;
