const employeeData = [
    { name: 'Julia Martins', role: 'Médica do Trabalho', registry: 'CRM 123456-SP', status: 'Ativo', unit: 'Unidade A' },
    { name: 'Bruno Souza', role: 'Enfermeiro', registry: 'COREN 789101', status: 'Trabalhando', unit: 'Unidade B' },
    { name: 'Paula Ferreira', role: 'Fisioterapeuta', registry: 'CREFITO 112233', status: 'Férias', unit: 'Unidade C' },
    { name: 'Rafael Lima', role: 'Técnico de Enfermagem', registry: 'CRT 445566', status: 'Ativo', unit: 'Unidade A' },
    { name: 'Marina Alves', role: 'Nutricionista', registry: 'CRN 778899', status: 'Trabalhando', unit: 'Unidade B' }
];

function renderTeamTable() {
    const body = document.getElementById('teamFullTableBody');
    const overviewBody = document.getElementById('teamTableBody');
    if (!body || !overviewBody) return;

    body.innerHTML = '';
    overviewBody.innerHTML = '';

    employeeData.forEach(member => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${member.name}</td>
            <td>${member.role}</td>
            <td>${member.registry}</td>
            <td><span class="status-dot ${member.status === 'Ativo' ? 'active' : member.status === 'Trabalhando' ? 'working' : 'break'}">${member.status}</span></td>
            <td>${member.unit}</td>
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
}

function updateCounters() {
    const activeCount = employeeData.filter(item => item.status === 'Ativo').length;
    const workingCount = employeeData.filter(item => item.status === 'Trabalhando').length;
    const breakCount = employeeData.filter(item => item.status !== 'Ativo' && item.status !== 'Trabalhando').length;

    document.getElementById('activeCount').innerText = activeCount;
    document.getElementById('workingCount').innerText = workingCount;
    document.getElementById('breakCount').innerText = breakCount;
    document.getElementById('cardActiveCount').innerText = activeCount;
    document.getElementById('cardWorkingCount').innerText = workingCount;
    document.getElementById('cardBreakCount').innerText = breakCount;
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

function handleProfessionalRegistration(event) {
    event.preventDefault();

    const data = {
        name: document.getElementById('proName').value.trim(),
        role: document.getElementById('proRole').value.trim(),
        registry: document.getElementById('proRegistry').value.trim(),
        specialty: document.getElementById('proSpecialty').value.trim(),
        email: document.getElementById('proEmail').value.trim(),
        password: document.getElementById('proPassword').value.trim(),
        phone: document.getElementById('proPhone').value.trim(),
        area: document.getElementById('proArea').value.trim(),
        shift: document.getElementById('proShift').value,
        startDate: document.getElementById('proStartDate').value,
        load: document.getElementById('proLoad').value.trim(),
        notes: document.getElementById('proNotes').value.trim()
    };

    if (!data.name || !data.role || !data.registry || !data.specialty || !data.email || !data.password || !data.phone || !data.area || !data.shift || !data.startDate || !data.load) {
        showPopup('Por favor, preencha todos os campos obrigatórios antes de registrar o profissional.');
        return;
    }

    showPopup('Deseja confirmar o cadastro deste profissional?', 'confirm').then(confirmed => {
        if (!confirmed) return;

        const professionals = JSON.parse(localStorage.getItem('profissionais') || '[]');
        professionals.push(data);
        localStorage.setItem('profissionais', JSON.stringify(professionals));

        employeeData.push({
            name: data.name,
            role: data.role,
            registry: data.registry,
            status: 'Ativo',
            unit: 'Unidade Nova'
        });

        renderTeamTable();
        updateCounters();
        document.getElementById('professionalForm').reset();
        showPopup('Profissional cadastrado com sucesso!');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadCompanyInfo();
    renderTeamTable();
    updateCounters();

    const navButtons = document.querySelectorAll('.nav-link');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('btnAddProfessional').addEventListener('click', () => switchTab('register'));
    document.getElementById('professionalForm').addEventListener('submit', handleProfessionalRegistration);
});
