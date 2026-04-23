const Joi = require('joi');

const createCategorySchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    type: Joi.string().valid('INCOME', 'EXPENSE').required()
});

const updateCategorySchema = Joi.object({
    name: Joi.string().min(2).max(50).required()
});

module.exports = { createCategorySchema, updateCategorySchema };