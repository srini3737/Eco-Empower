const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');
const feedbackRoutes = require('./routes/feedback');
const orderRoutes = require('./routes/orders');

app.use('/api/auth', authRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/orders', orderRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Eco Empower API is running',
        timestamp: new Date().toISOString()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Eco Empower API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            wallet: '/api/wallet',
            admin: '/api/admin',
            feedback: '/api/feedback',
            orders: '/api/orders'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Eco Empower API server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
