// Função para o clique em Esqueci Senha
function handleResetPassword() {
    const cpf = document.getElementById('cpf').value;
    
    if (!cpf || cpf.length < 14) {
        showPopup("Por favor, digite seu CPF completo para recuperarmos sua senha.");
        document.getElementById('cpf').focus();
    } else {
        // Estilizando o feedback de recuperação
        showPopup(`Processando... Um link de recuperação foi enviado para o e-mail cadastrado no CPF: ${cpf}`);
    }
}

// Máscara de CPF automática (Melhorada para performance)
document.getElementById('cpf').addEventListener('input', function(e) {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    
    e.target.value = v;
});

// Login Form com Feedback Visual e Redirecionamento
document.getElementById('loginFormPaciente').addEventListener('submit', function(e) {
    e.preventDefault();

    const btn = e.target.querySelector('.btn-login');
    const originalText = btn.innerText;

    // 1. Validação básica de segurança
    const cpf = document.getElementById('cpf').value;
    const password = document.getElementById('password').value;

    if (cpf.length < 14 || password.length < 4) {
        showPopup("Por favor, verifique seus dados de acesso.");
        return;
    }

    // 2. Efeito de "Carregando" no botão (Estilo Moderno)
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Acessando...';
    btn.style.opacity = "0.8";
    btn.style.cursor = "not-allowed";

    // 3. Simulação de autenticação e Redirecionamento
    setTimeout(() => {
        // Redireciona para a tela que criamos anteriormente
        window.location.href = "dash-paciente.html"; 
    }, 1500); // 1.5 segundos de espera para parecer real
});

// Adicione este CSS via JS apenas para a animação do ícone de carregar
const style = document.createElement('style');
style.innerHTML = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);