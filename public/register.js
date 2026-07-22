document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const messageDiv = document.getElementById('message');

    // Validation côté client
    if (!username) {
        messageDiv.innerHTML = '<div class="alert alert-warning">Le nom d\'utilisateur est requis</div>';
        return;
    }

    if (password.length < 8) {
        messageDiv.innerHTML = '<div class="alert alert-warning">Le mot de passe doit contenir au moins 8 caractères</div>';
        return;
    }

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            messageDiv.innerHTML = '<div class="alert alert-success">Inscription réussie! Vous pouvez maintenant vous connecter.</div>';
            document.getElementById('registerForm').reset();
        } else if (response.status === 409) {
            messageDiv.innerHTML = '<div class="alert alert-danger">Ce nom d\'utilisateur est déjà utilisé</div>';
        } else {
            messageDiv.innerHTML = `<div class="alert alert-danger">${data.message}</div>`;
        }
    } catch (err) {
        messageDiv.innerHTML = '<div class="alert alert-danger">Erreur serveur</div>';
        console.error(err);
    }
});
