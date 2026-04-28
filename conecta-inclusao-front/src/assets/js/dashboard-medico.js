const API_BASE_URL = 'http://localhost:3000';
const DEFAULT_UNIT = 'A';

const equipePorUnidade = {
    A: [
        { name: 'Dr. Ricardo Silva', crm: 'MED001', specialty: 'Cardiologia' },
        { name: 'Dra. Ana Costa', crm: 'MED002', specialty: 'Pediatria' },
        { name: 'Dr. Pedro Santos', crm: 'MED003', specialty: 'Ortopedia' }
    ],
    B: [
        { name: 'Dr. Joao Oliveira', crm: 'MED004', specialty: 'Neurologia' },
        { name: 'Dra. Maria Gomes', crm: 'MED005', specialty: 'Psiquiatria' },
        { name: 'Dr. Carlos Ferreira', crm: 'MED006', specialty: 'Dermatologia' }
    ],
    C: [
        { name: 'Dr. Luis Mendes', crm: 'MED007', specialty: 'Pneumologia' },
        { name: 'Dra. Patricia Rocha', crm: 'MED008', specialty: 'Ginecologia' },
        { name: 'Dr. Fernando Costa', crm: 'MED009', specialty: 'Gastroenterologia' }
    ]
};

const patientsData = [
    { name: 'Ana Maria Oliveira', cpf: '123.456.789-00', phone: '(11) 98765-4321', status: 'Ativo', lastConsultation: '12/04/2026' },
    { name: 'Carlos Eduardo Souza', cpf: '987.654.321-00', phone: '(11) 99876-5432', status: 'Ativo', lastConsultation: '15/04/2026' },
    { name: 'Juliana Mendes', cpf: '456.789.123-00', phone: '(11) 97654-3210', status: 'Ativo', lastConsultation: '10/04/2026' },
    { name: 'Pedro Gomes Silva', cpf: '789.123.456-00', phone: '(11) 96543-2109', status: 'Ativo', lastConsultation: '08/04/2026' },
    { name: 'Mariana Costa', cpf: '321.654.987-00', phone: '(11) 95432-1098', status: 'Inativo', lastConsultation: '01/03/2026' },
    { name: 'Fernando Alves', cpf: '654.987.321-00', phone: '(11) 94321-0987', status: 'Ativo', lastConsultation: '20/04/2026' },
    { name: 'Beatriz Ferreira', cpf: '159.357.486-00', phone: '(11) 93210-9876', status: 'Inativo', lastConsultation: '15/02/2026' },
    { name: 'Ricardo Mendes', cpf: '753.159.486-00', phone: '(11) 92109-8765', status: 'Ativo', lastConsultation: '25/04/2026' }
];

function normalizeUnit(unitValue) {
    const unitText = String(unitValue || '').trim().toUpperCase();
    const match = unitText.match(/\b([ABC])\b$/);

    if (match) {
        return match[1];
    }

    if (equipePorUnidade[unitText]) {
        return unitText;
    }

    return DEFAULT_UNIT;
}

function getToken() {
    return localStorage.getItem('token');
}

async function fetchJson(url, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal
        });

        const text = await response.text();
        let data = {};

        if (text) {
            try {
                data = JSON.parse(text);
            } catch (parseError) {
                console.error('Resposta invalida da API:', parseError);
                throw new Error('Resposta invalida da API');
            }
        }

        return { response, data };
    } finally {
        clearTimeout(timeoutId);
    }
}

function renderTeamLoading(message = 'Carregando equipe...') {
    const teamGrid = document.getElementById('teamGrid');
    if (!teamGrid) return;

    teamGrid.innerHTML = `
        <div class="loading-message">
            <i class="ph ph-spinner"></i>
            <p>${message}</p>
        </div>
    `;
}

function renderTeamMessage(message) {
    const teamGrid = document.getElementById('teamGrid');
    if (!teamGrid) return;

    teamGrid.innerHTML = `
        <div class="empty-team-message">
            <i class="ph ph-users-three"></i>
            <p>${message}</p>
        </div>
    `;
}

function loadTeam() {
    const normalizedUnit = normalizeUnit(sessionStorage.getItem('professionalUnit'));
    const teamGrid = document.getElementById('teamGrid');
    const unitBadge = document.getElementById('unitBadge');

    if (!teamGrid) return;

    sessionStorage.setItem('professionalUnit', normalizedUnit);
    window.professionalUnit = normalizedUnit;

    if (unitBadge) {
        unitBadge.innerText = `Unidade ${normalizedUnit}`;
    }

    const equipe = equipePorUnidade[normalizedUnit] || [];

    if (equipe.length === 0) {
        renderTeamMessage('Nenhum profissional cadastrado nesta unidade');
        return;
    }

    teamGrid.innerHTML = equipe.map((member) => `
        <div class="team-member-card">
            <div class="team-member-avatar">${member.name.charAt(0)}</div>
            <div class="team-member-name">${member.name}</div>
            <div class="team-member-crm">CRM: ${member.crm}</div>
            <div class="team-member-specialty">${member.specialty}</div>
        </div>
    `).join('');
}

