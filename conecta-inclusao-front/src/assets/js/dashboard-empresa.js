const employeeData = [
    { name: 'Julia Martins', role: 'Médica do Trabalho', registry: 'CRM 123456-SP', status: 'Ativo', unit: 'Unidade A' },
    { name: 'Bruno Souza', role: 'Enfermeiro', registry: 'COREN 789101', status: 'Trabalhando', unit: 'Unidade B' },
    { name: 'Paula Ferreira', role: 'Fisioterapeuta', registry: 'CREFITO 112233', status: 'Férias', unit: 'Unidade C' },
    { name: 'Rafael Lima', role: 'Técnico de Enfermagem', registry: 'CRT 445566', status: 'Ativo', unit: 'Unidade A' },
    { name: 'Marina Alves', role: 'Nutricionista', registry: 'CRN 778899', status: 'Trabalhando', unit: 'Unidade B' }
];

let currentEditIndex = null;
let activeUnitFilter = 'Todas';

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
                <button class="table-btn edit-btn" data-index="${index}"><i class="ph ph-pencil"></i> Editar</button>
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

    document.getElementById('activeCount').innerText = activeCount;
    document.getElementById('workingCount').innerText = workingCount;
    document.getElementById('breakCount').innerText = breakCount;
    document.getElementById('cardActiveCount').innerText = activeCount;
    document.getElementById('cardWorkingCount').innerText = workingCount;
    document.getElementById('cardBreakCount').innerText = breakCount;
}

function getUniqueUnits() {
    return Array.from(new Set(employeeData.map(member => member.unit).filter(Boolean))).sort();
}

function populateUnitOptions() {
    const unitOptions = getUniqueUnits();
    const filterSelect = document.getElementById('unitFilterSelect');
    const dataList = document.getElementById('unitOptions');

    if (!filterSelect || !dataList) return;

    filterSelect.innerHTML = '<option value="Todas">Todas</option>' + unitOptions.map(unit => `<option value="${unit}">${unit}</option>`).join('');
    dataList.innerHTML = unitOptions.map(unit => `<option value="${unit}"></option>`).join('');
}

function attachTeamActionListeners() {
    const editButtons = document.querySelectorAll('.edit-btn');
    const inactiveButtons = document.querySelectorAll('.inactive-btn');

    editButtons.forEach(button => button.addEventListener('click', () => {
        const index = Number(button.dataset.index);
        editProfessional(index);
    }));

    inactiveButtons.forEach(button => button.addEventListener('click', () => {
        const index = Number(button.dataset.index);
        toggleProfessionalActiveState(index);
    }));
}

function editProfessional(index) {
    const member = employeeData[index];
    if (!member) return;

    currentEditIndex = index;
    switchTab('register');

    document.getElementById('proName').value = member.name;
    document.getElementById('proRole').value = member.role;
    document.getElementById('proRegistry').value = member.registry;
    document.getElementById('proSpecialty').value = member.specialty || '';
    document.getElementById('proEmail').value = member.email || '';
    document.getElementById('proPassword').value = member.password || '';
    document.getElementById('proPhone').value = member.phone || '';
    document.getElementById('proUnit').value = member.unit || '';
    document.getElementById('proArea').value = member.area || '';
    document.getElementById('proShift').value = member.shift || '';
    document.getElementById('proStartDate').value = member.startDate || '';
    document.getElementById('proLoad').value = member.load || '';
    document.getElementById('proNotes').value = member.notes || '';

    const formHeader = document.querySelector('#register .section-header h2');
    if (formHeader) formHeader.innerText = 'Editar Profissional';
    const submitBtn = document.querySelector('#professionalForm button[type="submit"]');
    if (submitBtn) submitBtn.innerText = 'Salvar Alterações';
}

function toggleProfessionalActiveState(index) {
    const member = employeeData[index];
    if (!member) return;

    const action = member.status === 'Inativo' ? 'ativar' : 'inativar';
    showPopup(`Deseja ${action} ${member.name}?`, 'confirm').then(confirmed => {
        if (!confirmed) return;
        member.status = member.status === 'Inativo' ? 'Ativo' : 'Inativo';
        updateCounters();
        renderTeamTable();
        showPopup(`Profissional ${action}do com sucesso.`);
    });
}

function resetProfessionalForm() {
    currentEditIndex = null;
    document.getElementById('professionalForm').reset();
    const formHeader = document.querySelector('#register .section-header h2');
    if (formHeader) formHeader.innerText = 'Cadastrar Profissional';
    const submitBtn = document.querySelector('#professionalForm button[type="submit"]');
    if (submitBtn) submitBtn.innerText = 'Cadastrar Profissional';
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
        unit: document.getElementById('proUnit').value.trim(),
        area: document.getElementById('proArea').value.trim(),
        shift: document.getElementById('proShift').value,
        startDate: document.getElementById('proStartDate').value,
        load: document.getElementById('proLoad').value.trim(),
        notes: document.getElementById('proNotes').value.trim()
    };

    if (!data.name || !data.role || !data.registry || !data.specialty || !data.email || !data.password || !data.phone || !data.area || !data.shift || !data.startDate || !data.load || !data.unit) {
        showPopup('Por favor, preencha todos os campos obrigatórios antes de registrar o profissional.');
        return;
    }

    showPopup(currentEditIndex === null ? 'Deseja confirmar o cadastro deste profissional?' : 'Deseja salvar as alterações deste profissional?', 'confirm').then(confirmed => {
        if (!confirmed) return;

        const professionals = JSON.parse(localStorage.getItem('profissionais') || '[]');
        if (currentEditIndex === null) {
            professionals.push(data);
            employeeData.push({
                name: data.name,
                role: data.role,
                registry: data.registry,
                status: 'Ativo',
                unit: data.unit,
                specialty: data.specialty,
                email: data.email,
                password: data.password,
                phone: data.phone,
                area: data.area,
                shift: data.shift,
                startDate: data.startDate,
                load: data.load,
                notes: data.notes
            });
        } else {
            professionals[currentEditIndex] = data;
            employeeData[currentEditIndex] = {
                name: data.name,
                role: data.role,
                registry: data.registry,
                status: employeeData[currentEditIndex].status,
                unit: data.unit,
                specialty: data.specialty,
                email: data.email,
                password: data.password,
                phone: data.phone,
                area: data.area,
                shift: data.shift,
                startDate: data.startDate,
                load: data.load,
                notes: data.notes
            };
        }

        localStorage.setItem('profissionais', JSON.stringify(professionals));
        const wasEditing = currentEditIndex !== null;
        populateUnitOptions();
        renderTeamTable();
        updateCounters();
        resetProfessionalForm();
        showPopup(wasEditing ? 'Alterações salvas!' : 'Profissional cadastrado com sucesso!');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadCompanyInfo();
    populateUnitOptions();
    renderTeamTable();
    updateCounters();

    const navButtons = document.querySelectorAll('.nav-link');
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    document.getElementById('btnAddProfessional').addEventListener('click', () => {
        resetProfessionalForm();
        switchTab('register');
    });
    document.getElementById('professionalForm').addEventListener('submit', handleProfessionalRegistration);
    document.getElementById('btnApplyUnitFilter').addEventListener('click', applyUnitFilter);
});
