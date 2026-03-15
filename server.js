import express from 'express';
import cors from 'cors';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

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

    CREATE TABLE IF NOT EXISTS OtpCodes (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      code TEXT NOT NULL,
      expiresAt INTEGER NOT NULL,
      used INTEGER DEFAULT 0
    );
  `);

  // Ajouter la colonne password si elle n'existe pas encore
  try { await db.run('ALTER TABLE Apartments ADD COLUMN password TEXT'); } catch {}

  console.log("Base de données SQLite initialisée.");
}

// --- HELPERS ---

function normalizePhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

function formatPhoneForWhatsApp(phone) {
  const clean = normalizePhone(phone);
  if (clean.startsWith('0')) return '212' + clean.substring(1);
  if (!clean.startsWith('212')) return '212' + clean;
  return clean;
}

async function findApartmentByPhone(db, phone) {
  const input = normalizePhone(phone);
  const apartments = await db.all('SELECT * FROM Apartments');
  return apartments.find(a => {
    const aptPhone = normalizePhone(a.phone);
    return aptPhone && (aptPhone === input || aptPhone.endsWith(input) || input.endsWith(aptPhone));
  });
}

async function sendWhatsAppOtp(phone, code, buildingInfo) {
  const { whatsappApiKey, whatsappSenderNumber, name } = buildingInfo || {};
  if (!whatsappApiKey || !whatsappSenderNumber) return false;
  const to = formatPhoneForWhatsApp(phone);
  const body = `🏢 *${name || 'SyndicPro'}*\n\nVotre code de vérification : *${code}*\n\n⏱ Valide 10 minutes. Ne le partagez pas.`;
  try {
    const resp = await fetch(`https://api.ultramsg.com/${whatsappSenderNumber}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token: whatsappApiKey, to, body })
    });
    const result = await resp.json();
    return result.sent === 'true' || result.status === 'success' || !!result.id;
  } catch (err) {
    console.error('WhatsApp OTP error:', err.message);
    return false;
  }
}

setupDb().catch(console.error);

// --- AUTH ROUTES ---

// Étape 1 : envoyer OTP WhatsApp
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Numéro requis' });
    const db = await dbPromise;
    const apt = await findApartmentByPhone(db, phone);
    if (!apt) return res.status(404).json({ error: 'Numéro non trouvé dans la résidence' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const normalized = normalizePhone(phone);
    await db.run('UPDATE OtpCodes SET used = 1 WHERE phone = ?', normalized);
    await db.run(
      'INSERT INTO OtpCodes (id, phone, code, expiresAt, used) VALUES (?, ?, ?, ?, 0)',
      [crypto.randomUUID(), normalized, code, Date.now() + 10 * 60 * 1000]
    );

    const buildingRow = await db.get('SELECT data FROM BuildingInfo WHERE id = 1');
    const buildingInfo = buildingRow ? JSON.parse(buildingRow.data) : {};
    const sent = await sendWhatsAppOtp(phone, code, buildingInfo);

    if (!sent) {
      // En dev, retourner le code directement si WhatsApp non configuré
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ success: true, hasPassword: !!apt.password, dev_code: code });
      }
      return res.status(500).json({ error: 'Échec envoi WhatsApp. Vérifiez la configuration syndic (clé API + numéro expéditeur).' });
    }

    res.json({ success: true, hasPassword: !!apt.password });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Étape 2 : vérifier OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, code } = req.body;
    const db = await dbPromise;
    const normalized = normalizePhone(phone);
    const otp = await db.get(
      'SELECT * FROM OtpCodes WHERE phone = ? AND code = ? AND used = 0 ORDER BY expiresAt DESC LIMIT 1',
      [normalized, code]
    );
    if (!otp) return res.status(400).json({ error: 'Code incorrect' });
    if (Date.now() > otp.expiresAt) return res.status(400).json({ error: 'Code expiré. Demandez un nouveau code.' });

    await db.run('UPDATE OtpCodes SET used = 1 WHERE id = ?', otp.id);
    const apt = await findApartmentByPhone(db, phone);
    res.json({ success: true, isFirstLogin: !apt.password, apartmentId: apt.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Étape 3a : créer / réinitialiser mot de passe (après OTP vérifié)
app.post('/api/auth/set-password', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!password || password.length < 6) return res.status(400).json({ error: 'Mot de passe trop court (min 6 caractères)' });
    const db = await dbPromise;
    const apt = await findApartmentByPhone(db, phone);
    if (!apt) return res.status(404).json({ error: 'Appartement non trouvé' });
    const hashed = await bcrypt.hash(password, 10);
    await db.run('UPDATE Apartments SET password = ? WHERE id = ?', [hashed, apt.id]);
    res.json({ success: true, user: { id: apt.id, username: apt.owner, role: 'owner', apartmentId: apt.id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Étape 3b : connexion avec mot de passe (utilisateurs existants)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    const db = await dbPromise;
    const apt = await findApartmentByPhone(db, phone);
    if (!apt || !apt.password) return res.status(401).json({ error: 'Compte non configuré. Utilisez le code WhatsApp.' });
    const match = await bcrypt.compare(password, apt.password);
    if (!match) return res.status(401).json({ error: 'Mot de passe incorrect' });
    res.json({ success: true, user: { id: apt.id, username: apt.owner, role: 'owner', apartmentId: apt.id } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
