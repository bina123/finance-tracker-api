const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' }
});
app.use('/api', limiter);

// Routes
const authRoutes = require('../modules/auth/auth.routes');
app.use('/api/v1/auth', authRoutes);

const categoryRoutes = require('../modules/categories/category.routes');
app.use('/api/v1/categories', categoryRoutes);

const transactionRoutes = require('../modules/transactions/transaction.routes');
app.use('/api/v1/transactions', transactionRoutes);

const budgetRoutes = require('../modules/budgets/budget.routes');
app.use('/api/v1/budgets', budgetRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
});

module.exports = app;