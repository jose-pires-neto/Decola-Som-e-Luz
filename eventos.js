// eventos.js

// Constantes
const COLECAO_EVENTOS = 'eventos';
const COLECAO_EQUIPAMENTOS = 'equipamentos';
const STATUS_EM_ANDAMENTO = 'em andamento';
const STATUS_FINALIZADO = 'finalizado';
const STATUS_DISPONIVEL = 'disponível';
const STATUS_EM_USO = 'em uso';

function getDb() {
    return firebase.firestore();
}

function mostrarMensagem(mensagem, tipo = 'info') {
    alert(`${tipo.toUpperCase()}: ${mensagem}`);
    // Aqui você pode implementar um sistema de notificação mais elaborado no futuro
}

function criarCardEvento(evento, docId) {
    return `
        <div class="card-evento">
            <h3>${evento.nome}</h3>
            <p>Data: ${formatarData(evento.data)}</p>
            <p>Status: ${evento.status}</p>
            <p>Equipamentos: ${evento.equipamentos.map(e => e.nome).join(', ')}</p>
            <div class="acoes-evento">
                <button onclick="editarEvento('${docId}')" class="btn-editar">Editar</button>
                <button onclick="excluirEvento('${docId}')" class="btn-excluir">Excluir</button>
                ${evento.status !== STATUS_FINALIZADO ? 
                    `<button onclick="finalizarEvento('${docId}')" class="btn-finalizar">Finalizar</button>` : 
                    ''}
            </div>
        </div>
    `;
}

