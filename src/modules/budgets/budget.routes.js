const express = require('express');
const router = express.Router();
const budgetController = require('./budget.controller');
const authenticate = require('../../middleware/auth.middleware');
const {
    createBudgetSchema,
    updateBudgetSchema
} = require('./budget.validator');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(422).json({
            error: error.details[0].message
        });
    }
    next();
};

router.use(authenticate);

router.post(
    '/',
    validate(createBudgetSchema),
    budgetController.create
);
router.get('/', budgetController.getAll);
router.get('/summary', budgetController.getSummary);
router.get('/:id', budgetController.getById);
router.put(
    '/:id',
    validate(updateBudgetSchema),
    budgetController.update
);
router.delete('/:id', budgetController.remove);

module.exports = router;