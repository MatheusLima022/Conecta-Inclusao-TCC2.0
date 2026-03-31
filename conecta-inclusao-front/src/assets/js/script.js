// Função de Navegação com delay para animação de saída suave
function navTo(tipo) {
    const targetUrl = tipo === 'medico' ? 'login-medico.html' : 'login-paciente.html';
    
    // Animação de fade-out do contêiner principal
    const container = document.querySelector('.bio-portal-container');
    container.style.opacity = '0';
    container.style.transform = 'translateY(20px)';
    container.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';

    setTimeout(() => {
        window.location.href = targetUrl;
    }, 500); // Meio segundo para a animação
}

console.log("BioPortal carregado. Próxima Geração de Acesso à Saúde.");