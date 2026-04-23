const express = require('express');
const router = express.Router();
const categoryController = require('./category.controller');
const authenticate = require('../../middleware/auth.middleware');
const {
    createCategorySchema,
    updateCategorySchema
} = require('./category.validator');

const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(422).json({
            error: error.details[0].message
        });
    }
    next();
};

// All routes require authentication
router.use(authenticate);

router.post('/', validate(createCategorySchema), categoryController.create);
router.get('/', categoryController.getAll);
router.get('/:id', categoryController.getById);
router.put('/:id', validate(updateCategorySchema), categoryController.update);
router.delete('/:id', categoryController.remove);

module.exports = router;