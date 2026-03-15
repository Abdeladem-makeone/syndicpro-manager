import express from 'express';
import cors from 'cors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*'
}));
app.use(express.json({ limit: '50mb' }));

const dbPromise = open({
  filename: path.join(__dirname, 'database.sqlite'),
  driver: sqlite3.Database
});

async function setupDb() {
  const db = await dbPromise;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS BuildingInfo (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS Apartments (
      id TEXT PRIMARY KEY,
      number TEXT,
      owner TEXT,
      shares REAL,
      monthlyFee REAL,
      floor INTEGER,
      phone TEXT,
      email TEXT
    );

    CREATE TABLE IF NOT EXISTS Expenses (
      id TEXT PRIMARY KEY,
      date TEXT,
      category TEXT,
      description TEXT,
      amount REAL,
      excludedFromReports INTEGER
    );

    CREATE TABLE IF NOT EXISTS Payments (
      id TEXT PRIMARY KEY,
      apartmentId TEXT,
      month INTEGER,
      year INTEGER,
      amount REAL,
      paidDate TEXT
    );

    CREATE TABLE IF NOT EXISTS Operations (
      id TEXT PRIMARY KEY,
      type TEXT, -- 'project' | 'complaint'
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS Assets (
      id TEXT PRIMARY KEY,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS AssetPayments (
      id TEXT PRIMARY KEY,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS ProfileRequests (
      id TEXT PRIMARY KEY,
      data TEXT
    );

    CREATE TABLE IF NOT EXISTS Reminders (
      id TEXT PRIMARY KEY,
      data TEXT
    );
    
    CREATE TABLE IF NOT EXISTS Documents (
      id TEXT PRIMARY KEY,
      data TEXT
    );
  `);

  console.log("Base de données SQLite initialisée.");
}

setupDb().catch(console.error);

// --- API ROUTES ---

// Initialisation & Building Info
app.post('/api/setup', async (req, res) => {
  try {
    const { building, apartments } = req.body;
    const db = await dbPromise;
    await db.run('INSERT OR REPLACE INTO BuildingInfo (id, data) VALUES (1, ?)', JSON.stringify(building || {}));

    if (apartments && apartments.length > 0) {
      await db.run('DELETE FROM Apartments');
      for (const apt of apartments) {
        await db.run(`
          INSERT INTO Apartments (id, number, owner, shares, monthlyFee, floor, phone, email) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [apt.id, apt.number, apt.owner, apt.shares, apt.monthlyFee, apt.floor, apt.phone, apt.email]);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/building', async (req, res) => {
  try {
    const db = await dbPromise;
    const row = await db.get('SELECT data FROM BuildingInfo WHERE id = 1');
    res.json(row ? JSON.parse(row.data) : null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apartments
app.get('/api/apartments', async (req, res) => {
  try {
    const db = await dbPromise;
    const rows = await db.all('SELECT * FROM Apartments');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/apartments/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const apt = req.body;
    await db.run(`
      INSERT OR REPLACE INTO Apartments (id, number, owner, shares, monthlyFee, floor, phone, email) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [apt.id, apt.number, apt.owner, apt.shares, apt.monthlyFee, apt.floor, apt.phone, apt.email]);
    res.json(apt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/apartments', async (req, res) => {
  try {
    const db = await dbPromise;
    const apt = req.body;
    await db.run(`
      INSERT INTO Apartments (id, number, owner, shares, monthlyFee, floor, phone, email) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [apt.id, apt.number, apt.owner, apt.shares, apt.monthlyFee, apt.floor, apt.phone, apt.email]);
    res.json(apt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/apartments/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM Apartments WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Finances (Expenses & Payments & AssetPayments)
app.get('/api/finances', async (req, res) => {
  try {
    const db = await dbPromise;
    const payments = await db.all('SELECT * FROM Payments');
    const expenses = await db.all('SELECT * FROM Expenses');
    const assetPaymentsRows = await db.all('SELECT * FROM AssetPayments');

    res.json({
      payments,
      expenses: expenses.map(e => ({ ...e, excludedFromReports: !!e.excludedFromReports })),
      assetPayments: assetPaymentsRows.map(r => JSON.parse(r.data))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payments', async (req, res) => {
  try {
    const db = await dbPromise;
    const p = req.body;
    await db.run(`
      INSERT OR REPLACE INTO Payments (id, apartmentId, month, year, amount, paidDate) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [p.id, p.apartmentId, p.month, p.year, p.amount, p.paidDate]);
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/payments/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM Payments WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Expenses
app.post('/api/expenses', async (req, res) => {
  try {
    const db = await dbPromise;
    const e = req.body;
    await db.run(`
      INSERT INTO Expenses (id, date, category, description, amount, excludedFromReports) 
      VALUES (?, ?, ?, ?, ?, ?)
    `, [e.id, e.date, e.category, e.description, e.amount, e.excludedFromReports ? 1 : 0]);
    res.json(e);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/expenses/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const e = req.body;
    await db.run(`
      UPDATE Expenses SET date = ?, category = ?, description = ?, amount = ?, excludedFromReports = ? 
      WHERE id = ?
    `, [e.date, e.category, e.description, e.amount, e.excludedFromReports ? 1 : 0, req.params.id]);
    res.json(e);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/expenses/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM Expenses WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Operations (Projects & Complaints)
app.get('/api/operations', async (req, res) => {
  try {
    const db = await dbPromise;
    const rows = await db.all('SELECT * FROM Operations');
    const projects = rows.filter(r => r.type === 'project').map(r => JSON.parse(r.data));
    const complaints = rows.filter(r => r.type === 'complaint').map(r => JSON.parse(r.data));
    res.json({ projects, complaints });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/operations/:type', async (req, res) => {
  try {
    const db = await dbPromise;
    const data = req.body;
    await db.run('INSERT INTO Operations (id, type, data) VALUES (?, ?, ?)', [data.id, req.params.type, JSON.stringify(data)]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/operations/:type/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    const data = req.body;
    await db.run('UPDATE Operations SET data = ? WHERE id = ? AND type = ?', [JSON.stringify(data), req.params.id, req.params.type]);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/operations/:type/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM Operations WHERE id = ? AND type = ?', [req.params.id, req.params.type]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assets
app.get('/api/assets', async (req, res) => {
  try {
    const db = await dbPromise;
    const rows = await db.all('SELECT * FROM Assets');
    res.json(rows.map(r => JSON.parse(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assets', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('INSERT INTO Assets (id, data) VALUES (?, ?)', [req.body.id, JSON.stringify(req.body)]);
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/assets/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('UPDATE Assets SET data = ? WHERE id = ?', [JSON.stringify(req.body), req.params.id]);
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/assets/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM Assets WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Asset Payments
app.post('/api/asset-payments', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('INSERT INTO AssetPayments (id, data) VALUES (?, ?)', [req.body.id, JSON.stringify(req.body)]);
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/asset-payments/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM AssetPayments WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Profile Requests
app.get('/api/profile-requests', async (req, res) => {
  try {
    const db = await dbPromise;
    const rows = await db.all('SELECT * FROM ProfileRequests');
    res.json(rows.map(r => JSON.parse(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/profile-requests', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('INSERT INTO ProfileRequests (id, data) VALUES (?, ?)', [req.body.id, JSON.stringify(req.body)]);
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile-requests/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('UPDATE ProfileRequests SET data = ? WHERE id = ?', [JSON.stringify(req.body), req.params.id]);
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/profile-requests/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM ProfileRequests WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reminders
app.get('/api/reminders', async (req, res) => {
  try {
    const db = await dbPromise;
    const rows = await db.all('SELECT * FROM Reminders');
    res.json(rows.map(r => JSON.parse(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reminders', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('INSERT INTO Reminders (id, data) VALUES (?, ?)', [req.body.id, JSON.stringify(req.body)]);
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Documents
app.get('/api/documents', async (req, res) => {
  try {
    const db = await dbPromise;
    const rows = await db.all('SELECT * FROM Documents');
    res.json(rows.map(r => JSON.parse(r.data)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/documents', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('INSERT INTO Documents (id, data) VALUES (?, ?)', [req.body.id, JSON.stringify(req.body)]);
    res.json(req.body);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM Documents WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Réinitialisation complète de la base de données
app.delete('/api/reset', async (req, res) => {
  try {
    const db = await dbPromise;
    await db.run('DELETE FROM BuildingInfo');
    await db.run('DELETE FROM Apartments');
    await db.run('DELETE FROM Payments');
    await db.run('DELETE FROM Expenses');
    await db.run('DELETE FROM Operations');
    await db.run('DELETE FROM Assets');
    await db.run('DELETE FROM AssetPayments');
    await db.run('DELETE FROM ProfileRequests');
    await db.run('DELETE FROM Reminders');
    await db.run('DELETE FROM Documents');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tous les autres appels (non API) renvoient l'application React
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*path', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Serveur démarré sur le port ${PORT}`));
