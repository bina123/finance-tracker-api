const express = require('express');
const router = express.Router();
const transactionController = require('./transaction.controller');
const authenticate = require('../../middleware/auth.middleware');
const {
    createTransactionSchema,
    updateTransactionSchema,
    listTransactionSchema
} = require('./transaction.validator');

const validate = (schema, source = 'body') => (req, res, next) => {
    const { error, value } = schema.validate(
        source === 'query' ? req.query : req.body
    );
    if (error) {
        return res.status(422).json({
            error: error.details[0].message
        });
    }
    if (source === 'query') req.query = value;
    next();
};

router.use(authenticate);

router.post(
    '/',
    validate(createTransactionSchema),
    transactionController.create
);
router.get(
    '/',
    validate(listTransactionSchema, 'query'),
    transactionController.getAll
);
router.get('/balance', transactionController.getBalance);
router.get('/verify-ledger', transactionController.verifyLedger);
router.get('/:id', transactionController.getById);
router.put(
    '/:id',
    validate(updateTransactionSchema),
    transactionController.update
);
router.delete('/:id', transactionController.remove);

module.exports = router;