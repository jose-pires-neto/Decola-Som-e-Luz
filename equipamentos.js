// equipamentos.js
function getDb() {
    return firebase.firestore();
}

function loadEquipamentos() {
    const equipamentosRef = getDb().collection('equipamentos');
    
    equipamentosRef.get().then((querySnapshot) => {
        let equipamentosHTML = '<h2>Equipamentos</h2>';
        equipamentosHTML += '<button onclick="showAddEquipamentoForm()">Adicionar Equipamento</button>';
        equipamentosHTML += '<table><tr><th>ID</th><th>Nome</th><th>Categoria</th><th>Quantidade</th><th>Status</th><th>Ações</th></tr>';
        
        querySnapshot.forEach((doc) => {
            const equipamento = doc.data();
            equipamentosHTML += `
                <tr>
                    <td>${equipamento.id}</td>
                    <td>${equipamento.nome}</td>
                    <td>${equipamento.categoria}</td>
                    <td>${equipamento.quantidade}</td>
                    <td>${equipamento.status}</td>
                    <td>
                        <button onclick="editEquipamento('${doc.id}')">Editar</button>
                        <button onclick="deleteEquipamento('${doc.id}')">Excluir</button>
                    </td>
                </tr>
            `;
        });
        
        equipamentosHTML += '</table>';
        dashboard.innerHTML = equipamentosHTML;
    });
}

function showAddEquipamentoForm() {
    const formHTML = `
        <h3>Adicionar Equipamento</h3>
        <form id="add-equipamento-form">
            <input type="text" id="id" placeholder="ID Único" required>
            <input type="text" id="nome" placeholder="Nome" required>
            <input type="text" id="categoria" placeholder="Categoria" required>
            <input type="number" id="quantidade" placeholder="Quantidade" required>
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
    const id = document.getElementById('id').value;
    const nome = document.getElementById('nome').value;
    const categoria = document.getElementById('categoria').value;
    const quantidade = parseInt(document.getElementById('quantidade').value);
    const status = document.getElementById('status').value;
    
    getDb().collection('equipamentos').doc(id).set({
        id: id,
        nome: nome,
        categoria: categoria,
        quantidade: quantidade,
        status: status
    }).then(() => {
        loadEquipamentos();
    }).catch((error) => {
        console.error("Erro ao adicionar equipamento: ", error);
    });
}

function editEquipamento(id) {
    const equipamentoRef = getDb().collection('equipamentos').doc(id);
    
    equipamentoRef.get().then((doc) => {
        if (doc.exists) {
            const equipamento = doc.data();
            const formHTML = `
                <h3>Editar Equipamento</h3>
                <form id="edit-equipamento-form">
                    <input type="text" id="edit-id" value="${equipamento.id}" readonly>
                    <input type="text" id="edit-nome" value="${equipamento.nome}" required>
                    <input type="text" id="edit-categoria" value="${equipamento.categoria}" required>
                    <input type="number" id="edit-quantidade" value="${equipamento.quantidade}" required>
                    <select id="edit-status" required>
                        <option value="disponível" ${equipamento.status === 'disponível' ? 'selected' : ''}>Disponível</option>
                        <option value="em uso" ${equipamento.status === 'em uso' ? 'selected' : ''}>Em Uso</option>
                        <option value="manutenção" ${equipamento.status === 'manutenção' ? 'selected' : ''}>Manutenção</option>
                    </select>
                    <button type="submit">Atualizar</button>
                </form>
            `;
            dashboard.innerHTML = formHTML;
            
            document.getElementById('edit-equipamento-form').addEventListener('submit', (e) => {
                e.preventDefault();
                const updatedEquipamento = {
                    id: document.getElementById('edit-id').value,
                    nome: document.getElementById('edit-nome').value,
                    categoria: document.getElementById('edit-categoria').value,
                    quantidade: parseInt(document.getElementById('edit-quantidade').value),
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