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

    if (!email || (type === 'cnpj' && email.length < 18)) {
        showPopup("Por favor, digite um CNPJ válido.");
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Enviando...';

    setTimeout(() => {
        showPopup(`Um link de recuperação foi enviado para o e-mail cadastrado no CNPJ: ${email}. Verifique sua caixa de entrada.`);
        closeForgotPasswordModal();
        btn.disabled = false;
        btn.innerHTML = 'Enviar Link de Recuperação';
    }, 1500);
}

function formatCnpjDigits(value) {
    return value.replace(/\D/g, '').slice(0, 14);
}

function formatCnpjDisplay(value) {
    let v = value.replace(/\D/g, '');
    v = v.replace(/(\d{2})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1/$2');
    v = v.replace(/(\d{4})(\d{1,2})$/, '$1-$2');
    return v;
}

async function loginEmpresaAPI(identifier, password) {
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

function setLoginButtonLoading(button, loading) {
    if (loading) {
        button.disabled = true;
        button.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Verificando...';
        button.style.opacity = '0.8';
        button.style.cursor = 'not-allowed';
    } else {
        button.disabled = false;
        button.innerHTML = 'Acessar como Empresa';
        button.style.opacity = '';
        button.style.cursor = '';
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

// Máscara de CNPJ automática
document.addEventListener('DOMContentLoaded', function() {
    const cnpjInput = document.getElementById('cnpj');
    if (cnpjInput) {
        // Pré-preencher CNPJ se vindo do cadastro
        const lastCNPJ = localStorage.getItem('lastCNPJ');
        if (lastCNPJ) {
            cnpjInput.value = lastCNPJ;
            localStorage.removeItem('lastCNPJ'); // Limpar após usar
            localStorage.removeItem('lastRegisteredCNPJ');
        }
        
        cnpjInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 14) v = v.slice(0, 14);

            v = v.replace(/(\d{2})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1/$2");
            v = v.replace(/(\d{4})(\d{1,2})$/, "$1-$2");

            e.target.value = v;
        });
    }

    // Máscara no input do modal também
    const forgotEmailInput = document.getElementById('forgotEmail');
    if (forgotEmailInput) {
        forgotEmailInput.addEventListener('input', function(e) {
            let v = e.target.value.replace(/\D/g, "");
            if (v.length > 14) v = v.slice(0, 14);

            v = v.replace(/(\d{2})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1.$2");
            v = v.replace(/(\d{3})(\d)/, "$1/$2");
            v = v.replace(/(\d{4})(\d{1,2})$/, "$1-$2");

            e.target.value = v;
        });
    }
});

// Login Form com Feedback Visual
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginFormEmpresa');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            const btn = e.target.querySelector('.btn-login');
            const cnpj = document.getElementById('cnpj').value;
            const password = document.getElementById('password').value;

            if (cnpj.length < 18 || password.length < 4) {
                showPopup("Por favor, verifique seus dados de acesso.");
                return;
            }

            const cnpjDigits = formatCnpjDigits(cnpj);
            if (cnpjDigits.length !== 14) {
                showPopup("Por favor, digite um CNPJ válido.");
                return;
            }

            setLoginButtonLoading(btn, true);

            const result = await loginEmpresaAPI(cnpjDigits, password);

            if (result.ok) {
                // Salvar token e dados do usuário
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));

                // Salvar dados da empresa na sessão
                sessionStorage.setItem('empresaNomeFantasia', result.data.user.name);
                sessionStorage.setItem('empresaCnpj', formatCnpjDisplay(cnpjDigits));
                sessionStorage.setItem('empresaRazaoSocial', result.data.user.razaoSocial || '');

                showPopup("Login realizado com sucesso! Entrando...");
                setTimeout(() => {
                    window.location.href = "dashboard-empresa.html";
                }, 800);
            } else {
                showPopup(result.data.message || "Credenciais inválidas. Verifique seus dados.");
                setLoginButtonLoading(btn, false);
            }
        });
    }
});

// CSS para animação
const style = document.createElement('style');
style.innerHTML = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
