// Importa o módulo API (compatível com navegadores modernos)
let api;

// Carrega a API dinamicamente
async function loadAPI() {
    if (!api) {
        api = await import('./api.js');
    }
    return api;
}

// Máscara de CRM automática
function applyCRMMask(value) {
    let v = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (v.length > 7) v = v.slice(0, 7);
    return v;
}

async function handleDoctorRegistration(event) {
    event.preventDefault();
    const submitButton = document.querySelector('.btn-login');

    const name = document.getElementById('name').value.trim();
    const crm = document.getElementById('crm').value.trim();
    const especialidade = document.getElementById('especialidade').value.trim();
    const bio = document.getElementById('bio').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validações
    if (!name || !crm || !password || !confirmPassword) {
        showPopup('Preencha todos os campos obrigatórios.');
        return;
    }

    if (crm.length < 4) {
        showPopup('CRM inválido. Deve ter no mínimo 4 caracteres.');
        return;
    }

    if (password.length < 6) {
        showPopup('A senha deve ter no mínimo 6 caracteres.');
        return;
    }

    if (password !== confirmPassword) {
        showPopup('As senhas não coincidem.');
        return;
    }

    showPopup('Deseja confirmar o cadastro?', 'confirm').then(async confirmed => {
        if (!confirmed) return;

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Cadastrando...';

        try {
            const apiModule = await loadAPI();
            
            const result = await apiModule.registerDoctor(
                crm.toUpperCase(),
                password,
                name,
                especialidade,
                null // clinicaId - opcional
            );

            if (!result.ok) {
                showPopup(`Erro: ${result.error}`);
                submitButton.disabled = false;
                submitButton.innerText = 'Criar Conta';
                return;
            }

            showPopup('Cadastro realizado com sucesso! Redirecionando para login...');
            submitButton.disabled = false;
            submitButton.innerText = 'Criar Conta';
            document.getElementById('registerDoctorForm').reset();
            
            setTimeout(() => {
                window.location.href = 'login-medico.html';
            }, 2000);
        } catch (error) {
            console.error('Erro ao registrar médico:', error);
            showPopup(`Erro: ${error.message}`);
            submitButton.disabled = false;
            submitButton.innerText = 'Criar Conta';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const crmInput = document.getElementById('crm');
    const form = document.getElementById('registerDoctorForm');

    if (crmInput) {
        crmInput.addEventListener('input', function(e) {
            e.target.value = applyCRMMask(e.target.value);
        });
    }

    if (form) {
        form.addEventListener('submit', handleDoctorRegistration);
    }

    // Animação de carregamento
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});
