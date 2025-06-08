const express = require('express');
const { Pool } = require('pg');
const app = express();

// Подключение к PostgreSQL
const pool = new Pool({
  user: 'postgres',
  password: 'j06gOuqDHwWkvpWf',
  host: 'localhost',
  database: 'Base_',
  port: 5433
});

// Проверка подключения к БД
pool.query('SELECT NOW()', (err) => {
  if (err) console.error('Ошибка PostgreSQL:', err.message);
  else console.log('PostgreSQL подключен');
});

// Маршруты
app.get('/', (req, res) => {
  res.send(`
    <h1>Сервер работает!</h1>
    <p>Доступные эндпоинты:</p>
    <ul>
      <li><a href="/api/test">/api/test</a> - Проверка сервера</li>
      <li><a href="/api/sanizones">/api/sanizones</a> - Данные из таблицы</li>
    </ul>
  `);
});

app.get('/api/test', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW() AS time');
    res.json({ 
      status: "OK", 
      time: rows[0].time,
      db: "PostgreSQL отвечает"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sanizones', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM "Sanizones"');
    res.json(rows.length > 0 ? rows : { message: 'Таблица пуста' });
  } catch (err) {
    res.status(500).json({ 
      error: "Ошибка запроса",
      details: err.message,
      hint: "Проверьте название таблицы (регистр букв!)"
    });
  }
});

const PORT = 5000; // Или любой другой свободный порт
app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});