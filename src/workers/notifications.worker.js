const { Worker } = require('bullmq');
const connection = require('../queues/connection');
const logger = require('../shared/logger');
const { NOTIFICATIONS_QUEUE } = require('../queues/notifications.queue');

/**
 * Notifications worker — consumes jobs from the notifications queue.
 *
 * In production this would call an email service (SES, SendGrid, Mailgun)
 * or a push notification service (FCM, APNs). For this demo we just log,
 * which is enough to demonstrate the pattern end-to-end.
 *
 * Concurrency: 5 means up to 5 jobs are processed in parallel by this
 * worker. If you start 3 worker processes, that's 15 parallel jobs total.
 */

const processer = async(job) => {
    const {name, data, attemptsMade } = job;

    logger.info({
        jobId: job.id,
        jobName: name,
        attempts: job.attemptsMade + 1,
        data,
    },
    `Processing job ${name}`
    );

    switch(name) {
        case 'transaction-created':
            await handleTransactionCreated(data);
            break;
        default:
            logger.warn({jobName: name},'unknown job type, skipping');
    }

    logger.info({jobId: job.id},`Completed job ${name}`);
};

/**
 * Simulate sending a transaction-created email.
 * In production: call email service.
 */
const handleTransactionCreated = async(data) => {
    const {userId, transcationId, type, amount, currency} = data;

    await new Promise((resolve) => setTimeout(resolve, 500));

    logger.info({
        userId,
        transcationId,
        type,
        amount,
        currency
    },`[Notification] ${type} of ${amount} ${currency} recorderd`);
};

const worker = new Worker(NOTIFICATIONS_QUEUE,processer, {
    connection,
    concurrency: 5,
});

worker.on('completed',(job) => {
    logger.debug({jobId:job.id},'Job Completed');
})

worker.on('failed',(job, err) => {
    logger.error(
        {
            jobId: job?.id,
            attemptsMade: job?.attemptsMade,
            err: err.message
        },
        'Job failed'
    );
});

worker.on('error',(err) => {
    logger.error({err: err.message},'Worked error');
});

module.exports = worker;