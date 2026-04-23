const request = require('supertest');
const app = require('../config/app');

describe('Health Check', () => {
    it('GET /health should return 200', async () => {
        const res = await request(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
});

describe('Auth Validation', () => {
    it('POST /api/v1/auth/register should return 422 for missing fields', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({});
        expect(res.status).toBe(422);
    });

    it('POST /api/v1/auth/login should return 422 for missing fields', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({});
        expect(res.status).toBe(422);
    });

    it('GET /api/v1/auth/me should return 401 without token', async () => {
        const res = await request(app)
            .get('/api/v1/auth/me');
        expect(res.status).toBe(401);
    });
});