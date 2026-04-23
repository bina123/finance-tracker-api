const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { registerSchema, loginSchema } = require('./auth.validator');
const authenticate = require('../../middleware/auth.middleware');

// Validation middleware
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(422).json({
            error: error.details[0].message
        });
    }
    next();
};

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authenticate, authController.getMe);

module.exports = router;