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

async function fetchCnpjData(cnpjDigits) {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`);
    if (!response.ok) {
        throw new Error('Empresa não encontrada ou CNPJ inválido');
    }
    return response.json();
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

            try {
                const companyData = await fetchCnpjData(cnpjDigits);
                const storedData = JSON.parse(localStorage.getItem(`empresa_${cnpjDigits}`) || '{}');
                const fantasyName = storedData.fantasyName || companyData.fantasia || companyData.nome || 'Empresa';
                const cnpjFormatted = formatCnpjDisplay(companyData.cnpj || cnpjDigits);
                sessionStorage.setItem('empresaNomeFantasia', fantasyName);
                sessionStorage.setItem('empresaCnpj', cnpjFormatted);
                sessionStorage.setItem('empresaRazaoSocial', companyData.nome || storedData.legalName || '');
                showPopup("Empresa validada com sucesso! Entrando...");
                setTimeout(() => {
                    window.location.href = "dashboard-empresa.html";
                }, 800);
            } catch (error) {
                const storedData = JSON.parse(localStorage.getItem(`empresa_${cnpjDigits}`) || '{}');
                if (storedData.fantasyName) {
                    const fantasyName = storedData.fantasyName;
                    const cnpjFormatted = formatCnpjDisplay(cnpjDigits);
                    sessionStorage.setItem('empresaNomeFantasia', fantasyName);
                    sessionStorage.setItem('empresaCnpj', cnpjFormatted);
                    sessionStorage.setItem('empresaRazaoSocial', storedData.legalName || '');
                    showPopup("Empresa validada com sucesso! Entrando...");
                    setTimeout(() => {
                        window.location.href = "dashboard-empresa.html";
                    }, 800);
                } else {
                    showPopup("Não foi possível verificar este CNPJ. Verifique os dados e tente novamente.");
                    setLoginButtonLoading(btn, false);
                }
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
