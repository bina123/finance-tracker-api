const { Queue } = require('bullmq');
const connection = require('./connection'); 

/**
 * Notifications queue — for sending emails, push notifications, SMS.
 *
 * Producer: API calls notificationsQueue.add(jobName, data) when a
 *           user-facing event happens (transaction created, budget exceeded).
 * Consumer: A worker process (separate from API) pulls jobs and executes them.
 *
 * Why a queue instead of inline?
 *   - Email API can be slow (200ms-2s) and shouldn't block the HTTP response
 *   - Email API can be down — we want retry, not a 500 to the user
 *   - We want visibility into delivery (retries, dead-letter, dashboard)
 */

const NOTIFICATIONS_QUEUE = 'notifications';

const notificationsQueue = new Queue(NOTIFICATIONS_QUEUE,{
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: {
            age: 3600,
            count: 1000,
        },
        removeOnFail: {
            age: 24*3600,
        },
    },
});

module.exports = {
    notificationsQueue,
    NOTIFICATIONS_QUEUE,
}