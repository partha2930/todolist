const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: 'postgresql://postgres.lrsbckwyfkulmbjnrsiq:Adap@76800612@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true'
});

// Helper to match mysql2 API so we don't have to rewrite everything
pool.execute = async (sql, params) => {
  // Convert ? to $1, $2, etc for postgres
  let pgSql = sql;
  if (params && params.length > 0) {
    let i = 1;
    pgSql = pgSql.replace(/\?/g, () => `$${i++}`);
  }
  
  const result = await pool.query(pgSql, params);
  // mysql2 returns [rows, fields]
  return [result.rows, result.fields];
};

module.exports = pool;
