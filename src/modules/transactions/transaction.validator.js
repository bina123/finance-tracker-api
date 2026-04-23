const Joi = require('joi');

const createTransactionSchema = Joi.object({
    categoryId: Joi.string().uuid().required(),
    type: Joi.string().valid('INCOME', 'EXPENSE').required(),
    amount: Joi.number().positive().precision(2).required(),
    currency: Joi.string().length(3).default('INR'),
    description: Joi.string().max(255).optional(),
    date: Joi.date().iso().required(),
    idempotencyKey: Joi.string().max(100).required()
});

const updateTransactionSchema = Joi.object({
    description: Joi.string().max(255).optional(),
    date: Joi.date().iso().optional()
});

const listTransactionSchema = Joi.object({
    type: Joi.string().valid('INCOME', 'EXPENSE').optional(),
    categoryId: Joi.string().uuid().optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

module.exports = {
    createTransactionSchema,
    updateTransactionSchema,
    listTransactionSchema
};