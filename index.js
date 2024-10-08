const express = require('express');
const pool = require('./db');

const app = express();
const port = 3000;

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.render('index', { philosophers: [], error: null });
});

app.get('/all-philosophers', async (req, res) => {
  console.log('GET /all-philosophers route hit');
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT p.name, t.name as theory, c.name as category
        FROM philosophers p
        LEFT JOIN theory_philosopher tp ON p.id = tp.philosopher_id
        LEFT JOIN theories t ON tp.theory_id = t.id
        LEFT JOIN categories c ON t.category_id = c.id
      `;
      const result = await client.query(query);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching all philosophers:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request', 
      details: error.message || 'Unknown error',
    });
  }
});

app.get('/all-theories', async (req, res) => {
  console.log('GET /all-theories route hit');
  try {
    const client = await pool.connect();
    try {
      const query = `
        SELECT t.name as theory, c.name as category
        FROM theories t
        LEFT JOIN categories c ON t.category_id = c.id
      `;
      const result = await client.query(query);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error fetching all theories:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request', 
      details: error.message || 'Unknown error',
    });
  }
});

app.post('/search-philosophers', async (req, res) => {
  console.log('POST /search-philosophers route hit');
  try {
    const { name } = req.body;
    const client = await pool.connect();
    try {
      const query = `
        SELECT p.name, t.name as theory, c.name as category
        FROM philosophers p
        LEFT JOIN theory_philosopher tp ON p.id = tp.philosopher_id
        LEFT JOIN theories t ON tp.theory_id = t.id
        LEFT JOIN categories c ON t.category_id = c.id
        WHERE p.name ILIKE $1
      `;
      const result = await client.query(query, [`%${name}%`]);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error searching philosophers:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request', 
      details: error.message || 'Unknown error',
    });
  }
});

app.post('/search-theories', async (req, res) => {
  console.log('POST /search-theories route hit');
  try {
    const { theory } = req.body;
    const client = await pool.connect();
    try {
      const query = `
        WITH matched_theory AS (
          SELECT t.id, t.name AS theory, t.category_id
          FROM theories t
          WHERE t.name ILIKE $1
        )
        SELECT t.name AS theory, c.name AS category, ARRAY_AGG(DISTINCT p.name) AS philosophers
        FROM theories t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN theory_philosopher tp ON t.id = tp.theory_id
        LEFT JOIN philosophers p ON tp.philosopher_id = p.id
        WHERE t.category_id = (SELECT category_id FROM matched_theory)
        GROUP BY t.name, c.name
        ORDER BY 
          CASE WHEN t.name ILIKE $1 THEN 0 ELSE 1 END,
          t.name
      `;
      const result = await client.query(query, [`%${theory}%`]);
      res.json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error searching theories:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your request', 
      details: error.message || 'Unknown error',
    });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
