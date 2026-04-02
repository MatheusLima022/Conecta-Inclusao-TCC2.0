// Funções de Modal
function openModal() { document.getElementById('appointmentModal').style.display = 'flex'; }
function closeModal() { document.getElementById('appointmentModal').style.display = 'none'; }

// Lógica de Sair
function handleLogout() {
    if (confirm("Deseja realmente sair?")) {
        window.location.href = "login-paciente.html";
    }
}

// Filtro de Busca
function filterResults() {
    const spec = document.getElementById('searchSpecialty').value;
    const btn = document.querySelector('.btn-search-filter');
    
    btn.innerText = "Buscando...";
    setTimeout(() => {
        alert(`Filtro aplicado para: ${spec || 'Todas as áreas'}.`);
        btn.innerHTML = '<i class="ph ph-magnifying-glass"></i> Filtrar';
    }, 800);
}

// Lógica de Cancelamento (Regra de 2 semanas / 14 dias)
function cancelAppointment(button) {
    const card = button.closest('.appointment-card');
    const dateStr = card.getAttribute('data-date'); 
    
    const appointmentDate = new Date(dateStr);
    const today = new Date();
    
    // Diferença em milissegundos convertida para dias
    const diffInTime = appointmentDate.getTime() - today.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));

    if (diffInDays < 14) {
        alert("Atenção: Por políticas de segurança, cancelamentos devem ser feitos com no mínimo 2 semanas de antecedência.");
    } else {
        if (confirm("Tem certeza que deseja desmarcar esta consulta?")) {
            card.remove();
            alert("Consulta removida com sucesso.");
        }
    }
}

// Criar Agendamento (Simulado)
document.getElementById('formNewAppointment').addEventListener('submit', function(e) {
    e.preventDefault();
    const date = document.getElementById('modalDate').value;
    const spec = document.getElementById('modalSpec').value;

    alert(`Sucesso! Consulta de ${spec} agendada para ${date}.`);
    closeModal();
});