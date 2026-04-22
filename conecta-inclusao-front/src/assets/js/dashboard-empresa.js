const PROFESSIONALS_STORAGE_KEY = 'companyProfessionals';
const seedProfessionals = [
    { name: 'Julia Martins', role: 'Medica do Trabalho', registry: 'CRM 123456', status: 'Ativo', unit: 'Unidade A', email: 'julia@corphealth.local', bio: '' },
    { name: 'Bruno Souza', role: 'Enfermeiro', registry: 'COREN 789101', status: 'Trabalhando', unit: 'Unidade B', email: 'bruno@corphealth.local', bio: '' },
    { name: 'Paula Ferreira', role: 'Fisioterapeuta', registry: 'CREFITO 112233', status: 'Ferias', unit: 'Unidade C', email: 'paula@corphealth.local', bio: '' }
];

let activeUnitFilter = 'Todas';

function loadStoredProfessionals() {
    try {
        const raw = localStorage.getItem(PROFESSIONALS_STORAGE_KEY);
        if (!raw) {
            return [...seedProfessionals];
        }

        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...seedProfessionals];
    } catch (error) {
        console.error('Erro ao carregar profissionais:', error);
        return [...seedProfessionals];
    }
}

let employeeData = loadStoredProfessionals();

function saveProfessionals() {
    localStorage.setItem(PROFESSIONALS_STORAGE_KEY, JSON.stringify(employeeData));
}

function renderTeamTable() {
    const body = document.getElementById('teamFullTableBody');
    const overviewBody = document.getElementById('teamTableBody');
    if (!body || !overviewBody) return;

    const filteredData = employeeData
        .map((member, index) => ({ member, index }))
        .filter(item => activeUnitFilter === 'Todas' || item.member.unit === activeUnitFilter);

    body.innerHTML = '';
    overviewBody.innerHTML = '';

    filteredData.forEach(({ member, index }) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.name}</td>
            <td>${member.role}</td>
            <td>${member.registry}</td>
            <td><span class="status-dot ${member.status === 'Ativo' ? 'active' : member.status === 'Trabalhando' ? 'working' : 'break'}">${member.status}</span></td>
            <td>${member.unit}</td>
            <td class="table-actions">
                <button class="table-btn inactive-btn" data-index="${index}"><i class="ph ph-user-minus"></i> ${member.status === 'Inativo' ? 'Ativar' : 'Inativar'}</button>
            </td>
        `;
        body.appendChild(row);
    });

    employeeData.slice(0, 3).forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.name}</td>
            <td>${member.role}</td>
            <td><span class="status-dot ${member.status === 'Ativo' ? 'active' : member.status === 'Trabalhando' ? 'working' : 'break'}">${member.status}</span></td>
            <td>${member.unit}</td>
        `;
        overviewBody.appendChild(row);
    });

    attachTeamActionListeners();
}

function updateCounters() {
    const activeCount = employeeData.filter(item => item.status === 'Ativo').length;
    const workingCount = employeeData.filter(item => item.status === 'Trabalhando').length;
    const breakCount = employeeData.filter(item => item.status !== 'Ativo' && item.status !== 'Trabalhando').length;

    const activeCountEl = document.getElementById('activeCount');
    const workingCountEl = document.getElementById('workingCount');
    const breakCountEl = document.getElementById('breakCount');
    const cardActiveCountEl = document.getElementById('cardActiveCount');
    const cardWorkingCountEl = document.getElementById('cardWorkingCount');
    const cardBreakCountEl = document.getElementById('cardBreakCount');

    if (activeCountEl) activeCountEl.innerText = activeCount;
    if (workingCountEl) workingCountEl.innerText = workingCount;
    if (breakCountEl) breakCountEl.innerText = breakCount;
    if (cardActiveCountEl) cardActiveCountEl.innerText = activeCount;
    if (cardWorkingCountEl) cardWorkingCountEl.innerText = workingCount;
    if (cardBreakCountEl) cardBreakCountEl.innerText = breakCount;
}

