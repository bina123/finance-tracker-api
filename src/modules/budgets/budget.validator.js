const Joi = require('joi');

const createBudgetSchema = Joi.object({
    categoryId: Joi.string().uuid().required(),
    amount: Joi.number().positive().precision(2).required(),
    month: Joi.number().integer().min(1).max(12).required(),
    year: Joi.number().integer().min(2020).max(2100).required()
});

const updateBudgetSchema = Joi.object({
    amount: Joi.number().positive().precision(2).required()
});

module.exports = { createBudgetSchema, updateBudgetSchema };