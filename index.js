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
    }
  } catch (error) {
    console.error('Error fetching all philosophers:', error);
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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
