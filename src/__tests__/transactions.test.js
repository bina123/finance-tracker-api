const request = require('supertest');
const app = require('../config/app');
const prisma = require('../config/prisma');

let token;
let userId;
let categoryId;

beforeAll(async () => {
    // Register test user
    const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
            name: 'Transaction Test User',
            email: 'testtransaction@test.com',
            password: 'password123'
        });

    token = res.body.data.token;
    userId = res.body.data.user.id;

    // Create test category
    const catRes = await request(app)
        .post('/api/v1/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Income', type: 'INCOME' });

    categoryId = catRes.body.data.id;
});

afterAll(async () => {
    await prisma.auditLog.deleteMany({
        where: { userId }
    });
    await prisma.ledgerEntry.deleteMany({
        where: { transaction: { userId } }
    });
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.category.deleteMany({
        where: { name: 'Test Income' }
    });
    await prisma.user.deleteMany({
        where: { email: 'testtransaction@test.com' }
    });
    await prisma.$disconnect();
});

describe('POST /api/v1/transactions', () => {
    it('should create transaction with ledger entries', async () => {
        const res = await request(app)
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryId,
                type: 'INCOME',
                amount: 10000,
                currency: 'INR',
                description: 'Test income',
                date: '2026-04-01',
                idempotencyKey: `test-income-${Date.now()}`
            });

        expect(res.status).toBe(201);
        expect(res.body.isDuplicate).toBe(false);
        expect(res.body.transaction.amount).toBe('10000');
        expect(res.body.transaction.type).toBe('INCOME');
    });

    it('should return existing transaction for duplicate idempotency key', async () => {
        const idempotencyKey = `duplicate-test-${Date.now()}`;

        // First request
        await request(app)
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryId,
                type: 'INCOME',
                amount: 5000,
                currency: 'INR',
                date: '2026-04-02',
                idempotencyKey
            });

        // Second request — same key
        const res = await request(app)
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryId,
                type: 'INCOME',
                amount: 5000,
                currency: 'INR',
                date: '2026-04-02',
                idempotencyKey
            });

        expect(res.status).toBe(200);
        expect(res.body.isDuplicate).toBe(true);
        expect(res.body.message).toContain('Duplicate');
    });

    it('should return 422 for negative amount', async () => {
        const res = await request(app)
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryId,
                type: 'INCOME',
                amount: -1000,
                date: '2026-04-01',
                idempotencyKey: `negative-${Date.now()}`
            });

        expect(res.status).toBe(422);
    });

    it('should return 400 for category type mismatch', async () => {
        const res = await request(app)
            .post('/api/v1/transactions')
            .set('Authorization', `Bearer ${token}`)
            .send({
                categoryId,
                type: 'EXPENSE', // Category is INCOME
                amount: 1000,
                date: '2026-04-01',
                idempotencyKey: `mismatch-${Date.now()}`
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('mismatch');
    });

    it('should return 401 without token', async () => {
        const res = await request(app)
            .post('/api/v1/transactions')
            .send({
                categoryId,
                type: 'INCOME',
                amount: 1000,
                date: '2026-04-01',
                idempotencyKey: `noauth-${Date.now()}`
            });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/transactions/verify-ledger', () => {
    it('should return balanced ledger', async () => {
        const res = await request(app)
            .get('/api/v1/transactions/verify-ledger')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.isBalanced).toBe(true);
        expect(res.body.data.difference).toBe(0);
        expect(res.body.data.totalDebits).toBe(
            res.body.data.totalCredits
        );
    });
});

describe('GET /api/v1/transactions/balance', () => {
    it('should return correct balance', async () => {
        const res = await request(app)
            .get('/api/v1/transactions/balance')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data).toHaveProperty('totalIncome');
        expect(res.body.data).toHaveProperty('totalExpense');
        expect(res.body.data).toHaveProperty('balance');
        expect(res.body.data.balance).toBe(
            res.body.data.totalIncome - res.body.data.totalExpense
        );
    });
});