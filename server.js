require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./config/db');
const authRouter = require('./routes/auth');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

// Routes d'authentification
app.use('/auth', authRouter);

// Routes API
app.use('/', apiRouter);

// Redirection par défaut
app.get('/', (req, res) => {
    // Vérifier si le token existe dans les cookies
    if (req.cookies.token) {
        res.redirect('/bat-computer');
    } else {
        res.redirect('/auth/login');
    }
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`🦇 Serveur Batcave lancé sur http://localhost:${PORT}`);
});


