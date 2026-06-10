const { authenticate } = require('./auth');

const requireAdmin = async (req, res, next) => {
    // First authenticate
    await authenticate(req, res, () => {
        if (!req.user) return;

        if (!req.user.is_admin) {
            return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
        }
        next();
    });
};

module.exports = { requireAdmin };