function renderAgendaMessage(message, color = '#666') {
    const tableBody = document.querySelector('.appointments-table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = `
        <tr>
            <td colspan="5" style="text-align: center; padding: 20px; color: ${color};">
                ${message}
            </td>
        </tr>
    `;
}

function populateProfessionalInfo(user) {
    const normalizedUnit = normalizeUnit(user.unit);
    const nameEl = document.getElementById('professionalName');
    const registryEl = document.getElementById('professionalRegistry');
    const unitEl = document.getElementById('professionalUnit');
    const welcomeEl = document.getElementById('welcomeMessage');
    const avatarEl = document.getElementById('professionalAvatar');
    const unitBadge = document.getElementById('unitBadge');

    if (nameEl) nameEl.innerText = user.name || 'Profissional';
    if (registryEl) registryEl.innerText = user.crm || 'Registro';
    if (unitEl) unitEl.innerText = `Unidade ${normalizedUnit}`;
    if (unitBadge) unitBadge.innerText = `Unidade ${normalizedUnit}`;
    if (welcomeEl) welcomeEl.innerText = `Bom dia, ${(user.name || 'Profissional').split(' ')[0]}`;
    if (avatarEl) {
        avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'Profissional')}&background=0073e6&color=fff`;
    }

    window.professionalId = user.medico_id || user.id || null;
    window.clinicaId = user.clinica_id || null;
    window.professionalUnit = normalizedUnit;
    sessionStorage.setItem('professionalUnit', normalizedUnit);
}

async function loadProfessionalInfo() {
    const token = getToken();

    if (!token) {
        window.location.href = 'login-medico.html';
        return false;
    }

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (response.ok) {
            populateProfessionalInfo(data);
            return true;
        }

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('token');
            window.location.href = 'login-medico.html';
            return false;
        }

        throw new Error(data.message || `HTTP ${response.status}`);
    } catch (error) {
        console.error('Erro ao carregar informacoes do profissional:', error);
        renderTeamMessage('Nao foi possivel carregar a equipe agora.');
        return false;
    }
}

function bindSearch() {
    const searchInput = document.querySelector('.search-bar input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const visibleTable = document.querySelector('#agendaSection[style*="block"] .appointments-table tbody') ||
            document.querySelector('.appointments-table tbody');

        if (!visibleTable) return;

        visibleTable.querySelectorAll('tr').forEach((row) => {
            const patientCell = row.querySelector('.patient-td');
            if (!patientCell) return;

            const patientName = patientCell.innerText.toLowerCase();
            row.style.display = patientName.includes(searchTerm) ? '' : 'none';
        });
    });
}

