const jwt = require('jsonwebtoken');

// Middleware pour vérifier les JWT
const verifyJWT = (req, res, next) => {
    let token = null;

    // 1. Essayer d'obtenir le token du cookie
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    // 2. Essayer d'obtenir le token du header Authorization: Bearer <token>
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.slice(7); // Remove "Bearer "
    }

    if (!token) {
        return res.status(401).json({ error: 'Token manquant' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expiré' });
        }
        return res.status(401).json({ error: 'Token invalide' });
    }
};

module.exports = { verifyJWT };
