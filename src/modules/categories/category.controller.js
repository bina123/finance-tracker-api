const categoryService = require('./category.service');

const create = async (req, res) => {
    try {
        const category = await categoryService.create(req.body);
        res.status(201).json({
            message: 'Category created',
            data: category
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const categories = await categoryService.getAll();
        res.status(200).json({ data: categories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const category = await categoryService.getById(req.params.id);
        res.status(200).json({ data: category });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const category = await categoryService.update(
            req.params.id,
            req.body
        );
        res.status(200).json({
            message: 'Category updated',
            data: category
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const result = await categoryService.remove(req.params.id);
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

module.exports = { create, getAll, getById, update, remove };