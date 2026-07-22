const express = require('express');
const { verifyJWT } = require('../middlewares/checkJWT');
const path = require('path');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');

const router = express.Router();

// GET /bat-computer (protégée)
router.get('/bat-computer', verifyJWT, (req, res) => {
    res.sendFile(path.join(__dirname, '../views/bat-computer.html'));
});

// GET /api/user-info (protégée)
router.get('/api/user-info', verifyJWT, (req, res) => {
    res.json({
        id: req.user.id,
        email: req.user.email,
        username: req.user.username
    });
});

// POST /api/auth/refresh - Rafraîchir le token d'accès
router.post('/api/auth/refresh', (req, res) => {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ error: 'RefreshToken manquant' });
    }

    try {
        // Vérifier que le refreshToken existe et n'est pas expiré
        const storedToken = db.prepare(`
            SELECT rt.*, u.email, u.username 
            FROM refresh_tokens rt
            JOIN users u ON rt.user_id = u.id
            WHERE rt.token = ?
        `).get(refreshToken);

        if (!storedToken) {
            return res.status(401).json({ error: 'RefreshToken invalide ou supprimé' });
        }

        // Vérifier l'expiration
        if (storedToken.expires_at < Math.floor(Date.now() / 1000)) {
            db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
            return res.status(401).json({ error: 'RefreshToken expiré' });
        }

        // Générer un nouveau accessToken
        const newAccessToken = jwt.sign(
            { id: storedToken.user_id, email: storedToken.email, username: storedToken.username },
            process.env.JWT_SECRET,
            { expiresIn: '15s' }
        );

        // Générer un nouveau refreshToken
        const newRefreshToken = crypto.randomBytes(32).toString('hex');
        const newExpiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

        // Supprimer l'ancien refreshToken et insérer le nouveau
        db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(refreshToken);
        db.prepare(`
            INSERT INTO refresh_tokens (user_id, token, expires_at)
            VALUES (?, ?, ?)
        `).run(storedToken.user_id, newRefreshToken, newExpiresAt);

        // Envoyer les nouveaux cookies
        res.cookie('token', newAccessToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 15000,
            secure: false
        });

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
            secure: false
        });

        res.json({ message: 'Token rafraîchi' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur lors du rafraîchissement' });
    }
});

// POST /api/auth/change-password - Changer le mot de passe
router.post('/api/auth/change-password', verifyJWT, async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis' });
    }

    // Regex ANSSI: min 12 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;

    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            error: 'Le nouveau mot de passe doit contenir au moins 12 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial'
        });
    }

    try {
        // Récupérer l'utilisateur
        const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

        if (!user) {
            return res.status(404).json({ error: 'Utilisateur non trouvé' });
        }

        // Vérifier l'ancien mot de passe
        const isValid = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ error: 'Ancien mot de passe incorrect' });
        }

        // Hasher le nouveau mot de passe
        const newHash = await bcrypt.hash(newPassword, 10);

        // Mettre à jour en base
        db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
            .run(newHash, userId);

        res.json({ message: 'Mot de passe modifié avec succès' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

module.exports = router;
