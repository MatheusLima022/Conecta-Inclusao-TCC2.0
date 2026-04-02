// Abrir/Fechar Modal
function openModal() { document.getElementById('appointmentModal').style.display = 'flex'; }
function closeModal() { document.getElementById('appointmentModal').style.display = 'none'; }

// Lógica de Cancelamento com Regra de 2 Semanas
function cancelAppointment(button) {
    const card = button.closest('.appointment-card');
    const dateStr = card.getAttribute('data-date'); // Formato YYYY-MM-DD
    
    const appointmentDate = new Date(dateStr);
    const today = new Date();
    
    // Calcula a diferença em milissegundos
    const diffInTime = appointmentDate.getTime() - today.getTime();
    // Converte para dias
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));

    if (diffInDays < 14) {
        alert("Ops! Cancelamentos só podem ser feitos com no mínimo 14 dias (2 semanas) de antecedência. Entre em contato com a central.");
    } else {
        if (confirm("Tem certeza que deseja desmarcar esta consulta?")) {
            card.style.opacity = '0';
            setTimeout(() => card.remove(), 300);
            alert("Consulta desmarcada com sucesso.");
        }
    }
}

// Lógica de Criação (Simulada)
document.getElementById('formNewAppointment').addEventListener('submit', function(e) {
    e.preventDefault();
    const dateVal = document.getElementById('newDate').value;
    
    alert(`Consulta agendada para o dia ${dateVal}!`);
    closeModal();
    // Aqui você adicionaria a lógica para criar um novo card no DOM
});

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('appointmentModal');
    if (event.target == modal) closeModal();
}

