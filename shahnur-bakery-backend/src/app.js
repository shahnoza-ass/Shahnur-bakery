require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
if (process.env.TRUST_PROXY_HOPS) {
  const hops = Number(process.env.TRUST_PROXY_HOPS);
  if (!Number.isSafeInteger(hops) || hops < 1 || hops > 10) throw new Error('TRUST_PROXY_HOPS must be an integer from 1 to 10');
  app.set('trust proxy', hops);
}

// Security middleware
app.use(helmet({ contentSecurityPolicy: { directives: {
  imgSrc: ["'self'", 'https:', 'data:', 'blob:'],
  connectSrc: ["'self'", 'wss:'],
  workerSrc: ["'self'"],
} } }));
app.use(cors({
  origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(value => value.trim()),
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Normalize list queries before controllers build database queries.
app.use('/api', (req, res, next) => {
  for (const key of ['page', 'limit']) {
    if (req.query[key] !== undefined) {
      const value = Number(req.query[key]);
      if (!Number.isSafeInteger(value) || value < 1 || (key === 'limit' && value > 100)) return res.status(400).json({ success: false, message: 'Sahifalash parametri noto?g‘ri' });
      req.query[key] = String(value);
    }
  }
  if (req.query.search !== undefined) {
    if (typeof req.query.search !== 'string' || req.query.search.length > 100) return res.status(400).json({ success: false, message: 'Qidiruv matni juda uzun' });
    req.query.search = req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  next();
});
// Routes
app.use('/api/auth', require('./routes/passwordRoutes'));
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/commerce', require('./routes/commerceRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// Health check
app.get('/ready', (req, res) => {
  const ready = require('mongoose').connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ success: ready });
});
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// A single production origin serves the shop, API and Socket.IO.
if (process.env.NODE_ENV === 'production') {
  const path = require('node:path');
  const fs = require('node:fs');
  const directory = path.resolve(__dirname, '../../shahnur-bakery-frontend/dist');
  if (!fs.existsSync(path.join(directory, 'index.html'))) throw new Error('Frontend build missing. Run npm run build before starting production.');
  const noCache = (_req, res, next) => { res.setHeader('Cache-Control', 'no-cache'); next(); };
  app.get(['/sw.js', '/manifest.webmanifest'], noCache);
  app.use(express.static(directory, { index: false, setHeaders: (res, file) => {
    if (file.includes(path.sep + 'assets' + path.sep)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    else res.setHeader('Cache-Control', 'no-cache');
  } }));
  app.get('*', (req, res, next) => {
    if (/^\/(api|socket\.io|health|ready)(\/|$)/.test(req.path) || path.extname(req.path) || !req.accepts('html')) return next();
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(directory, 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

module.exports = app;
