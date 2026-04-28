function loadProfessionalInfo() {
    const name = sessionStorage.getItem('professionalName') || 'Dr. Nome';
    const registry = sessionStorage.getItem('professionalRegistry') || 'Registro';
    const unit = sessionStorage.getItem('professionalUnit') || 'Unidade não definida';

    const nameEl = document.getElementById('professionalName');
    const registryEl = document.getElementById('professionalRegistry');
    const unitEl = document.getElementById('professionalUnit');
    const welcomeEl = document.getElementById('welcomeMessage');
    const avatarEl = document.getElementById('professionalAvatar');
    const unitBadge = document.getElementById('unitBadge');

    if (nameEl) nameEl.innerText = name;
    if (registryEl) registryEl.innerText = registry;
    if (unitEl) unitEl.innerText = unit;
    if (unitBadge) unitBadge.innerText = `Unidade ${unit}`;
    if (welcomeEl) welcomeEl.innerText = `Bom dia, ${name.split(' ')[0]}`;
    if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0073e6&color=fff`;
}

// Dados simulados de equipes por unidade
const equipePorUnidade = {
    'A': [
        { name: 'Dr. Ricardo Silva', crm: 'MED001', specialty: 'Cardiologia' },
        { name: 'Dra. Ana Costa', crm: 'MED002', specialty: 'Pediatria' },
        { name: 'Dr. Pedro Santos', crm: 'MED003', specialty: 'Ortopedia' }
    ],
    'B': [
        { name: 'Dr. João Oliveira', crm: 'MED004', specialty: 'Neurologia' },
        { name: 'Dra. Maria Gomes', crm: 'MED005', specialty: 'Psiquiatria' },
        { name: 'Dr. Carlos Ferreira', crm: 'MED006', specialty: 'Dermatologia' }
    ],
    'C': [
        { name: 'Dr. Luis Mendes', crm: 'MED007', specialty: 'Pneumologia' },
        { name: 'Dra. Patricia Rocha', crm: 'MED008', specialty: 'Ginecologia' },
        { name: 'Dr. Fernando Costa', crm: 'MED009', specialty: 'Gastroenterologia' }
    ]
};

function loadTeam() {
    const unit = sessionStorage.getItem('professionalUnit') || 'A';
    const teamGrid = document.getElementById('teamGrid');
    
    if (!teamGrid) return;

    const equipe = equipePorUnidade[unit] || [];

    if (equipe.length === 0) {
        teamGrid.innerHTML = `
            <div class="empty-team-message">
                <i class="ph ph-users-three"></i>
                <p>Nenhum profissional cadastrado nesta unidade</p>
            </div>
        `;
        return;
    }

    teamGrid.innerHTML = equipe.map(member => `
        <div class="team-member-card">
            <div class="team-member-avatar">${member.name.charAt(0)}</div>
            <div class="team-member-name">${member.name}</div>
            <div class="team-member-crm">CRM: ${member.crm}</div>
            <div class="team-member-specialty">${member.specialty}</div>
        </div>
    `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfessionalInfo();
    loadTeam();
    const searchInput = document.querySelector('.search-bar input');
    const tableRows = document.querySelectorAll('.appointments-table tbody tr');

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();

        tableRows.forEach(row => {
            const patientName = row.querySelector('.patient-td').innerText.toLowerCase();
            if (patientName.includes(searchTerm)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    });

    // 2. Interatividade nos Botões de Ação (Atender)
    const actionButtons = document.querySelectorAll('.btn-action');

    actionButtons.forEach(btn => {
        btn.addEventListener('click', async function() {
            const row = this.closest('tr');
            const patientName = row.querySelector('.patient-td strong').innerText;
            const statusSpan = row.querySelector('.status');

            // Simula o início do atendimento
            if (this.innerText === 'Atender') {
                const confirmar = await showPopup(`Deseja iniciar o atendimento de ${patientName}?`, 'confirm');
                
                if (confirmar) {
                    this.innerText = 'Finalizar';
                    this.style.backgroundColor = '#ef4444';
                    this.style.color = 'white';
                    this.style.borderColor = '#ef4444';
                    
                    statusSpan.innerText = 'Em Atendimento';
                    statusSpan.className = 'status waiting'; // Amarelo
                }
            } else {
                // Simula a finalização
                await showPopup(`Atendimento de ${patientName} finalizado com sucesso!`);
                row.style.opacity = '0.5';
                this.disabled = true;
                this.innerText = 'Concluído';
                statusSpan.innerText = 'Finalizado';
                statusSpan.className = 'status pending'; // Cinza
            }
        });
    });

    // 3. Navegação da Sidebar (Troca de classe Active)
    const navLinks = document.querySelectorAll('.sidebar nav a');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Se for o link de prontuários, redirecionar para autenticação
            if (this.id === 'recordsNavLink') {
                e.preventDefault();
                window.location.href = 'auth-records-access.html';
                return;
            }
            
            // Remove active de todos
            navLinks.forEach(l => l.classList.remove('active'));
            // Adiciona no clicado
            this.classList.add('active');
        });
    });

    // 4. Card de Prontuários - Redirecionar para autenticação
    const recordsCard = document.getElementById('recordsCard');
    if (recordsCard) {
        recordsCard.addEventListener('click', function() {
            window.location.href = 'auth-records-access.html';
        });
    }

    // 5. Notificação Simples ao Carregar
    console.log("Dashboard Médico carregado. Bem-vindo, Dr. Ricardo.");
});

// ===== FUNÇÕES PARA AGENDA E PACIENTES =====

// Função para mostrar a página inicial
function showHome(event) {
    event.preventDefault();
    updateSidebarActive(event.target.closest('a'));
    
    // Esconder todas as seções específicas
    document.getElementById('agendaSection').style.display = 'none';
    document.getElementById('pacientesSection').style.display = 'none';
}

// Função para abrir a agenda médica
function openAgendaMedica(event) {
    if (event) {
        event.preventDefault();
        updateSidebarActive(event.target.closest('a'));
    }
    
    showSection('agenda');
    loadAgendaData();
}

// Função para toggle da lista de pacientes
function togglePatientsList(event) {
    if (event) {
        event.preventDefault();
        updateSidebarActive(event.target.closest('a'));
    }
    
    showSection('pacientes');
    loadPatientsData();
}

// Função para mostrar/esconder seções
function showSection(section) {
    // Esconder todas
    document.getElementById('agendaSection').style.display = 'none';
    document.getElementById('pacientesSection').style.display = 'none';
    
    // Mostrar a selecionada
    if (section === 'agenda') {
        document.getElementById('agendaSection').style.display = 'block';
    } else if (section === 'pacientes') {
        document.getElementById('pacientesSection').style.display = 'block';
    }
}

// Função para atualizar o link ativo no sidebar
function updateSidebarActive(element) {
    document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
    if (element) element.classList.add('active');
}

// Função para carregar dados da agenda
function loadAgendaData() {
    const agendaContent = document.querySelector('.appointments-table tbody');
    if (!agendaContent) return;
    
    // Os dados já estão na tabela, então não precisa fazer nada
    console.log("Agenda carregada");
}

// Dados de pacientes
const patientsData = [
    { name: 'Ana Maria Oliveira', cpf: '123.456.789-00', phone: '(11) 98765-4321', status: 'Ativo', lastConsultation: '12/04/2026' },
    { name: 'Carlos Eduardo Souza', cpf: '987.654.321-00', phone: '(11) 99876-5432', status: 'Ativo', lastConsultation: '15/04/2026' },
    { name: 'Juliana Mendes', cpf: '456.789.123-00', phone: '(11) 97654-3210', status: 'Ativo', lastConsultation: '10/04/2026' },
    { name: 'Pedro Gomes Silva', cpf: '789.123.456-00', phone: '(11) 96543-2109', status: 'Ativo', lastConsultation: '08/04/2026' },
    { name: 'Mariana Costa', cpf: '321.654.987-00', phone: '(11) 95432-1098', status: 'Inativo', lastConsultation: '01/03/2026' },
    { name: 'Fernando Alves', cpf: '654.987.321-00', phone: '(11) 94321-0987', status: 'Ativo', lastConsultation: '20/04/2026' },
    { name: 'Beatriz Ferreira', cpf: '159.357.486-00', phone: '(11) 93210-9876', status: 'Inativo', lastConsultation: '15/02/2026' },
    { name: 'Ricardo Mendes', cpf: '753.159.486-00', phone: '(11) 92109-8765', status: 'Ativo', lastConsultation: '25/04/2026' },
];

// Função para carregar dados dos pacientes
function loadPatientsData() {
    const totalPatients = patientsData.length;
    const activePatients = patientsData.filter(p => p.status === 'Ativo').length;
    const inactivePatients = patientsData.filter(p => p.status === 'Inativo').length;

    document.getElementById('totalPatients').innerText = totalPatients;
    document.getElementById('activePatients').innerText = activePatients;
    document.getElementById('inactivePatients').innerText = inactivePatients;

    const tableBody = document.getElementById('patientsTableBody');
    tableBody.innerHTML = patientsData.map(patient => `
        <tr>
            <td><strong>${patient.name}</strong></td>
            <td>${patient.cpf}</td>
            <td>${patient.phone}</td>
            <td><span class="status ${patient.status === 'Ativo' ? 'confirm' : 'pending'}">${patient.status}</span></td>
            <td>${patient.lastConsultation}</td>
            <td><button class="btn-action-small" onclick="alert('Ver prontuário de ${patient.name}')">Ver Prontuário</button></td>
        </tr>
    `).join('');
}

async function handleLogout() {
    const result = await showPopup('Deseja realmente sair?', 'confirm');
    if (result) {
        window.location.href = 'login-medico.html';
    }
}

window.handleLogout = handleLogout;