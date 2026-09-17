const express = require('express');
const cors = require('cors');
const connectDB = require('../_server/config/db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// i18n
const { i18next, middleware } = require('../_server/i18n');
app.use(middleware.handle(i18next));

// Connect to database before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('DB connection error:', error);
    res.status(500).json({ message: 'Error de conexión a la base de datos' });
  }
});

// Routes
app.use('/api/auth', require('../_server/routes/auth.routes'));
app.use('/api/tickets', require('../_server/routes/ticket.routes'));
app.use('/api/users', require('../_server/routes/user.routes'));
app.use('/api/notifications', require('../_server/routes/notification.routes'));
app.use('/api/templates', require('../_server/routes/template.routes'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Tickeger API running on Vercel' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// Export as Vercel serverless function
module.exports = app;
