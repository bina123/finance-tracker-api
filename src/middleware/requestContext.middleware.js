const { runWithContext } = require('../shared/requestContext');

/**
 * Populates AsyncLocalStorage with request-scoped data.
 * Must run AFTER pino-http middleware (so req.id and req.log exist).
 */
function requestContextMiddleware(req, res, next) {
    const context = {
        requestId: req.id,
        logger: req.log,
        userId: null,  // populated later by auth middleware
    };

    runWithContext(context, () => next());

}

module.exports = requestContextMiddleware;