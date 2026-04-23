const request = require('supertest');
const app = require('../config/app');
const prisma = require('../config/prisma');

// Clean up test data after all tests
afterAll(async () => {
    await prisma.auditLog.deleteMany({
        where: { user: { email: { contains: 'testauth' } } }
    });
    await prisma.user.deleteMany({
        where: { email: { contains: 'testauth' } }
    });
    await prisma.$disconnect();
});

describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'testauth1@test.com',
                password: 'password123'
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Registration successful');
        expect(res.body.data.user.email).toBe('testauth1@test.com');
        expect(res.body.data.token).toBeDefined();
        // Password should never be returned
        expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 400 for duplicate email', async () => {
        // Register first time
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'testauth2@test.com',
                password: 'password123'
            });

        // Register again with same email
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'testauth2@test.com',
                password: 'password123'
            });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Email already registered');
    });

    it('should return 422 for invalid email format', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'not-an-email',
                password: 'password123'
            });

        expect(res.status).toBe(422);
    });

    it('should return 422 for password less than 6 characters', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Test User',
                email: 'testauth3@test.com',
                password: '123'
            });

        expect(res.status).toBe(422);
    });

    it('should return 422 for missing required fields', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({});

        expect(res.status).toBe(422);
    });
});

describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
        await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Login Test',
                email: 'testauthlogin@test.com',
                password: 'password123'
            });
    });

    it('should login successfully with correct credentials', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'testauthlogin@test.com',
                password: 'password123'
            });

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Login successful');
        expect(res.body.data.token).toBeDefined();
        expect(res.body.data.user.password).toBeUndefined();
    });

    it('should return 401 for wrong password', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'testauthlogin@test.com',
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid email or password');
    });

    it('should return 401 for non-existent email', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                email: 'nobody@test.com',
                password: 'password123'
            });

        expect(res.status).toBe(401);
    });
});

describe('GET /api/v1/auth/me', () => {
    let token;

    beforeAll(async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                name: 'Me Test',
                email: 'testauthme@test.com',
                password: 'password123'
            });
        token = res.body.data.token;
    });

    it('should return current user with valid token', async () => {
        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.data.email).toBe('testauthme@test.com');
        expect(res.body.data.password).toBeUndefined();
    });

    it('should return 401 without token', async () => {
        const res = await request(app).get('/api/v1/auth/me');
        expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', 'Bearer invalidtoken123');

        expect(res.status).toBe(401);
    });
});