// Middleware pour vérifier si l'utilisateur est authentifié
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        res.status(401).redirect('/auth/login');
    }
};

module.exports = { isAuthenticated };
