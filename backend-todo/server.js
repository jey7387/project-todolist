require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(bodyParser.json());

// PostgreSQL Database Connection
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test database connection
pool.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Database connection error:', err));

// Token authentication middleware
const authenticateToken = (req, res, next) => {

  // Extract the Authorization header and token
  const authHeader = req.header('Authorization');
  if (!authHeader) {
    
    return res.status(401).json({ message: 'Authorization header missing' });
  }
  const token = authHeader.split(' ')[1];


  // Check if the token exists
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  // Verify the token using the secret
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
 
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    req.user_id = user.id; // Ensure `user.id` exists in the token payload

    next(); // Proceed to the next middleware or route handler
  });
};

// Routes
app.get('/', (req, res) => {
  res.send('Welcome to the To-Do API');
});

app.get('/auth/user', authenticateToken, (req, res) => {
  res.json({ user_id: req.user.id, user: req.user });
});

// Register route
app.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: 'User registered successfully', user: result.rows[0] });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      'SELECT id, name, email, password FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const user = result.rows[0];
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user.id, name: user.name, email: user.email, user_id: user.id  },
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Additional routes updated for naming consistency
app.get('/tasks/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;

  if (req.user.id !== parseInt(userId)) {
    return res.status(403).json({ message: 'Unauthorized access' });
  }

  try {
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tasks:', err.message);
    res.status(500).send('Server error');
  }
});

// Other routes remain unchanged with naming adjustments


// Get tasks for a specific user
app.get('/tasks/:user_id', authenticateToken, async (req, res) => {
  const { user_id } = req.params;

  // Check if the authenticated user matches the user_id in the URL
  if (req.user.id !== parseInt(user_id)) {
    return res.status(403).json({ message: 'Unauthorized access' });
  }

  try {
    // Fetch tasks for the specific user from the database
    const result = await pool.query('SELECT * FROM tasks WHERE user_id = $1', [user_id]);
    const tasks = await Task.find({ user_id: userId });
    res.json(tasks);
    // Check if the result is an array and return it; else, return an empty array
    res.json({ user_id: user_id, tasks: Array.isArray(result.rows) ? result.rows : [] });
  } catch (err) {
    console.error('Error fetching tasks for user:', err.message);
    res.status(500).json({ error: 'Internal server error while fetching tasks for user' });
  }
});


// Add a new task for a specific user
app.post('/tasks', authenticateToken, async (req, res) => {
  const { text, user_id } = req.body;

  if (!text || !user_id) {
    return res.status(400).json({ message: 'Invalid input data' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO tasks (text, completed, user_id) VALUES ($1, $2, $3) RETURNING *',
      [text, false, user_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding task:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});


// Update a task
app.put('/tasks/:id', async (req, res) => {
  const { id } = req.params;
  const { completed } = req.body;

  try {
    const result = await pool.query(
      'UPDATE tasks SET completed = $1 WHERE id = $2 RETURNING *',
      [completed, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating task:', err.message);
    res.status(500).send('Server error');
  }
});

// Delete a task
app.delete('/tasks/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
    res.send('Task deleted');
  } catch (err) {
    console.error('Error deleting task:', err.message);
    res.status(500).send('Server error');
  }
});

// Search tasks by text
app.get('/tasks/search/:userId', async (req, res) => {
  const { userId } = req.params;
  const { query } = req.query;

  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 AND text ILIKE $2',
      [userId, `%${query}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching tasks:', err.message);
    res.status(500).send('Server error');
  }
});

// Paginate tasks
app.get('/tasks/paginate/:userId',  authenticateToken,async (req, res) => {
  const { userId } = req.params;
  const { page, limit } = req.query;

  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      'SELECT * FROM tasks WHERE user_id = $1 LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );
    res.json({ user_id: userId, tasks: result.rows });
  } catch (err) {
    console.error('Error paginating tasks:', err.message);
    res.status(500).send('Server error');
  }
});

// Mark all tasks as completed
app.put('/tasks/complete-all/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    await pool.query(
      'UPDATE tasks SET completed = true WHERE user_id = $1',
      [userId]
    );
    res.send('All tasks marked as complete');
  } catch (err) {
    console.error('Error marking all tasks as complete:', err.message);
    res.status(500).send('Server error');
  }
});

// Delete all tasks for a user
app.delete('/tasks/delete-all/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    await pool.query('DELETE FROM tasks WHERE user_id = $1', [userId]);
    res.send('All tasks deleted');
  } catch (err) {
    console.error('Error deleting all tasks:', err.message);
    res.status(500).send('Server error');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});