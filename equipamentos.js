// equipamentos.js
let currentPage = 1;
const itemsPerPage = 10;
let currentFilter = '';

function getDb() {
    return firebase.firestore();
}

function loadEquipamentos() {
    const equipamentosRef = getDb().collection('equipamentos');
    
    let query = equipamentosRef;
    if (currentFilter) {
        query = query.where('categoria', '==', currentFilter);
    }
    
    query.get().then((querySnapshot) => {
        const equipamentos = [];
        querySnapshot.forEach((doc) => {
            equipamentos.push(doc.data());
        });
        
        const categorias = [...new Set(equipamentos.map(e => e.categoria))];
        const totalPages = Math.ceil(equipamentos.length / itemsPerPage);
        
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedEquipamentos = equipamentos.slice(startIndex, endIndex);
        
        let equipamentosHTML = `
            <h2>Equipamentos</h2>
            <button onclick="showAddEquipamentoForm()">Adicionar Equipamento</button>
            <div class="filter-container">
                <select id="categoria-filter" onchange="filterEquipamentos()">
                    <option value="">Todas as Categorias</option>
                    ${categorias.map(c => `<option value="${c}">${c}</option>`).join('')}
                </select>
            </div>
            <div class="equipamentos-grid">
        `;
        
        paginatedEquipamentos.forEach((equipamento) => {
            equipamentosHTML += `
                <div class="equipamento-card">
                    <h3>${equipamento.nome}</h3>
                    <p><strong>ID:</strong> ${equipamento.id}</p>
                    <p><strong>Categoria:</strong> ${equipamento.categoria}</p>
                    <p><strong>Status:</strong> ${equipamento.status}</p>
                    <div class="card-actions">
                        <button onclick="editEquipamento('${equipamento.id}')">Editar</button>
                        <button onclick="deleteEquipamento('${equipamento.id}')">Excluir</button>
                    </div>
                </div>
            `;
        });
        
        equipamentosHTML += `
            </div>
            <div class="pagination">
                ${generatePaginationControls(totalPages)}
            </div>
        `;
        
        dashboard.innerHTML = equipamentosHTML;
    });
}


function showAddEquipamentoForm() {
    const formHTML = `
        <h3>Adicionar Equipamento</h3>
        <form id="add-equipamento-form">
            <input type="text" id="nome" placeholder="Nome" required>
            <input type="text" id="categoria" placeholder="Categoria" required>
            <input type="number" id="quantidade" placeholder="Quantidade" required min="1">
            <select id="status" required>
                <option value="disponível">Disponível</option>
                <option value="em uso">Em Uso</option>
                <option value="manutenção">Manutenção</option>
            </select>
            <button type="submit">Adicionar</button>
        </form>
    `;
    dashboard.innerHTML += formHTML;
    
    document.getElementById('add-equipamento-form').addEventListener('submit', addEquipamento);
}

function addEquipamento(e) {
    e.preventDefault();
    const nome = document.getElementById('nome').value;
    const categoria = document.getElementById('categoria').value;
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const status = document.getElementById('status').value;
    
    // Gerar um timestamp único para este lote de equipamentos
    const timestamp = Date.now();

    // Criar novos equipamentos
    const batch = getDb().batch();
    const promises = [];

    for (let i = 1; i <= quantidade; i++) {
        const newId = `${categoria}-${timestamp}-${String(i).padStart(3, '0')}`;
        const docRef = getDb().collection('equipamentos').doc(newId);
        batch.set(docRef, {
            id: newId,
            nome: nome,
            categoria: categoria,
            status: status,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Adicionar uma promessa para verificar se o documento já existe
        promises.push(docRef.get());
    }

    // Verificar se algum dos documentos já existe
    Promise.all(promises)
        .then((docs) => {
            const alreadyExists = docs.some(doc => doc.exists);
            if (alreadyExists) {
                throw new Error('Alguns IDs gerados já existem. Por favor, tente novamente.');
            }
            // Se nenhum documento existe, podemos prosseguir com o commit do batch
            return batch.commit();
        })
        .then(() => {
            alert(`${quantidade} ${nome}(s) adicionado(s) com sucesso!`);
            loadEquipamentos();
        })
        .catch((error) => {
            console.error("Erro ao adicionar equipamentos: ", error);
            alert('Erro ao adicionar equipamentos: ' + error.message);
        });
}

function editEquipamento(id) {
    const equipamentoRef = getDb().collection('equipamentos').doc(id);
    
    equipamentoRef.get().then((doc) => {
        if (doc.exists) {
            const equipamento = doc.data();
            const formHTML = `
                <h3>Editar Equipamento</h3>
                <form id="edit-equipamento-form" class="formulario-equipamento">
                    <div class="form-group">
                        <label for="edit-id">ID do Equipamento</label>
                        <input type="text" id="edit-id" value="${equipamento.id}" readonly>
                    </div>
                    <div class="form-group">
                        <label for="edit-nome">Nome</label>
                        <input type="text" id="edit-nome" value="${equipamento.nome}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-categoria">Categoria</label>
                        <input type="text" id="edit-categoria" value="${equipamento.categoria}" required>
                    </div>
                    <div class="form-group">
                        <label for="edit-status">Status</label>
                        <select id="edit-status" required>
                            <option value="disponível" ${equipamento.status === 'disponível' ? 'selected' : ''}>Disponível</option>
                            <option value="em uso" ${equipamento.status === 'em uso' ? 'selected' : ''}>Em Uso</option>
                            <option value="manutenção" ${equipamento.status === 'manutenção' ? 'selected' : ''}>Manutenção</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <button type="submit" class="btn-principal">Atualizar</button>
                    </div>
                </form>
            `;
            dashboard.innerHTML = formHTML;
            
            document.getElementById('edit-equipamento-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const updatedEquipamento = {
                    id: document.getElementById('edit-id').value,
                    nome: document.getElementById('edit-nome').value,
                    categoria: document.getElementById('edit-categoria').value,
                    status: document.getElementById('edit-status').value
                };
                
                equipamentoRef.update(updatedEquipamento).then(() => {
                    alert('Equipamento atualizado com sucesso!');
                    loadEquipamentos();
                }).catch((error) => {
                    console.error("Erro ao atualizar equipamento: ", error);
                    alert('Erro ao atualizar equipamento. Por favor, tente novamente.');
                });
            });
        } else {
            console.log("Equipamento não encontrado");
            alert('Equipamento não encontrado.');
        }
    }).catch((error) => {
        console.error("Erro ao obter equipamento: ", error);
        alert('Erro ao obter dados do equipamento. Por favor, tente novamente.');
    });
}


function deleteEquipamento(id) {
    if (confirm('Tem certeza que deseja excluir este equipamento?')) {
        getDb().collection('equipamentos').doc(id).delete().then(() => {
            loadEquipamentos();
        }).catch((error) => {
            console.error("Erro ao excluir equipamento: ", error);
        });
    }
}



function generatePaginationControls(totalPages) {
    let controls = '';
    for (let i = 1; i <= totalPages; i++) {
        controls += `<button onclick="changePage(${i})" ${i === currentPage ? 'class="active"' : ''}>${i}</button>`;
    }
    return controls;
}

function changePage(page) {
    currentPage = page;
    loadEquipamentos();
}

function filterEquipamentos() {
    currentFilter = document.getElementById('categoria-filter').value;
    currentPage = 1;
    loadEquipamentos();
}