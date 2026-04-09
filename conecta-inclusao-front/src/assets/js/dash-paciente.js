// Funções de Modal
function openModal() { document.getElementById('appointmentModal').style.display = 'flex'; }
function closeModal() { document.getElementById('appointmentModal').style.display = 'none'; }

// Lógica de Sair
async function handleLogout() {
    const result = await showPopup("Deseja realmente sair?", 'confirm');
    if (result) {
        window.location.href = "login-paciente.html";
    }
}

// Filtro de Busca
async function filterResults() {
    const spec = document.getElementById('searchSpecialty').value;
    const btn = document.querySelector('.btn-search-filter');
    
    btn.innerText = "Buscando...";
    setTimeout(async () => {
        await showPopup(`Filtro aplicado para: ${spec || 'Todas as áreas'}.`);
        btn.innerHTML = '<i class="ph ph-magnifying-glass"></i> Filtrar';
    }, 800);
}

// Lógica de Cancelamento (Regra de 2 semanas / 14 dias)
async function cancelAppointment(button) {
    const card = button.closest('.appointment-card');
    const dateStr = card.getAttribute('data-date'); 
    
    const appointmentDate = new Date(dateStr);
    const today = new Date();
    
    // Diferença em milissegundos convertida para dias
    const diffInTime = appointmentDate.getTime() - today.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));

    if (diffInDays < 14) {
        await showPopup("Atenção: Por políticas de segurança, cancelamentos devem ser feitos com no mínimo 2 semanas de antecedência.");
    } else {
        const result = await showPopup("Tem certeza que deseja desmarcar esta consulta?", 'confirm');
        if (result) {
            card.remove();
            await showPopup("Consulta removida com sucesso.");
        }
    }
}

// Criar Agendamento (Simulado)
document.getElementById('formNewAppointment').addEventListener('submit', async function(e) {
    e.preventDefault();
    const date = document.getElementById('modalDate').value;
    const spec = document.getElementById('modalSpec').value;

    await showPopup(`Sucesso! Consulta de ${spec} agendada para ${date}.`);
    closeModal();
});