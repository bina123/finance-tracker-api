const { createBullBoard } = require('@bull-board/api');
const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
const { ExpressAdapter } = require('@bull-board/express');
const { notificationsQueue } = require('../queues');

/**
 * Bull Board — admin UI for inspecting BullMQ queues.
 *
 * Mounted at /admin/queues. In production you'd protect this behind
 * an admin auth check; for this demo it's open.
 *
 * To add more queues to the dashboard, just push more BullMQAdapter()
 * instances into the queues array below.
 */

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
    queues: [
        new BullMQAdapter(notificationsQueue)
    ],
    serverAdapter,
})

module.exports = serverAdapter;