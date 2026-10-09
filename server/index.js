require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const supabase = require('./lib/supabase');

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)
  .map(origin => new URL(origin).origin);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    let normalizedOrigin;
    try {
      normalizedOrigin = new URL(origin).origin;
    } catch (error) {
      return callback(new Error('Origin is not allowed by CORS'));
    }
    if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  }
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/fixed-costs', require('./routes/fixedCosts'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/food-analysis', require('./routes/foodAnalysis'));
app.use('/api/checklists', require('./routes/checklists'));
app.use('/api/users', require('./routes/users'));

// Health Check
app.get('/api/health', (req, res) => {
  supabase.from('mc_users').select('id', { head: true, count: 'exact' })
    .then(({ error }) => {
      if (error) return res.status(503).json({ status: 'unavailable', error: error.message });
      res.json({ status: 'ok' });
    })
    .catch(error => res.status(503).json({ status: 'unavailable', error: error.message }));
});

app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError ||
      (typeof error.message === 'string' &&
        (error.message.startsWith('Receipts must') || error.message.startsWith('Menu images must')))) {
    return res.status(400).json({ error: error.message });
  }
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON request body' });
  }
  if (error.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ error: error.message });
  }
  console.error(error);
  res.status(500).json({ error: error.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
