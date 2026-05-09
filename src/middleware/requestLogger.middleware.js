const pinoHttp = require('pino-http');
const { randomUUID } = require('crypto');
const logger = require('../shared/logger');
const { getRequestId } = require("../shared/requestContext");

const requestLogger = pinoHttp({
    logger,

    // Generate or reuse a request ID
    genReqId: (req, res) => {
        const existing = req.headers['x-request-id'];
        const id = existing || randomUUID();
        res.setHeader('X-Request-Id',id);
        return id;
    },

    // Customize log levels per status code
    customLogLevel : (req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        if (res.statusCode >= 300) return 'silent'; // skip 3xx redirects
        return 'info';
    },

    // Customize success message
    customSuccessMessage : (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`;
    },

    // Customize error message
    customErrorMessage : (req, res, err) => {
        return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
    },

    customProps: (req, res) => {
        if (req.user) {
            return {userId: req.user.userId || req.user.sub || req.user.id }
        }
        return {};
    },

    // Skip noisy paths (health checks)
    autoLogging : {
        ignore: (req) => req.url === '/health',
    },

    // Serializers — control what gets logged from req/res objects
    serializers: {
        req: (req) => ({
           id: req.id,
           method: req.method,
           url: req.url,
           // Don't log full headers — too much noise 
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
});

module.exports = requestLogger;