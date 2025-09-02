const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const db = new sqlite3.Database(':memory:');

db.serialize(() => {
  db.run(`CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  const sampleTasks = [
    ['Fix login bug', 'Users cannot log in with special characters in password', 'pending', 'high'],
    ['Add dark mode', 'Implement dark mode theme for better user experience', 'pending', 'medium'],
    ['Update documentation', 'API documentation needs to be updated with new endpoints', 'pending', 'low'],
    ['Performance optimization', 'Optimize database queries for better performance', 'in-progress', 'high'],
    ['Add unit tests', 'Increase test coverage for critical components', 'pending', 'medium']
  ];

  const stmt = db.prepare('INSERT INTO tasks (title, description, status, priority) VALUES (?, ?, ?, ?)');
  sampleTasks.forEach(task => {
    stmt.run(task);
  });
  stmt.finalize();
});

app.get('/api/tasks', (req, res) => {
  db.all('SELECT * FROM tasks ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/tasks', (req, res) => {
  const { title, description, priority = 'medium' } = req.body;
  
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  db.run(
    'INSERT INTO tasks (title, description, priority) VALUES (?, ?, ?)',
    [title, description, priority],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID, title, description, priority, status: 'pending' });
    }
  );
});

app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status, priority, title, description } = req.body;
  
  const updates = [];
  const values = [];
  
  if (status) {
    updates.push('status = ?');
    values.push(status);
  }
  if (priority) {
    updates.push('priority = ?');
    values.push(priority);
  }
  if (title) {
    updates.push('title = ?');
    values.push(title);
  }
  if (description) {
    updates.push('description = ?');
    values.push(description);
  }
  
  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }
  
  values.push(id);
  
  db.run(
    `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
    values,
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Task not found' });
        return;
      }
      res.json({ message: 'Task updated successfully' });
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
