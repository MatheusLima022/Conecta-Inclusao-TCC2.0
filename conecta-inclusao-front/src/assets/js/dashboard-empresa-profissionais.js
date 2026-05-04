// Gerenciador de Profissionais da Empresa
let api;
let currentProfessionals = [];

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
    const unidade = document.getElementById('professionalUnit').value.trim();
    const password = document.getElementById('professionalPassword').value.trim();
    const confirmPassword = document.getElementById('professionalConfirmPassword').value.trim();
    const email = document.getElementById('professionalEmail').value.trim();
    const bio = document.getElementById('professionalBio').value.trim();
    
    // Validações
    if (!crm || !name || !especialidade || !unidade || !password) {
        showPopup('Preencha todos os campos obrigatórios.');
        return;
    }
    
    if (crm.length < 4) {
        showPopup('CRM inválido.');
        return;
    }
    
    if (password !== confirmPassword) {
        showPopup('As senhas não coincidem.');
        return;
    }
    
    // Obter clinicaId do localStorage
    const userData = localStorage.getItem('user');
    if (!userData) {
        showPopup('Erro: Dados do usuário não encontrados. Faça login novamente.');
        return;
    }
    const user = JSON.parse(userData);
    const userId = user.id;
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Registrando...';
    
    try {
        const apiModule = await loadAPI();
        
        const result = await apiModule.registerProfessional(
            crm.toUpperCase(),
            name,
            especialidade,
            unidade,
            password,
            email,
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
        currentProfessionals = Array.isArray(data) ? data : [];
        displayProfessionalsList(currentProfessionals);
        
    } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
    }
}

// Exibir lista de profissionais
function displayProfessionalsList(professionals) {
    const teamBody = document.getElementById('teamFullTableBody');
    const unitFilter = document.getElementById('unitFilterSelect');
    
    if (!teamBody) return;
    
    if (!professionals || professionals.length === 0) {
        teamBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #999; padding: 1rem;">Nenhum profissional cadastrado ainda.</td></tr>';
        updateTeamSummary([]);
        updateUnitFilterOptions([]);
        return;
    }
    
    teamBody.innerHTML = professionals.map(prof => `
        <tr>
            <td>${prof.name || 'N/A'}</td>
            <td>${prof.especialidade || 'Médico'}</td>
            <td>${prof.crm || 'N/A'}</td>
            <td><span class="status-dot active">Ativo</span></td>
            <td>${prof.unidade || 'N/A'}</td>
            <td>
                <button onclick="editProfessional(${prof.id})" style="background: none; border: none; color: #667eea; cursor: pointer; margin: 0 4px;">
                    <i class="ph ph-pencil"></i> Editar
                </button>
                <button onclick="deleteProfessional(${prof.id})" style="background: none; border: none; color: #f44336; cursor: pointer; margin: 0 4px;">
                    <i class="ph ph-trash"></i> Remover
                </button>
            </td>
        </tr>
    `).join('');
    
    updateTeamSummary(professionals);
    updateUnitFilterOptions(professionals);
}

function updateTeamSummary(professionals) {
    const activeCountEl = document.getElementById('cardActiveCount');
    const workingCountEl = document.getElementById('cardWorkingCount');
    const breakCountEl = document.getElementById('cardBreakCount');

    const active = professionals.length;
    const working = professionals.filter(prof => prof.status && prof.status.toLowerCase() === 'trabalhando').length || active;
    const onBreak = professionals.filter(prof => prof.status && ['férias', 'folga', 'licença'].includes(prof.status.toLowerCase())).length;

    if (activeCountEl) activeCountEl.innerText = active;
    if (workingCountEl) workingCountEl.innerText = working;
    if (breakCountEl) breakCountEl.innerText = onBreak;
}

function updateUnitFilterOptions(professionals) {
    const unitFilter = document.getElementById('unitFilterSelect');
    if (!unitFilter) return;

    const uniqueUnits = Array.from(new Set(professionals.map(prof => prof.unidade).filter(Boolean)));
    const previousValue = unitFilter.value || 'Todas';

    unitFilter.innerHTML = '<option value="Todas">Todas</option>' + uniqueUnits.map(unit => `
        <option value="${unit}">${unit}</option>
    `).join('');

    if ([...unitFilter.options].some(opt => opt.value === previousValue)) {
        unitFilter.value = previousValue;
    }
}

function applyUnitFilter() {
    const unitFilter = document.getElementById('unitFilterSelect');
    if (!unitFilter) return;
    
    const selectedUnit = unitFilter.value;
    const filtered = selectedUnit === 'Todas'
        ? currentProfessionals
        : currentProfessionals.filter(prof => prof.unidade === selectedUnit);

    displayProfessionalsList(filtered);
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

    const filterButton = document.getElementById('btnApplyUnitFilter');
    if (filterButton) {
        filterButton.addEventListener('click', applyUnitFilter);
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
