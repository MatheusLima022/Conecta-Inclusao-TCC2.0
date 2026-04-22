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

    const btn = document.querySelector('#forgotPasswordModal .forgot-btn');
    if (!btn) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Enviando...';

    setTimeout(() => {
        showPopup(`Um link de recuperação foi enviado para o e-mail cadastrado no CPF: ${email}. Verifique sua caixa de entrada.`);
        closeForgotPasswordModal();
        btn.disabled = false;
        btn.innerHTML = 'Enviar Link de Recuperação';
    }, 1500);
}

async function loginPacienteAPI(identifier, password) {
    try {
        const response = await fetch('http://localhost:3000/auth/login/universal', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ identifier, password })
        });
        const result = await response.json();
        return { ok: response.ok, data: result };
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { ok: false, data: { message: 'Erro de conexão' } };
    }
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
        // Pré-preencher CPF se vindo do cadastro
        const lastCPF = localStorage.getItem('lastCPF');
        if (lastCPF) {
            cpfInput.value = lastCPF;
            localStorage.removeItem('lastCPF'); // Limpar após usar
            localStorage.removeItem('lastRegisteredCPF');
        }
        
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

            const cpfDigits = cpf.replace(/\D/g, '');
            const result = await loginPacienteAPI(cpfDigits, password);

            if (result.ok) {
                // Salvar token e dados
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));

                // Redireciona para a tela
                setTimeout(() => {
                    window.location.href = "dash-paciente.html";
                }, 800);
            } else {
                showPopup(result.data.message || "CPF ou senha incorretos.");
                btn.innerHTML = originalText;
                btn.disabled = false;
                btn.style.opacity = "";
                btn.style.cursor = "";
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
