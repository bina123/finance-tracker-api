require('dotenv').config();
const app = require('./config/app');
const { execSync } = require('child_process');
const logger = require('./shared/logger');

const PORT = process.env.PORT || 3000;

// Run migrations automatically on startup
try {
    logger.info('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    logger.info('Migrations completed successfully');
} catch (error) {
    logger.error({err: error},'Migration failed');
    process.exit(1);
}

const server = app.listen(PORT, () => {
    logger.info({port: PORT},`Server running on port ${PORT}`);
});

const shutdown = async(signal) => {
    logger.info('{signal}','Shutdown signal received, closing server');
    server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
    });

    setTimeout(() => {
        logger.error('Forced shutdown after 10s timeout');
        process.exit(1);
    },10000);
}

process.on('SIGTERM',() => shutdown('SIGTERM'));
process.on('SIGINT',()=>shutdown('SIGINT'));