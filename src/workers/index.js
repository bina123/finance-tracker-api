require('dotenv').config();
const logger = require('../shared/logger');

logger.info({ env: process.env.NODE_ENV}, 'Starting workers..');

// Require all workers — each one binds to its queue on require
require('./notifications.worker');

logger.info('All workers started, waiting for jobs');

const shutdown = async(signal) => {
    logger.info({signal},'Shutdown signal received, closing workers');

    setTimeout(() => {
        logger.info('Worker process exsiting');
        process.exit(0);
    },5000);
};

process.on('SIGTERM',() => shutdown('SIGTERM'));
process.on('SIGINT',() => shutdown('SIGINT'));