function getUniqueUnits() {
    return Array.from(new Set(employeeData.map(member => member.unit).filter(Boolean))).sort();
}

function populateUnitOptions() {
    const unitOptions = getUniqueUnits();
    const filterSelect = document.getElementById('unitFilterSelect');
    if (!filterSelect) return;

    filterSelect.innerHTML = '<option value="Todas">Todas</option>' + unitOptions.map(unit => `<option value="${unit}">${unit}</option>`).join('');
}

function attachTeamActionListeners() {
    const inactiveButtons = document.querySelectorAll('.inactive-btn');

    inactiveButtons.forEach(button => button.addEventListener('click', () => {
        const index = Number(button.dataset.index);
        toggleProfessionalActiveState(index);
    }));
}

function toggleProfessionalActiveState(index) {
    const member = employeeData[index];
    if (!member) return;

    const action = member.status === 'Inativo' ? 'ativar' : 'inativar';
    showPopup(`Deseja ${action} ${member.name}?`, 'confirm').then(confirmed => {
        if (!confirmed) return;

        member.status = member.status === 'Inativo' ? 'Ativo' : 'Inativo';
        saveProfessionals();
        updateCounters();
        renderTeamTable();
        showPopup(`Profissional ${action}do com sucesso.`);
    });
}

function applyUnitFilter() {
    const filterSelect = document.getElementById('unitFilterSelect');
    if (!filterSelect) return;

    activeUnitFilter = filterSelect.value;
    renderTeamTable();
}

function loadCompanyInfo() {
    const fantasyName = sessionStorage.getItem('empresaNomeFantasia') || 'CorpHealth';
    const companyCnpj = sessionStorage.getItem('empresaCnpj') || 'CNPJ 00.000.000/0000-00';
    const companyHeaderName = document.getElementById('companyHeaderName');
    const companySidebarName = document.getElementById('companySidebarName');
    const companyHeaderCnpj = document.getElementById('companyHeaderCnpj');
    const companyAvatar = document.getElementById('companyAvatar');

    if (companyHeaderName) companyHeaderName.innerText = fantasyName;
    if (companySidebarName) companySidebarName.innerText = fantasyName;
    if (companyHeaderCnpj) companyHeaderCnpj.innerText = companyCnpj;
    if (companyAvatar) {
        companyAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(fantasyName)}&background=0073e6&color=fff`;
    }
}

function switchTab(tabKey) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.nav-link');

    tabs.forEach(tab => tab.classList.toggle('active', tab.id === tabKey));
    buttons.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabKey));
}

function addOrUpdateProfessional(member) {
    const registry = member.registry?.trim();
    if (!registry) return;

    const existingIndex = employeeData.findIndex(item => item.registry === registry);
    if (existingIndex >= 0) {
        employeeData[existingIndex] = { ...employeeData[existingIndex], ...member };
    } else {
        employeeData.push(member);
    }

    saveProfessionals();
    populateUnitOptions();
    updateCounters();
    renderTeamTable();
}

async function handleLogout() {
    const result = await showPopup('Deseja realmente sair?', 'confirm');
    if (result) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('empresaNomeFantasia');
        sessionStorage.removeItem('empresaCnpj');
        sessionStorage.removeItem('empresaRazaoSocial');
        window.location.href = 'login-empresa.html';
    }
}

window.companyDashboard = {
    addOrUpdateProfessional
};

window.handleLogout = handleLogout;

document.addEventListener('DOMContentLoaded', () => {
    loadCompanyInfo();
    populateUnitOptions();
    renderTeamTable();
    updateCounters();

    const navButtons = document.querySelectorAll('.nav-link');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    const addButton = document.getElementById('btnAddProfessional');
    if (addButton) {
        addButton.addEventListener('click', () => switchTab('register'));
    }

    const filterButton = document.getElementById('btnApplyUnitFilter');
    if (filterButton) {
        filterButton.addEventListener('click', applyUnitFilter);
    }
});
