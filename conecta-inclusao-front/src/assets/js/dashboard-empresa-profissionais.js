// Gerenciador de Profissionais da Empresa
let api;

async function loadAPI() {
    if (!api) {
        api = await import('./api.js');
    }
    return api;
}

// Máscara de CRM automática
function applyCRMMask(value) {
    let v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 7) v = v.slice(0, 7);
    return v;
}

// Registrar novo profissional
async function handleRegisterProfessional(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerText;
    
    const crm = document.getElementById('professionalCRM').value.trim();
    const name = document.getElementById('professionalName').value.trim();
    const especialidade = document.getElementById('professionalEspecialidade').value.trim();
    const bio = document.getElementById('professionalBio').value.trim();
    
    // Validações
    if (!crm || !name || !especialidade) {
        showPopup('Preencha todos os campos obrigatórios.');
        return;
    }
    
    if (crm.length < 4) {
        showPopup('CRM inválido.');
        return;
    }
    
    // Obter clinicaId do sessionStorage
    const userId = sessionStorage.getItem('userId');
    
    if (!userId) {
        showPopup('Erro: Clínica não identificada. Faça login novamente.');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Registrando...';
    
    try {
        const apiModule = await loadAPI();
        
        // Buscar ID da clínica pelo userId
        const clinicaId = await getClinicaIdByUserId(userId);
        
        if (!clinicaId) {
            showPopup('Erro: Clínica não encontrada.');
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
            return;
        }
        
        const result = await apiModule.registerProfessional(
            crm.toUpperCase(),
            name,
            especialidade,
            clinicaId,
            bio
        );
        
        if (!result.ok) {
            showPopup(`Erro: ${result.error}`);
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
            return;
        }
        
        // Sucesso
        showPopup(`Profissional ${name} registrado com sucesso! CRM: ${result.data.crm}`);
        
        // Limpar formulário
        form.reset();
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
        
        // Atualizar lista de profissionais
        loadProfessionalsList();
        
    } catch (error) {
        console.error('Erro ao registrar profissional:', error);
        showPopup(`Erro: ${error.message}`);
        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    }
}

// Buscar ID da clínica pelo ID do usuário
async function getClinicaIdByUserId(userId) {
    try {
        const apiModule = await loadAPI();
        const token = apiModule.getToken();
        
        if (!token) return null;
        
        const response = await fetch(`http://localhost:3000/clinic/id/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.clinicaId || null;
    } catch (error) {
        console.error('Erro ao buscar ID da clínica:', error);
        return null;
    }
}

// Carregar lista de profissionais
async function loadProfessionalsList() {
    try {
        const apiModule = await loadAPI();
        const token = apiModule.getToken();
        
        if (!token) {
            console.log('Usuário não autenticado');
            return;
        }
        
        const response = await fetch('http://localhost:3000/clinic/professionals', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) return;
        
        const data = await response.json();
        displayProfessionalsList(data);
        
    } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
    }
}

// Exibir lista de profissionais
function displayProfessionalsList(professionals) {
    const container = document.getElementById('professionalsList');
    
    if (!container) return;
    
    if (!professionals || professionals.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">Nenhum profissional cadastrado ainda.</p>';
        return;
    }
    
    let html = `
        <div style="overflow-x: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f5f5f5; border-bottom: 2px solid #ddd;">
                        <th style="padding: 12px; text-align: left;">Nome</th>
                        <th style="padding: 12px; text-align: left;">CRM</th>
                        <th style="padding: 12px; text-align: left;">Especialidade</th>
                        <th style="padding: 12px; text-align: center;">Status</th>
                        <th style="padding: 12px; text-align: center;">Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    professionals.forEach(prof => {
        html += `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 12px;">${prof.name || 'N/A'}</td>
                <td style="padding: 12px;">${prof.crm || 'N/A'}</td>
                <td style="padding: 12px;">${prof.especialidade || 'N/A'}</td>
                <td style="padding: 12px; text-align: center;">
                    <span style="background-color: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 4px; font-size: 12px;">
                        Ativo
                    </span>
                </td>
                <td style="padding: 12px; text-align: center;">
                    <button onclick="editProfessional(${prof.id})" style="background: none; border: none; color: #667eea; cursor: pointer; margin: 0 4px;">
                        <i class="ph ph-pencil"></i> Editar
                    </button>
                    <button onclick="deleteProfessional(${prof.id})" style="background: none; border: none; color: #f44336; cursor: pointer; margin: 0 4px;">
                        <i class="ph ph-trash"></i> Remover
                    </button>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Editar profissional (placeholder)
function editProfessional(id) {
    showPopup(`Editar profissional ${id} - Funcionalidade em desenvolvimento`);
}

// Deletar profissional
async function deleteProfessional(id) {
    if (!confirm('Tem certeza que deseja remover este profissional?')) return;
    
    try {
        const apiModule = await loadAPI();
        const token = apiModule.getToken();
        
        if (!token) {
            showPopup('Você precisa estar autenticado');
            return;
        }
        
        const response = await fetch(`http://localhost:3000/professionals/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            showPopup('Profissional removido com sucesso');
            loadProfessionalsList();
        } else {
            showPopup('Erro ao remover profissional');
        }
    } catch (error) {
        console.error('Erro:', error);
        showPopup('Erro ao remover profissional');
    }
}

// Inicializar quando página carrega
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registerProfessionalForm');
    const crmInput = document.getElementById('professionalCRM');
    
    if (form) {
        form.addEventListener('submit', handleRegisterProfessional);
    }
    
    if (crmInput) {
        crmInput.addEventListener('input', function(e) {
            e.target.value = applyCRMMask(e.target.value);
        });
    }
    
    // Carregar lista de profissionais
    loadProfessionalsList();
    
    // Animação de carregamento
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});
