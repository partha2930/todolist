const express = require('express');
const cors = require('cors');
const path = require('path');
const pool = require('./db');
const authRouter = require('./routes/auth');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRouter);

// Helper to map DB row to JS boolean for completed
const mapTask = (row) => ({
  ...row,
  completed: row.completed === 1
});

// 0. Get all users to invite
app.get('/api/users', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, username, email FROM users WHERE id != ?', [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Get all tasks for the logged in user (Creator OR ACCEPTED Collaborator)
app.get('/api/tasks', auth, async (req, res) => {
  try {
    const sql = `
      SELECT DISTINCT t.* 
      FROM tasks t 
      LEFT JOIN task_collaborators tc ON t.id = tc.task_id 
      WHERE t.user_id = ? OR (tc.user_id = ? AND tc.status = 'ACCEPTED')
    `;
    const [rows] = await pool.execute(sql, [req.user.id, req.user.id]);
    
    // Also fetch ALL accepted collaborators for each task
    for (let task of rows) {
      const [collabs] = await pool.execute(`
        SELECT u.email 
        FROM task_collaborators tc 
        JOIN users u ON tc.user_id = u.id 
        WHERE tc.task_id = ? AND tc.status = "ACCEPTED"
      `, [task.id]);
      task.collaboratorEmails = collabs.map(c => c.email);
    }
    
    res.json(rows.map(mapTask));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// 1.5. Search tasks for the logged in user
app.get('/api/tasks/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.json([]);
    }
    
    // Extract keywords (split by space, filter empty)
    const keywords = q.split(' ').filter(k => k.trim().length > 0);
    if (keywords.length === 0) {
      return res.json([]);
    }

    let baseSql = `
      SELECT DISTINCT t.* 
      FROM tasks t 
      LEFT JOIN task_collaborators tc ON t.id = tc.task_id 
      WHERE (t.user_id = ? OR (tc.user_id = ? AND tc.status = 'ACCEPTED'))
    `;
    let params = [req.user.id, req.user.id];

    // Build the OR conditions for keywords
    let keywordConditions = [];
    for (let kw of keywords) {
      keywordConditions.push('(t.title LIKE ? OR t.description LIKE ?)');
      params.push(`%${kw}%`, `%${kw}%`);
    }

    if (keywordConditions.length > 0) {
      baseSql += ' AND (' + keywordConditions.join(' OR ') + ')';
    }

    const [rows] = await pool.execute(baseSql, params);
    
    // Also fetch ALL accepted collaborators for each task
    for (let task of rows) {
      const [collabs] = await pool.execute(`
        SELECT u.email 
        FROM task_collaborators tc 
        JOIN users u ON tc.user_id = u.id 
        WHERE tc.task_id = ? AND tc.status = "ACCEPTED"
      `, [task.id]);
      task.collaboratorEmails = collabs.map(c => c.email);
    }
    
    res.json(rows.map(mapTask));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Create a new task
app.post('/api/tasks', auth, async (req, res) => {
  const { title, description, priority, category, dueDate, completed, createdAt, collaboratorEmails } = req.body;
  const sql = `
    INSERT INTO tasks (user_id, title, description, priority, category, dueDate, completed, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    req.user.id,
    title,
    description || '',
    priority || 'MEDIUM',
    category || 'WORK',
    dueDate || '',
    completed ? 1 : 0,
    createdAt || Date.now()
  ];

  try {
    const [result] = await pool.execute(sql, params);
    const taskId = result.insertId;

    let validCollaboratorEmails = [];
    if (collaboratorEmails && Array.isArray(collaboratorEmails)) {
      for (const email of collaboratorEmails) {
        const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
          const colId = users[0].id;
          validCollaboratorEmails.push(email);
          await pool.execute('INSERT IGNORE INTO task_collaborators (task_id, user_id, status) VALUES (?, ?, "PENDING")', [taskId, colId]);
        }
      }
    }

    res.json({
      id: taskId,
      user_id: req.user.id,
      title,
      description: params[2],
      priority: params[3],
      category: params[4],
      dueDate: params[5],
      completed: params[6] === 1,
      createdAt: params[7],
      collaboratorEmails: validCollaboratorEmails
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update a task (Allowed if Creator OR ACCEPTED Collaborator)
app.put('/api/tasks/:id', auth, async (req, res) => {
  const id = req.params.id;
  
  try {
    const [tasks] = await pool.execute(
      'SELECT t.* FROM tasks t LEFT JOIN task_collaborators tc ON t.id = tc.task_id WHERE t.id = ? AND (t.user_id = ? OR (tc.user_id = ? AND tc.status = "ACCEPTED"))', 
      [id, req.user.id, req.user.id]
    );
    
    if (tasks.length === 0) {
      return res.status(404).json({ error: 'Task not found or you do not have permission to edit it.' });
    }

    const existingTask = tasks[0];
    const isCreator = existingTask.user_id === req.user.id;

    const title = req.body.title !== undefined ? req.body.title : existingTask.title;
    const description = req.body.description !== undefined ? req.body.description : existingTask.description;
    const priority = req.body.priority !== undefined ? req.body.priority : existingTask.priority;
    const category = req.body.category !== undefined ? req.body.category : existingTask.category;
    const dueDate = req.body.dueDate !== undefined ? req.body.dueDate : existingTask.dueDate;
    const completed = req.body.completed !== undefined ? (req.body.completed ? 1 : 0) : existingTask.completed;
    const createdAt = req.body.createdAt !== undefined ? req.body.createdAt : existingTask.createdAt;
    const collaboratorEmails = req.body.collaboratorEmails;

    const sql = `
      UPDATE tasks 
      SET title = ?, description = ?, priority = ?, category = ?, dueDate = ?, completed = ?, createdAt = ?
      WHERE id = ?
    `;
    const params = [title, description, priority, category, dueDate, completed, createdAt, id];

    await pool.execute(sql, params);
    
    let validCollaboratorEmails = [];
    if (isCreator && collaboratorEmails && Array.isArray(collaboratorEmails)) {
      for (const email of collaboratorEmails) {
        const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length > 0) {
          const colId = users[0].id;
          validCollaboratorEmails.push(email);
          await pool.execute('INSERT IGNORE INTO task_collaborators (task_id, user_id, status) VALUES (?, ?, "PENDING")', [id, colId]);
        }
      }
    }

    res.json({ 
      id: parseInt(id, 10), 
      user_id: existingTask.user_id, 
      title, 
      description, 
      priority, 
      category, 
      dueDate, 
      completed: completed === 1, 
      createdAt,
      collaboratorEmails: validCollaboratorEmails
    });
  } catch (err) {
    console.error('Update Task Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 4. Delete a task (Only Creator)
app.delete('/api/tasks/:id', auth, async (req, res) => {
  const id = req.params.id;
  try {
    const [result] = await pool.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found or you do not have permission to delete it.' });
    }
    res.json({ message: 'Task deleted', id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Invite a collaborator
app.post('/api/tasks/:id/invite', auth, async (req, res) => {
  const taskId = req.params.id;
  const { email } = req.body; // user email to invite
  
  try {
    // Check if task belongs to the user
    const [tasks] = await pool.execute('SELECT id FROM tasks WHERE id = ? AND user_id = ?', [taskId, req.user.id]);
    if (tasks.length === 0) {
      return res.status(403).json({ error: 'Only the task creator can invite collaborators.' });
    }

    // Look up user by email
    const [users] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User with that email not found.' });
    }
    const userId = users[0].id;

    // Insert pending request
    await pool.execute('INSERT IGNORE INTO task_collaborators (task_id, user_id, status) VALUES (?, ?, "PENDING")', [taskId, userId]);
    
    res.json({ message: 'Invitation sent.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get pending requests for the logged in user
app.get('/api/requests', auth, async (req, res) => {
  try {
    const sql = `
      SELECT t.id as task_id, t.title as task_title, u.username as creator_name
      FROM task_collaborators tc
      JOIN tasks t ON tc.task_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE tc.user_id = ? AND tc.status = 'PENDING'
    `;
    const [rows] = await pool.execute(sql, [req.user.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Accept or Decline a request
app.put('/api/requests/:taskId', auth, async (req, res) => {
  const taskId = req.params.taskId;
  const { status } = req.body; // 'ACCEPTED' or 'DECLINED'
  
  if (status !== 'ACCEPTED' && status !== 'DECLINED') {
    return res.status(400).json({ error: 'Status must be ACCEPTED or DECLINED' });
  }

  try {
    if (status === 'DECLINED') {
      await pool.execute('DELETE FROM task_collaborators WHERE task_id = ? AND user_id = ?', [taskId, req.user.id]);
      return res.json({ message: 'Request declined and removed.' });
    }

    const [result] = await pool.execute(
      'UPDATE task_collaborators SET status = "ACCEPTED" WHERE task_id = ? AND user_id = ? AND status = "PENDING"',
      [taskId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Pending request not found.' });
    }
    
    res.json({ message: 'Request accepted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  pool.connect()
    .then(client => {
      console.log('Connected to Supabase PostgreSQL database');
      client.release();
    })
    .catch(err => {
      console.error('Error connecting to Supabase database:', err);
    });
});
