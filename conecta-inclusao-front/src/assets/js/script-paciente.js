// ===== FUNÇÕES DO MODAL ESQUECEU A SENHA =====
function openForgotPasswordModal(event) {
    event.preventDefault();
    document.getElementById('forgotPasswordModal').style.display = 'flex';
    document.getElementById('forgotEmail').focus();
}

function closeForgotPasswordModal() {
    document.getElementById('forgotPasswordModal').style.display = 'none';
    document.getElementById('forgotEmail').value = '';
}

function sendResetEmail(type) {
    const email = document.getElementById('forgotEmail').value;
    
    if (!email || (type === 'cpf' && email.length < 14)) {
        showPopup("Por favor, digite um CPF válido.");
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Enviando...';
    
    setTimeout(() => {
        showPopup(`Um link de recuperação foi enviado para o e-mail cadastrado no CPF: ${email}. Verifique sua caixa de entrada.`);
        closeForgotPasswordModal();
        btn.disabled = false;
        btn.innerHTML = 'Enviar Link de Recuperação';
    }, 1500);
}

// Fechar modal ao clicar fora dele
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('forgotPasswordModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeForgotPasswordModal();
            }
        });
    }
});

// Máscara de CPF automática (Melhorada para performance)
document.addEventListener('DOMContentLoaded', function() {
    const cpfInput = document.getElementById('cpf');
    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            
            e.target.value = v;
        });
    }

    // Máscara no input do modal também
    const forgotEmailInput = document.getElementById('forgotEmail');
    if (forgotEmailInput) {
        forgotEmailInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 11) v = v.slice(0, 11);
            
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
            
            e.target.value = v;
        });
    }
});

// Login Form com Feedback Visual e Redirecionamento
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginFormPaciente');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const btn = e.target.querySelector('.btn-login');
            const originalText = btn.innerText;

            // 1. Validação básica de segurança
            const cpf = document.getElementById('cpf').value;
            const password = document.getElementById('password').value;

            if (!validarCPF(cpf) || password.length < 4) {
                showPopup("Por favor, verifique seus dados de acesso. CPF inválido.");
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
    }
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