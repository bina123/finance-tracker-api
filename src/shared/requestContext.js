const { AsyncLocalStorage } = require('async_hooks');

/**
 * Per-request context store.
 *
 * Anything we put in this store is accessible from anywhere in the
 * request's call stack — through async/await boundaries, through
 * Promise chains, through Prisma calls, through service layers.
 *
 * Without this, you'd have to pass req.log through every function
 * signature. With this, services pull the logger from context.
 */
const requestContext = new AsyncLocalStorage();

/**
 * Get the current request's logger, or fall back to base logger.
 * Use this anywhere you need to log — services, helpers, jobs.
 */
function getLogger() {
    const store = requestContext.getStore();
    if( store && store.logger){
        return store.logger;
    }
    // Fallback for code running outside a request (startup, jobs, tests)
    return require('./logger');
}

/**
 * Get the current request's ID, if any.
 */
function getRequestId() {
    const store = requestContext.getStore();
    return store ? store.requestId : null
}

/**
 * Run a function within a context store. Used by middleware.
 */
function runWithContext(context, fn) {
    return requestContext.run(context, fn);
}

module.exports = {
    requestContext,
    getLogger,
    getRequestId,
    runWithContext
}
