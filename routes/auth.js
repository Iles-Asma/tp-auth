const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/db');
const path = require('path');

const router = express.Router();

// Utilitaires
const generateRefreshToken = () => crypto.randomBytes(32).toString('hex');

const generateAccessToken = (userId, email, username) => {
    return jwt.sign(
        { id: userId, email, username },
        process.env.JWT_SECRET,
        { expiresIn: '15s' } // 15 secondes pour les tests
    );
};

// GET /auth/login - Afficher le formulaire de connexion
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// POST /auth/login - Traiter la connexion avec JWT
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        // Récupérer l'utilisateur
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Email ou mot de passe invalide' });
        }

        // Générer les jetons
        const accessToken = generateAccessToken(user.id, user.email, user.username);
        const refreshToken = generateRefreshToken();
        const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 jours

        // Stocker le refreshToken en base
        db.prepare(`
            INSERT INTO refresh_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `).run(user.id, refreshToken, expiresAt);

        // Envoyer les cookies
        res.cookie('token', accessToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 15000, // 15 secondes
            secure: false
        });

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
            secure: false
        });

        res.json({ message: 'Connexion réussie', user: { email: user.email, username: user.username } });
    } catch (err) {
        console.error('ERREUR POST /login:', err.message, err.stack);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /auth/logout - Déconnexion complète
router.get('/logout', (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    try {
        // Supprimer le refreshToken de la base de données
        if (refreshToken) {
            db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
        }

        // Effacer les cookies
        res.clearCookie('token');
        res.clearCookie('refreshToken');

        // Rediriger vers la connexion
        res.redirect('/auth/login');
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors de la déconnexion' });
    }
});

module.exports = router;


