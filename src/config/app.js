const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestLogger = require('../middleware/requestLogger.middleware');
const requestContext = require('../middleware/requestContext.middleware');
const prisma = require('./prisma')
const bullBoardAdapter = require('../admin/bullBoard');   // ← ADD

const app = express();

app.use(requestLogger);
app.use(requestContext);

app.use(helmet({
    contentSecurityPolicy: false,   
}));
app.use(cors());
app.use(express.json());

// Bull Board admin UI — mount BEFORE rate limiter so dashboard isn't throttled
app.use('/admin/queues', bullBoardAdapter.getRouter());

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

app.get('/ready', async(req, res) =>{
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({status:'ready', timestamp: new Date()});
    }catch (error){
        res.status(503).json({status: 'not_ready', error: error.message});
    }
})

module.exports = app;