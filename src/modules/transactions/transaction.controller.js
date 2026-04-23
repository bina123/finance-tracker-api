const transactionService = require('./transaction.service');

const create = async (req, res) => {
    try {
        const result = await transactionService.create(
            req.user.userId,
            req.body
        );
        const status = result.isDuplicate ? 200 : 201;
        res.status(status).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getAll = async (req, res) => {
    try {
        const result = await transactionService.getAll(
            req.user.userId,
            req.query
        );
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getById = async (req, res) => {
    try {
        const transaction = await transactionService.getById(
            req.user.userId,
            req.params.id
        );
        res.status(200).json({ data: transaction });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

const update = async (req, res) => {
    try {
        const transaction = await transactionService.update(
            req.user.userId,
            req.params.id,
            req.body
        );
        res.status(200).json({
            message: 'Transaction updated',
            data: transaction
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const remove = async (req, res) => {
    try {
        const result = await transactionService.remove(
            req.user.userId,
            req.params.id
        );
        res.status(200).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getBalance = async (req, res) => {
    try {
        const balance = await transactionService.getBalance(
            req.user.userId
        );
        res.status(200).json({ data: balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const verifyLedger = async (req, res) => {
    try {
        const result = await transactionService.verifyLedger(
            req.user.userId
        );
        res.status(200).json({ data: result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    create,
    getAll,
    getById,
    update,
    remove,
    getBalance,
    verifyLedger
};