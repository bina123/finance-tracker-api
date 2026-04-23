const authService = require('./auth.service');

const register = async (req, res) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json({
            message: 'Registration successful',
            data: result
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const login = async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.status(200).json({
            message: 'Login successful',
            data: result
        });
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
};

const getMe = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.userId);
        res.status(200).json({ data: user });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

module.exports = { register, login, getMe };