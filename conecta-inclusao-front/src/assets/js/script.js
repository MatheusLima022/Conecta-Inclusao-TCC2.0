// Função de Navegação com delay para animação de saída suave
function navTo(tipo) {
    let targetUrl;
    switch(tipo) {
        case 'medico':
            targetUrl = 'login-medico.html';
            break;
        case 'empresa':
            targetUrl = 'login-empresa.html'; // Placeholder, página a ser criada
            break;
        case 'paciente':
            targetUrl = 'login-paciente.html';
            break;
        default:
            targetUrl = 'lndex.html';
    }
    
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