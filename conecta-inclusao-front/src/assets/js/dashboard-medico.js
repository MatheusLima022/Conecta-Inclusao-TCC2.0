document.addEventListener('DOMContentLoaded', () => {
    // 1. Lógica de Busca de Pacientes
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