function criarFormularioEvento(evento = null, equipamentos = []) {
    const modoEdicao = !!evento;
    return `
        <form id="${modoEdicao ? 'editar' : 'adicionar'}-evento-form" class="formulario-evento">
            <h3>${modoEdicao ? 'Editar' : 'Adicionar'} Evento</h3>
            <div class="form-group">
                <label for="nome">Nome do Evento</label>
                <input type="text" id="nome" value="${modoEdicao ? evento.nome : ''}" required>
            </div>
            <div class="form-group">
                <label for="data">Data do Evento</label>
                <input type="date" id="data" value="${modoEdicao ? evento.data : ''}" required>
            </div>
            <div class="form-group">
                <label for="equipamentos">Equipamentos</label>
                <div class="select-wrapper">
                    <select id="equipamentos" multiple required>
                        ${equipamentos.map(eq => `
                            <option value="${eq.id}" ${modoEdicao && evento.equipamentos.some(e => e.id === eq.id) ? 'selected' : ''}>
                                ${eq.nome}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <small>Pressione Ctrl (ou Cmd no Mac) para selecionar múltiplos equipamentos</small>
            </div>
            ${modoEdicao ? `
                <div class="form-group">
                    <label for="status">Status do Evento</label>
                    <select id="status" required>
                        <option value="${STATUS_EM_ANDAMENTO}" ${evento.status === STATUS_EM_ANDAMENTO ? 'selected' : ''}>Em Andamento</option>
                        <option value="${STATUS_FINALIZADO}" ${evento.status === STATUS_FINALIZADO ? 'selected' : ''}>Finalizado</option>
                    </select>
                </div>
            ` : ''}
            <div class="form-group">
                <button type="submit" class="btn-principal">${modoEdicao ? 'Atualizar' : 'Adicionar'} Evento</button>
            </div>
        </form>
    `;
}

function carregarEventos() {
    const eventosRef = getDb().collection(COLECAO_EVENTOS);
    
    eventosRef.get().then((querySnapshot) => {
        let eventosHTML = `
            <div class="cabecalho-eventos">
                <h2>Eventos</h2>
                <button onclick="mostrarFormularioAdicionarEvento()" class="btn-adicionar">Adicionar Evento</button>
            </div>
            <div class="grid-eventos">
        `;
        
        querySnapshot.forEach((doc) => {
            eventosHTML += criarCardEvento(doc.data(), doc.id);
        });
        
        eventosHTML += '</div>';
        document.getElementById('dashboard').innerHTML = eventosHTML;
    }).catch(error => {
        console.error("Erro ao carregar eventos: ", error);
        mostrarMensagem("Erro ao carregar eventos. Por favor, tente novamente.", 'erro');
    });
}

function mostrarFormularioAdicionarEvento() {
    getDb().collection(COLECAO_EQUIPAMENTOS).where('status', '==', STATUS_DISPONIVEL).get()
        .then((querySnapshot) => {
            const equipamentos = querySnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            document.getElementById('dashboard').innerHTML = criarFormularioEvento(null, equipamentos);
            document.getElementById('adicionar-evento-form').addEventListener('submit', adicionarEvento);
        })
        .catch(error => {
            console.error("Erro ao carregar equipamentos: ", error);
            mostrarMensagem("Erro ao carregar formulário. Por favor, tente novamente.", 'erro');
        });
}

function adicionarEvento(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const data = document.getElementById('data').value;
    const equipamentosSelect = document.getElementById('equipamentos');
    const equipamentos = Array.from(equipamentosSelect.selectedOptions).map(option => ({
        id: option.value,
        nome: option.text.split(' - ')[1]
    }));
    
    const batch = getDb().batch();
    const eventoRef = getDb().collection(COLECAO_EVENTOS).doc();
    
    batch.set(eventoRef, {
        nome: nome,
        data: data,
        equipamentos: equipamentos,
        status: STATUS_EM_ANDAMENTO
    });

    equipamentos.forEach((equipamento) => {
        const equipamentoRef = getDb().collection(COLECAO_EQUIPAMENTOS).doc(equipamento.id);
        batch.update(equipamentoRef, {status: STATUS_EM_USO});
    });

    batch.commit()
        .then(() => {
            mostrarMensagem("Evento adicionado com sucesso!", 'sucesso');
            carregarEventos();
        })
        .catch((error) => {
            console.error("Erro ao adicionar evento: ", error);
            mostrarMensagem("Erro ao adicionar evento. Por favor, tente novamente.", 'erro');
        });
}

function editarEvento(id) {
    Promise.all([
        getDb().collection(COLECAO_EVENTOS).doc(id).get(),
        getDb().collection(COLECAO_EQUIPAMENTOS).get()
    ]).then(([eventoDoc, equipamentosSnapshot]) => {
        if (eventoDoc.exists) {
            const evento = eventoDoc.data();
            const equipamentos = equipamentosSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
            document.getElementById('dashboard').innerHTML = criarFormularioEvento(evento, equipamentos);
            document.getElementById('editar-evento-form').addEventListener('submit', (e) => atualizarEvento(e, id));
        } else {
            mostrarMensagem("Evento não encontrado.", 'erro');
        }
    }).catch((error) => {
        console.error("Erro ao obter evento ou equipamentos: ", error);
        mostrarMensagem("Erro ao carregar formulário de edição. Por favor, tente novamente.", 'erro');
    });
}

function atualizarEvento(e, id) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const data = document.getElementById('data').value;
    const equipamentosSelect = document.getElementById('equipamentos');
    const equipamentos = Array.from(equipamentosSelect.selectedOptions).map(option => ({
        id: option.value,
        nome: option.text.split(' - ')[1]
    }));
    const status = document.getElementById('status').value;
    
    const batch = getDb().batch();
    const eventoRef = getDb().collection(COLECAO_EVENTOS).doc(id);
    
    batch.update(eventoRef, { nome, data, equipamentos, status });
    
    getDb().collection(COLECAO_EQUIPAMENTOS).get().then((snapshot) => {
        snapshot.docs.forEach(doc => {
            const equipamento = doc.data();
            const equipamentoRef = getDb().collection(COLECAO_EQUIPAMENTOS).doc(doc.id);
            const novoStatus = equipamentos.some(e => e.id === doc.id) ? STATUS_EM_USO : STATUS_DISPONIVEL;
            if (equipamento.status !== novoStatus) {
                batch.update(equipamentoRef, { status: novoStatus });
            }
        });
        
        return batch.commit();
    }).then(() => {
        mostrarMensagem('Evento atualizado com sucesso!', 'sucesso');
        carregarEventos();
    }).catch((error) => {
        console.error("Erro ao atualizar evento: ", error);
        mostrarMensagem('Erro ao atualizar evento. Por favor, tente novamente.', 'erro');
    });
}

function excluirEvento(id) {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
        getDb().collection(COLECAO_EVENTOS).doc(id).delete()
            .then(() => {
                mostrarMensagem("Evento excluído com sucesso!", 'sucesso');
                carregarEventos();
            }).catch((error) => {
                console.error("Erro ao excluir evento: ", error);
                mostrarMensagem("Erro ao excluir evento. Por favor, tente novamente.", 'erro');
            });
    }
}

function finalizarEvento(id) {
    getDb().collection(COLECAO_EVENTOS).doc(id).get().then((doc) => {
        const evento = doc.data();
        const batch = getDb().batch();
        
        batch.update(doc.ref, {status: STATUS_FINALIZADO});
        
        evento.equipamentos.forEach((equipamento) => {
            const equipamentoRef = getDb().collection(COLECAO_EQUIPAMENTOS).doc(equipamento.id);
            batch.update(equipamentoRef, {status: STATUS_DISPONIVEL});
        });
        
        return batch.commit();
    }).then(() => {
        mostrarMensagem("Evento finalizado com sucesso!", 'sucesso');
        carregarEventos();
    }).catch((error) => {
        console.error("Erro ao finalizar evento: ", error);
        mostrarMensagem("Erro ao finalizar evento. Por favor, tente novamente.", 'erro');
    });
}

function formatarData(dataString) {
    const opcoes = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dataString).toLocaleDateString('pt-BR', opcoes);
}