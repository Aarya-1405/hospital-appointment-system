// Entry point of the backend: run with "npm run dev" inside the server folder.
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { metricsMiddleware, metricsHandler } = require('./middleware/metrics');

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is missing. Add it to server/.env (see .env.example).');
  process.exit(1);
}

const app = express();
app.use(cors());          // lets the React app (port 5173) call this API (port 5000)
app.use(express.json());  // lets us read JSON sent in request bodies

// ── Prometheus metrics ───────────────────────────────────────────────────────
app.use(metricsMiddleware);          // record http_requests_total & latency histogram
app.get('/metrics', metricsHandler); // Prometheus scrape endpoint

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/doctors', require('./routes/doctorRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api', require('./routes/miscRoutes'));

app.use('/api', (req, res) => res.status(404).json({ message: 'API route not found' }));

// One place that turns any error into a clear JSON message
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join(', ') });
  }
  if (err.code === 11000) return res.status(409).json({ message: 'That email is already registered' });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id supplied' });
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong on the server' });
});

const PORT = process.env.PORT || 5000;
connectDB().then(() => app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`)));