function bindSidebarState() {
    const navLinks = document.querySelectorAll('.sidebar nav a');

    navLinks.forEach((link) => {
        link.addEventListener('click', function handleNavClick(event) {
            if (this.id === 'recordsNavLink') {
                event.preventDefault();
                window.location.href = 'auth-records-access.html';
                return;
            }

            navLinks.forEach((item) => item.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function bindRecordsCard() {
    const recordsCard = document.getElementById('recordsCard');
    if (!recordsCard) return;

    recordsCard.addEventListener('click', () => {
        window.location.href = 'auth-records-access.html';
    });
}

function hideSections() {
    const agendaSection = document.getElementById('agendaSection');
    const pacientesSection = document.getElementById('pacientesSection');

    if (agendaSection) agendaSection.style.display = 'none';
    if (pacientesSection) pacientesSection.style.display = 'none';
}

function showSection(section) {
    hideSections();

    if (section === 'agenda') {
        const agendaSection = document.getElementById('agendaSection');
        if (agendaSection) agendaSection.style.display = 'block';
    }

    if (section === 'pacientes') {
        const pacientesSection = document.getElementById('pacientesSection');
        if (pacientesSection) pacientesSection.style.display = 'block';
    }
}

function updateSidebarActive(element) {
    document.querySelectorAll('.sidebar nav a').forEach((link) => link.classList.remove('active'));
    if (element) element.classList.add('active');
}

function showHome(event) {
    if (event) {
        event.preventDefault();
        updateSidebarActive(event.target.closest('a'));
    }

    hideSections();
}

async function loadAgendaData() {
    const profissionalId = window.professionalId;
    const token = getToken();

    if (!profissionalId) {
        console.error('ID do profissional nao encontrado');
        renderAgendaMessage('Nao foi possivel identificar o profissional logado.', '#e74c3c');
        return;
    }

    renderAgendaMessage('<i class="ph ph-spinner" style="animation: spin 1s linear infinite; display: inline-block;"></i> Carregando agendamentos...');

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/api/agendamentos/profissional/${profissionalId}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        if (data.ok && Array.isArray(data.data)) {
            renderAgenda(data.data);
            return;
        }

        renderAgendaMessage('Nenhum agendamento encontrado');
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        renderAgendaMessage('Erro ao carregar agendamentos. Verifique sua conexao.', '#e74c3c');
    }
}

function renderAgenda(agendamentos) {
    const tableBody = document.querySelector('.appointments-table tbody');
    if (!tableBody) return;

    if (!agendamentos.length) {
        renderAgendaMessage('Nenhum agendamento encontrado');
        return;
    }

    tableBody.innerHTML = agendamentos.map((agendamento) => {
        const data = new Date(agendamento.data_agendamento);
        const hora = Number.isNaN(data.getTime())
            ? '--:--'
            : data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const statusClass = agendamento.status === 'confirmado'
            ? 'confirm'
            : agendamento.status === 'aguardando'
                ? 'waiting'
                : 'pending';
        const statusText = agendamento.status === 'confirmado'
            ? 'Confirmado'
            : agendamento.status === 'aguardando'
                ? 'Aguardando'
                : agendamento.status === 'cancelado'
                    ? 'Cancelado'
                    : agendamento.status === 'realizado'
                        ? 'Realizado'
                        : 'Faltou';

        return `
            <tr>
                <td class="patient-td"><strong>${agendamento.paciente_nome || 'Paciente nao informado'}</strong></td>
                <td>${hora}</td>
                <td>${agendamento.especialidade || 'Consulta'}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
                <td><button class="btn-action" onclick="atenderAgendamento(${agendamento.id})">Atender</button></td>
            </tr>
        `;
    }).join('');
}

function loadPatientsData() {
    try {
        const totalPatients = patientsData.length;
        const activePatients = patientsData.filter((patient) => patient.status === 'Ativo').length;
        const inactivePatients = patientsData.filter((patient) => patient.status === 'Inativo').length;

        const totalEl = document.getElementById('totalPatients');
        const activeEl = document.getElementById('activePatients');
        const inactiveEl = document.getElementById('inactivePatients');
        const tableBody = document.getElementById('patientsTableBody');

        if (!tableBody) {
            console.warn('Elemento patientsTableBody nao encontrado');
            return;
        }

        if (totalEl) totalEl.innerText = totalPatients;
        if (activeEl) activeEl.innerText = activePatients;
        if (inactiveEl) inactiveEl.innerText = inactivePatients;

        tableBody.innerHTML = patientsData.map((patient) => `
            <tr>
                <td><strong>${patient.name}</strong></td>
                <td>${patient.cpf}</td>
                <td>${patient.phone}</td>
                <td><span class="status ${patient.status === 'Ativo' ? 'confirm' : 'pending'}">${patient.status}</span></td>
                <td>${patient.lastConsultation}</td>
                <td><button class="btn-action-small" onclick="alert('Ver prontuario de ${patient.name}')">Ver Prontuario</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar dados dos pacientes:', error);
        const tableBody = document.getElementById('patientsTableBody');
        if (tableBody) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px; color: #e74c3c;">Erro ao carregar pacientes</td></tr>';
        }
    }
}

function openAgendaMedica(event) {
    if (event) {
        event.preventDefault();
        updateSidebarActive(event.target.closest('a'));
    }

    showSection('agenda');
    loadAgendaData();
}

function togglePatientsList(event) {
    if (event) {
        event.preventDefault();
        updateSidebarActive(event.target.closest('a'));
    }

    showSection('pacientes');
    loadPatientsData();
}

async function atenderAgendamento(id) {
    const result = await showPopup('Deseja iniciar o atendimento?', 'confirm');
    if (!result) return;

    try {
        const { response, data } = await fetchJson(`${API_BASE_URL}/api/agendamentos/${id}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'realizado' })
        });

        if (response.ok && data.ok) {
            showPopup('Atendimento finalizado com sucesso!');
            loadAgendaData();
            return;
        }

        showPopup(`Erro ao finalizar atendimento: ${data.message || 'Falha desconhecida.'}`);
    } catch (error) {
        console.error('Erro ao atualizar atendimento:', error);
        showPopup('Erro de conexao');
    }
}

async function handleLogout() {
    const result = await showPopup('Deseja realmente sair?', 'confirm');
    if (!result) return;

    localStorage.removeItem('token');
    window.location.href = 'login-medico.html';
}

async function initializeDashboard() {
    renderTeamLoading();
    loadTeam();
    bindSearch();
    bindSidebarState();
    bindRecordsCard();

    const loaded = await loadProfessionalInfo();
    if (loaded) {
        loadTeam();
    }

    console.log('Dashboard Medico carregado.');
}

document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

window.showHome = showHome;
window.openAgendaMedica = openAgendaMedica;
window.togglePatientsList = togglePatientsList;
window.atenderAgendamento = atenderAgendamento;
window.handleLogout = handleLogout;
