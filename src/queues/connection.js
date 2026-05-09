const IORedis = require('ioredis');

/**
 * Shared Redis connection for all BullMQ queues and workers.
 *
 * BullMQ requires `maxRetriesPerRequest: null` for blocking commands
 * (the worker's BLPOP-style polling). Without it, BullMQ throws warnings
 * and connections behave unexpectedly.
 */
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379',{
    maxRetriesPerRequest: null,
})

connection.on('error',(err) => {
    require('../shared/logger').error({err: err.message},'Redis connection error');
});

connection.on('connect', () => {
    require('../shared/logger').info('Redis connected to BullMq');
});

module.exports = connection;