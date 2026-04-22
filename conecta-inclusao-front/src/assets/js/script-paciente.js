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
let api;
async function loadAPI() {
    if (!api) {
        api = await import('./api.js');
    }
    return api;
}

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
        loginForm.addEventListener('submit', async function(e) {
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

            try {
                // Carrega o módulo API
                const apiModule = await loadAPI();
                
                // Remove formatação do CPF
                const cpfDigits = cpf.replace(/\D/g, '');
                
                // Tenta fazer login com o CPF
                const loginResult = await apiModule.loginUniversal(cpfDigits, password);
                
                if (!loginResult.ok) {
                    showPopup(loginResult.error || "CPF ou senha incorretos.");
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    btn.style.opacity = "1";
                    btn.style.cursor = "pointer";
                    return;
                }

                // Verifica se é um perfil de paciente
                if (loginResult.user.profile !== 'paciente') {
                    showPopup("Você não tem permissão de paciente.");
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    btn.style.opacity = "1";
                    btn.style.cursor = "pointer";
                    return;
                }

                // Armazena dados do paciente em sessionStorage
                sessionStorage.setItem('patientName', loginResult.user.name);
                sessionStorage.setItem('patientCPF', cpf);
                sessionStorage.setItem('userId', loginResult.user.id);
                sessionStorage.setItem('userProfile', 'paciente');

                showPopup("Acesso autorizado! Redirecionando para seu painel...");
                setTimeout(() => {
                    window.location.href = "dash-paciente.html";
                }, 1500);
            } catch (error) {
                console.error('Erro no login:', error);
                showPopup("Erro ao fazer login. Tente novamente.");
                btn.disabled = false;
                btn.innerHTML = originalText;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
            }
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