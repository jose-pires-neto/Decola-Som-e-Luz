// eventos.js
function getDb() {
    return firebase.firestore();
}

function loadEventos() {
    const eventosRef = getDb().collection('eventos');
    
    eventosRef.get().then((querySnapshot) => {
        let eventosHTML = '<h2>Eventos</h2>';
        eventosHTML += '<button onclick="showAddEventoForm()">Adicionar Evento</button>';
        eventosHTML += '<table><tr><th>Nome</th><th>Data</th><th>Equipamentos</th><th>Status</th><th>Ações</th></tr>';
        
        querySnapshot.forEach((doc) => {
            const evento = doc.data();
            eventosHTML += `
                <tr>
                    <td>${evento.nome}</td>
                    <td>${evento.data}</td>
                    <td>${evento.equipamentos.map(e => e.id).join(', ')}</td>
                    <td>${evento.status}</td>
                    <td>
                        <button onclick="editEvento('${doc.id}')">Editar</button>
                        <button onclick="deleteEvento('${doc.id}')">Excluir</button>
                        ${evento.status !== 'finalizado' ? `<button onclick="finalizarEvento('${doc.id}')">Finalizar</button>` : ''}
                    </td>
                </tr>
            `;
        });
        
        eventosHTML += '</table>';
        dashboard.innerHTML = eventosHTML;
    });
}

function showAddEventoForm() {
    getDb().collection('equipamentos').where('status', '==', 'disponível').get().then((querySnapshot) => {
        let equipamentosOptions = '';
        querySnapshot.forEach((doc) => {
            const equipamento = doc.data();
            equipamentosOptions += `<option value="${equipamento.id}">${equipamento.id} - ${equipamento.nome}</option>`;
        });

        const formHTML = `
            <h3>Adicionar Evento</h3>
            <form id="add-evento-form">
                <input type="text" id="nome" placeholder="Nome do Evento" required>
                <input type="date" id="data" required>
                <select id="equipamentos" multiple required>
                    ${equipamentosOptions}
                </select>
                <button type="submit">Adicionar</button>
            </form>
        `;
        dashboard.innerHTML += formHTML;
        
        document.getElementById('add-evento-form').addEventListener('submit', addEvento);
    });
}

function addEvento(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const data = document.getElementById('data').value;
    const equipamentosSelect = document.getElementById('equipamentos');
    const equipamentos = Array.from(equipamentosSelect.selectedOptions).map(option => ({
        id: option.value,
        nome: option.text.split(' - ')[1]
    }));
    
    getDb().collection('eventos').add({
        nome: nome,
        data: data,
        equipamentos: equipamentos,
        status: 'em andamento'
    }).then(() => {
        // Atualizar status dos equipamentos para 'em uso'
        const batch = getDb().batch();
        equipamentos.forEach((equipamento) => {
            const equipamentoRef = getDb().collection('equipamentos').doc(equipamento.id);
            batch.update(equipamentoRef, {status: 'em uso'});
        });
        return batch.commit();
    }).then(() => {
        loadEventos();
    }).catch((error) => {
        console.error("Erro ao adicionar evento: ", error);
    });
}

function editEvento(id) {
    const eventoRef = getDb().collection('eventos').doc(id);
    
    Promise.all([
        eventoRef.get(),
        getDb().collection('equipamentos').get()
    ]).then(([eventoDoc, equipamentosSnapshot]) => {
        if (eventoDoc.exists) {
            const evento = eventoDoc.data();
            let equipamentosOptions = '';
            equipamentosSnapshot.forEach((doc) => {
                const equipamento = doc.data();
                const isSelected = evento.equipamentos.some(e => e.id === equipamento.id);
                equipamentosOptions += `<option value="${equipamento.id}" ${isSelected ? 'selected' : ''}>${equipamento.id} - ${equipamento.nome}</option>`;
            });

            const formHTML = `
                <h3>Editar Evento</h3>
                <form id="edit-evento-form">
                    <input type="text" id="edit-nome" value="${evento.nome}" required>
                    <input type="date" id="edit-data" value="${evento.data}" required>
                    <select id="edit-equipamentos" multiple required>
                        ${equipamentosOptions}
                    </select>
                    <select id="edit-status" required>
                        <option value="em andamento" ${evento.status === 'em andamento' ? 'selected' : ''}>Em Andamento</option>
                        <option value="finalizado" ${evento.status === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                    </select>
                    <button type="submit">Atualizar</button>
                </form>
            `;
            dashboard.innerHTML = formHTML;
            
            document.getElementById('edit-evento-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const nome = document.getElementById('edit-nome').value;
                const data = document.getElementById('edit-data').value;
                const equipamentosSelect = document.getElementById('edit-equipamentos');
                const equipamentos = Array.from(equipamentosSelect.selectedOptions).map(option => ({
                    id: option.value,
                    nome: option.text.split(' - ')[1]
                }));
                const status = document.getElementById('edit-status').value;
                
                const batch = getDb().batch();
                
                // Atualizar evento
                batch.update(eventoRef, { nome, data, equipamentos, status });
                
                // Atualizar status dos equipamentos
                const allEquipamentos = equipamentosSnapshot.docs.map(doc => doc.data());
                allEquipamentos.forEach(equipamento => {
                    const equipamentoRef = getDb().collection('equipamentos').doc(equipamento.id);
                    const novoStatus = equipamentos.some(e => e.id === equipamento.id) ? 'em uso' : 'disponível';
                    if (equipamento.status !== novoStatus) {
                        batch.update(equipamentoRef, { status: novoStatus });
                    }
                });
                
                batch.commit().then(() => {
                    alert('Evento atualizado com sucesso!');
                    loadEventos();
                }).catch((error) => {
                    console.error("Erro ao atualizar evento: ", error);
                    alert('Erro ao atualizar evento. Por favor, tente novamente.');
                });
            });
        } else {
            console.log("Evento não encontrado");
            alert('Evento não encontrado.');
        }
    }).catch((error) => {
        console.error("Erro ao obter evento ou equipamentos: ", error);
        alert('Erro ao obter dados do evento ou equipamentos. Por favor, tente novamente.');
    });
}

function deleteEvento(id) {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
        getDb().collection('eventos').doc(id).delete().then(() => {
            loadEventos();
        }).catch((error) => {
            console.error("Erro ao excluir evento: ", error);
        });
    }
}

function finalizarEvento(id) {
    getDb().collection('eventos').doc(id).get().then((doc) => {
        const evento = doc.data();
        const batch = getDb().batch();
        
        // Atualizar status do evento
        batch.update(doc.ref, {status: 'finalizado'});
        
        // Atualizar status dos equipamentos para 'disponível'
        evento.equipamentos.forEach((equipamento) => {
            const equipamentoRef = getDb().collection('equipamentos').doc(equipamento.id);
            batch.update(equipamentoRef, {status: 'disponível'});
        });
        
        return batch.commit();
    }).then(() => {
        loadEventos();
    }).catch((error) => {
        console.error("Erro ao finalizar evento: ", error);
    });
}