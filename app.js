// app.js
document.addEventListener('DOMContentLoaded', () => {
    // Configuração do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyCw5A0MD1tIPrb4lQuat1XtrpwVxLA4r5g",
        authDomain: "decola-som-e-luz.firebaseapp.com",
        projectId: "decola-som-e-luz",
        storageBucket: "decola-som-e-luz.appspot.com",
        messagingSenderId: "67294891768",
        appId: "1:67294891768:web:ea9e5e9c425acc7c68350d",
        measurementId: "G-0LQEC44GTF"
    };

    // Inicialize o Firebase
    firebase.initializeApp(firebaseConfig);

    // Inicialize o Firestore
    const db = firebase.firestore();

    // Referências aos elementos do DOM
    const loginSection = document.getElementById('login-section');
    const dashboard = document.getElementById('dashboard');
    const logoutBtn = document.getElementById('logout-btn');
    const equipamentosLink = document.getElementById('equipamentos-link');
    const eventosLink = document.getElementById('eventos-link');
    const relatoriosLink = document.getElementById('relatorios-link');

    // Verificar o estado de autenticação
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            // Usuário está autenticado
            loginSection.style.display = 'none';
            dashboard.style.display = 'block';
            logoutBtn.style.display = 'inline-block';
            loadDashboard();
        } else {
            // Usuário não está autenticado
            loginSection.style.display = 'block';
            dashboard.style.display = 'none';
            logoutBtn.style.display = 'none';
        }
    });

    // Event listeners
    logoutBtn.addEventListener('click', () => {
        firebase.auth().signOut();
    });

    equipamentosLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadEquipamentos(db);
    });

    eventosLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof carregarEventos === 'function') {
            carregarEventos();
        } else {
            console.error('A função carregarEventos não está definida.');
            alert('Erro ao carregar eventos. Por favor, recarregue a página e tente novamente.');
        }
    });

    relatoriosLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadRelatorios(db);
    });

    // Funções de carregamento de conteúdo
    function loadDashboard() {
        dashboard.innerHTML = '<h2>Bem-vindo ao Painel de Controle</h2>';
        // Adicione aqui um resumo geral ou as principais funcionalidades
    }

    // As funções loadEquipamentos e loadRelatorios serão definidas nos seus respectivos arquivos
});

// Certifique-se de que a função carregarEventos esteja definida globalmente
if (typeof window.carregarEventos !== 'function') {
    window.carregarEventos = function() {
        console.log('Função carregarEventos chamada');
        // Implementação temporária
        alert('Carregando eventos... Esta é uma implementação temporária.');
    };
}