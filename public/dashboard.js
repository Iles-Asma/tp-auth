/**
 * Wrapper autour de fetch qui gère automatiquement le renouvellement de token
 * en cas d'expiration (réponse 401)
 */
async function fetchWithTokenRefresh(url, options = {}) {
    let response = await fetch(url, options);

    // Si réponse 401 (token expiré), essayer de rafraîchir le token
    if (response.status === 401) {
        try {
            // Appeler l'endpoint de refresh
            const refreshResponse = await fetch('/api/auth/refresh', {
                method: 'POST',
                credentials: 'include' // Envoyer les cookies
            });

            if (refreshResponse.ok) {
                // Token rafraîchi avec succès, réessayer la requête originale
                response = await fetch(url, options);
            } else {
                // Refresh a échoué, rediriger vers la connexion
                window.location.href = '/auth/login';
                return null;
            }
        } catch (err) {
            console.error('Erreur lors du refresh:', err);
            window.location.href = '/auth/login';
            return null;
        }
    }

    return response;
}

// Charger et afficher les informations de l'utilisateur
async function loadUserInfo() {
    try {
        const response = await fetchWithTokenRefresh('/api/user-info', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response) return; // Redirect already happened

        const data = await response.json();

        if (response.ok) {
            document.getElementById('user-email').textContent = data.email;
            document.getElementById('user-username').textContent = data.username;
        } else {
            console.error('Erreur:', data.error);
        }
    } catch (err) {
        console.error('Erreur lors du chargement des infos:', err);
    }
}

// Charger les infos au chargement de la page
document.addEventListener('DOMContentLoaded', loadUserInfo);
