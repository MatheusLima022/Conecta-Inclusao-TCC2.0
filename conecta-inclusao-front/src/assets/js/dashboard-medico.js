function loadProfessionalInfo() {
    const name = sessionStorage.getItem('professionalName') || 'Dr. Nome';
    const registry = sessionStorage.getItem('professionalRegistry') || 'Registro';
    const unit = sessionStorage.getItem('professionalUnit') || 'Unidade não definida';

    const nameEl = document.getElementById('professionalName');
    const registryEl = document.getElementById('professionalRegistry');
    const unitEl = document.getElementById('professionalUnit');
    const welcomeEl = document.getElementById('welcomeMessage');
    const avatarEl = document.getElementById('professionalAvatar');

    if (nameEl) nameEl.innerText = name;
    if (registryEl) registryEl.innerText = registry;
    if (unitEl) unitEl.innerText = unit;
    if (welcomeEl) welcomeEl.innerText = `Bom dia, ${name.split(' ')[0]}`;
    if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0073e6&color=fff`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfessionalInfo();
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
            // Remove active de todos
            navLinks.forEach(l => l.classList.remove('active'));
            // Adiciona no clicado
            this.classList.add('active');
        });
    });

    // 4. Notificação Simples ao Carregar
    console.log("Dashboard Médico carregado. Bem-vindo, Dr. Ricardo.");
});