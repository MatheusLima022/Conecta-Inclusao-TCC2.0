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