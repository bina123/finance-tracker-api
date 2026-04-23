require('dotenv').config();
const app = require('./config/app');
const { execSync } = require('child_process');

const PORT = process.env.PORT || 3000;

// Run migrations automatically on startup
try {
    console.log('Running database migrations...');
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
    console.log('Migrations completed successfully');
} catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});