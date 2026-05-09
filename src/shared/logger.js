const pino = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    base: {
        service: 'finance-tracker-api',
        env: process.env.NODE_ENV || 'development',
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.currentPassword',
            'req.body.newPassword',
            'req.body.refreshToken',
            'res.headers["set-cookie"]',
            '*.password',
            '*.token',
        ],
        censor: '[REDACTED]',
    },
});

module.exports = logger;