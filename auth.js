// auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        firebase.auth().signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Login bem-sucedido
                console.log('Usuário autenticado:', userCredential.user);
            })
            .catch((error) => {
                // Erro no login
                console.error('Erro de autenticação:', error.message);
                alert('Erro de autenticação: ' + error.message);
            });
    });
});