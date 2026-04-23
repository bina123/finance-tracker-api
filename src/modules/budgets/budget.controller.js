const budgetService = require('./budget.service');

const create = async (req, res) => {
    try {
        const budget = await budgetService.create(
            req.user.userId,
            req.body
        );
        res.status(201).json({
            message: 'Budget created',
            data: budget
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const { month, year } = req.query;
        const budgets = await budgetService.getAll(
            req.user.userId,
            month,
            year
        );
        res.status(200).json({ data: budgets });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const budget = await budgetService.getById(
            req.user.userId,
            req.params.id
        );
        res.status(200).json({ data: budget });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const budget = await budgetService.update(
            req.user.userId,
            req.params.id,
            req.body
        );
        res.status(200).json({
            message: 'Budget updated',
            data: budget
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const result = await budgetService.remove(
            req.user.userId,
            req.params.id
        );
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getSummary = async (req, res) => {
    try {
        const { month, year } = req.query;

        if (!month || !year) {
            return res.status(422).json({
                error: 'month and year are required'
            });
        }

        const summary = await budgetService.getSummary(
            req.user.userId,
            parseInt(month),
            parseInt(year)
        );
        res.status(200).json({ data: summary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { create, getAll, getById, update, remove, getSummary };