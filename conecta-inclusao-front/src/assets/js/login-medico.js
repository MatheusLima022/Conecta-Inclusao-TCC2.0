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

    if (!email || email.length < 7) {
        showPopup("Por favor, digite um Registro válido.");
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Enviando...';

    setTimeout(() => {
        showPopup(`Um link de recuperação foi enviado para o e-mail cadastrado no Registro: ${email}. Verifique sua caixa de entrada.`);
        closeForgotPasswordModal();
        btn.disabled = false;
        btn.innerHTML = 'Enviar Link de Recuperação';
    }, 1500);
}

function formatRegistry(value) {
    let v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.startsWith('CRM')) {
        v = v.replace(/^CRM/, 'CRM ');
        v = v.replace(/(\d{6})(\d{1,2})$/, '$1-$2');
    } else if (v.startsWith('COREN')) {
        v = v.replace(/^COREN/, 'COREN ');
    } else if (v.startsWith('CREFITO')) {
        v = v.replace(/^CREFITO/, 'CREFITO ');
    }
    return v;
}

async function loginMedicoAPI(identifier, password) {
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

    // Máscara para o registro
    const registryInput = document.getElementById('crm');
    if (registryInput) {
        // Pré-preencher CRM se vindo do cadastro
        const lastCRM = localStorage.getItem('lastCRM');
        if (lastCRM) {
            registryInput.value = lastCRM;
            localStorage.removeItem('lastCRM'); // Limpar após usar
            localStorage.removeItem('lastRegisteredCRM');
        }
        
        registryInput.addEventListener('input', function(e) {
            e.target.value = formatRegistry(e.target.value);
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

// Form de login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(event) {
            event.preventDefault();

            const registry = document.getElementById('crm').value.trim();
            const password = document.getElementById('password').value;

            if (!registry || !password) {
                showPopup('Por favor, preencha o registro e a senha.');
                return;
            }

            const registryNormalized = registry.replace(/[\s-]/g, '').toUpperCase();

            // Efeito visual no botão
            const btn = document.querySelector('.btn-login');
            btn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Autenticando...';
            btn.style.opacity = "0.7";
            btn.disabled = true;

            const result = await loginMedicoAPI(registryNormalized, password);

            if (result.ok) {
                // Salvar token e dados
                localStorage.setItem('token', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));

                // Store in sessionStorage
                sessionStorage.setItem('professionalName', result.data.user.name);
                sessionStorage.setItem('professionalRegistry', formatRegistry(registryNormalized));
                sessionStorage.setItem('professionalUnit', result.data.user.unit || 'Unidade não definida');

                showPopup("Acesso autorizado! Redirecionando para o painel...");
                setTimeout(() => {
                    window.location.href = "dashboard-medico.html";
                }, 800);
            } else {
                showPopup(result.data.message || "Registro ou senha incorretos.");
                btn.innerHTML = 'Acessar como Médico';
                btn.style.opacity = "";
                btn.disabled = false;
            }
        });
    }
});