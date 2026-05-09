const jwt = require('jsonwebtoken');
const { requestContext } = require('../shared/requestContext');

const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            error: 'Access denied. No token provided.'
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Populate AsyncLocalStorage with userId so all subsequent
        // service-layer logs automatically include who triggered the request
        const store = requestContext.getStore();
        if(store){
            store.userId = decoded.userId || decoded.sub || decoded.id;
        }
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

module.exports = authenticate;