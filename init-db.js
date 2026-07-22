const bcrypt = require('bcrypt');
const db = require('./config/db');

async function initializeDatabase() {
    try {
        // Vérifier si l'utilisateur test existe déjà
        const existing = db.prepare('SELECT * FROM users WHERE email = ?').get('batman@batcave.com');
        
        if (existing) {
            console.log('✓ Utilisateur test déjà existant');
            return;
        }

        // Créer l'utilisateur test
        const password = 'password123';
        const hash = await bcrypt.hash(password, 10);
        
        db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)')
            .run('batman', 'batman@batcave.com', hash);
        
        console.log('✓ Utilisateur test créé');
        console.log('📧 Email: batman@batcave.com');
        console.log('🔑 Mot de passe: password123');
    } catch (err) {
        console.error('Erreur lors de l\'initialisation:', err.message);
    }
}

initializeDatabase().then(() => process.exit(0));
