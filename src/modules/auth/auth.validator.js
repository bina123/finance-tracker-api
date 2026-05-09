const { join } = require('@prisma/client/runtime/client');
const Joi = require('joi');

const registerSchema = Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const refreshSchema = Joi.object({
    refreshToken: Joi.string().required()
})

const logoutSchema = Joi.object({
    refreshToken: Joi.string().required()
})

module.exports = { registerSchema, loginSchema, refreshSchema, logoutSchema };