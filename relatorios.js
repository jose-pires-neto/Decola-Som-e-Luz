// relatorios.js
function getDb() {
    return firebase.firestore();
}

function loadRelatorios() {
    const relatoriosHTML = `
        <h2>Relatórios</h2>
        <button onclick="gerarRelatorioEquipamentos()">Relatório de Equipamentos</button>
        <button onclick="gerarRelatorioEventos()">Relatório de Eventos</button>
        <div id="relatorio-resultado"></div>
    `;
    dashboard.innerHTML = relatoriosHTML;
}

function gerarRelatorioEquipamentos() {
    const equipamentosRef = getDb().collection('equipamentos');
    
    equipamentosRef.get().then((querySnapshot) => {
        let relatorioHTML = '<h3>Relatório de Equipamentos</h3>';
        relatorioHTML += '<table><tr><th>Nome</th><th>Categoria</th><th>Quantidade</th><th>Status</th></tr>';
        
        querySnapshot.forEach((doc) => {
            const equipamento = doc.data();
            relatorioHTML += `
                <tr>
                    <td>${equipamento.nome}</td>
                    <td>${equipamento.categoria}</td>
                    <td>${equipamento.quantidade}</td>
                    <td>${equipamento.status}</td>
                </tr>
            `;
        });
        
        relatorioHTML += '</table>';
        document.getElementById('relatorio-resultado').innerHTML = relatorioHTML;
    });
}

function gerarRelatorioEventos() {
    const eventosRef = getDb().collection('eventos');
    
    eventosRef.get().then((querySnapshot) => {
        let relatorioHTML = '<h3>Relatório de Eventos</h3>';
        relatorioHTML += '<table><tr><th>Nome</th><th>Data</th><th>Equipamentos</th><th>Status</th></tr>';
        
        querySnapshot.forEach((doc) => {
            const evento = doc.data();
            relatorioHTML += `
                <tr>
                    <td>${evento.nome}</td>
                    <td>${evento.data}</td>
                    <td>${evento.equipamentos.join(', ')}</td>
                    <td>${evento.status}</td>
                </tr>
            `;
        });
        
        relatorioHTML += '</table>';
        document.getElementById('relatorio-resultado').innerHTML = relatorioHTML;
    });
}

function filtrarRelatorio(tipo, filtro, valor) {
    // Implementar lógica de filtragem de relatórios
    // Esta função pode ser chamada para filtrar os relatórios por categoria, status ou quantidade
}