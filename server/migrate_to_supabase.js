const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:Adap@76800612@db.lrsbckwyfkulmbjnrsiq.supabase.co:5432/postgres'
});

const schema = `
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  theme VARCHAR(20) DEFAULT 'light',
  "profilePic" TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
  category VARCHAR(50) NOT NULL DEFAULT 'WORK',
  "dueDate" VARCHAR(50),
  completed BOOLEAN NOT NULL DEFAULT false,
  "createdAt" BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.task_collaborators (
  task_id INT NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  PRIMARY KEY (task_id, user_id)
);
`;

async function migrate() {
  try {
    await pool.query(schema);
    console.log('Successfully created tables in Supabase Postgres!');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await pool.end();
  }
}

migrate();
