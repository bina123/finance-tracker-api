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

const refresh = async (req, res) => {
    try {
        const {refreshToken} = req.body;
        const result = await authService.refresh(refreshToken);
        res.status(200).json({
            message: 'Token Refreshed',
            data: result
        })
    }catch (error) {
        res.status(401).json({error: error.message});
    }
};

const logout = async (req, res) => {
    try {
        const {refreshToken} = req.body;
        await authService.logout(refreshToken);

        res.status(200).json({
            message:'Logout successfully'
        })
    }catch(error) {
        res.status(401).json({error: error.message})
    }
}

const logoutAll = async( req, res) => {
    try{
        await authService.logoutAll(req.user.userId);
        res.status(200).json({message: "Logged out from all sessions"});
    }catch (error) {
        res.status(401).json({error: error.message});
    }
}
const getMe = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.userId);
        res.status(200).json({ data: user });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

module.exports = { register, login, refresh, logout, logoutAll, getMe };