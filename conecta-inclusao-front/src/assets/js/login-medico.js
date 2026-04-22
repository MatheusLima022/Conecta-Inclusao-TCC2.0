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

// Importa o módulo API
let api;
async function loadAPI() {
    if (!api) {
        api = await import('./api.js');
    }
    return api;
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

            const btn = document.querySelector('.btn-login');
            btn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Autenticando...';
            btn.style.opacity = "0.7";
            btn.disabled = true;

            try {
                // Carrega o módulo API
                const apiModule = await loadAPI();
                
                // Tenta fazer login com o CRM
                const loginResult = await apiModule.loginUniversal(registry, password);
                
                if (!loginResult.ok) {
                    showPopup(loginResult.error || "CRM ou senha incorretos.");
                    btn.innerHTML = 'Acessar como Médico';
                    btn.style.opacity = "1";
                    btn.disabled = false;
                    return;
                }

                // Verifica se é um perfil de médico
                if (loginResult.user.profile !== 'medico') {
                    showPopup("Você não tem permissão de médico.");
                    btn.innerHTML = 'Acessar como Médico';
                    btn.style.opacity = "1";
                    btn.disabled = false;
                    return;
                }

                // Armazena dados do médico em sessionStorage
                sessionStorage.setItem('professionalName', loginResult.user.name);
                sessionStorage.setItem('professionalRegistry', formatRegistry(registry));
                sessionStorage.setItem('userId', loginResult.user.id);
                sessionStorage.setItem('userProfile', 'medico');

                showPopup("Acesso autorizado! Redirecionando para o painel...");
                setTimeout(() => {
                    window.location.href = "dashboard-medico.html";
                }, 1500);
            } catch (error) {
                console.error('Erro no login:', error);
                showPopup("Erro ao fazer login. Tente novamente.");
                btn.innerHTML = 'Acessar como Médico';
                btn.style.opacity = "1";
                btn.disabled = false;
            }
        });
    }
});