const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

const app = express();

// ── CORE MIDDLEWARE ────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static: uploaded provider documents
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API ROUTES ─────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/providers',     require('./routes/providers'));
app.use('/api/jobs',          require('./routes/jobs'));
app.use('/api/ratings',       require('./routes/ratings'));
app.use('/api/categories',    require('./routes/categories'));
app.use('/api/locations',     require('./routes/locations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin',         require('./routes/admin'));

// ── HEALTH CHECK ───────────────────────────────────────────────
app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', time: new Date(), version: '1.0.0' })
);

// ── 404 ────────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` })
);

// ── GLOBAL ERROR HANDLER ───────────────────────────────────────
app.use(require('./middleware/errorHandler'));

// ── START ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`🚀  Server  →  http://localhost:${PORT}`);
  console.log(`📦  Mode    →  ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡  API     →  http://localhost:${PORT}/api`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});
