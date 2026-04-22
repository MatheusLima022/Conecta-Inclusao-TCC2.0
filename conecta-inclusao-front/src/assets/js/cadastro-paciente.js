// Importa o módulo API (compatível com navegadores modernos)
let api;

// Carrega a API dinamicamente
async function loadAPI() {
    if (!api) {
        api = await import('./api.js');
    }
    return api;
}

// Máscara de CPF automática
function applyCPFMask(value) {
    let v = value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    return v;
}

// Validação de CPF
function validarCPF(cpf) {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false;
    
    let sum = 0;
    let remainder;
    
    for (let i = 1; i <= 9; i++) {
        sum += parseInt(digits.substring(i - 1, i)) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.substring(9, 10))) return false;
    
    sum = 0;
    for (let i = 1; i <= 10; i++) {
        sum += parseInt(digits.substring(i - 1, i)) * (12 - i);
    }
    
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(digits.substring(10, 11))) return false;
    
    return true;
}

async function handlePatientRegistration(event) {
    event.preventDefault();
    const submitButton = document.querySelector('.btn-login');

    const name = document.getElementById('name').value.trim();
    const cpf = document.getElementById('cpf').value.trim();
    const dataNascimento = document.getElementById('dataNascimento').value;
    const tipoDeficiencia = document.getElementById('tipoDeficiencia').value.trim();
    const nomeResponsavel = document.getElementById('nomeResponsavel').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validações
    if (!name || !cpf || !password || !confirmPassword) {
        showPopup('Preencha todos os campos obrigatórios.');
        return;
    }

    if (!validarCPF(cpf)) {
        showPopup('CPF inválido.');
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
            
            const cpfDigits = cpf.replace(/\D/g, '');
            const result = await apiModule.registerPatient(
                cpfDigits,
                password,
                name,
                nomeResponsavel,
                tipoDeficiencia,
                dataNascimento
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
            document.getElementById('registerPatientForm').reset();
            
            setTimeout(() => {
                window.location.href = 'login-paciente.html';
            }, 2000);
        } catch (error) {
            console.error('Erro ao registrar paciente:', error);
            showPopup(`Erro: ${error.message}`);
            submitButton.disabled = false;
            submitButton.innerText = 'Criar Conta';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const cpfInput = document.getElementById('cpf');
    const form = document.getElementById('registerPatientForm');

    if (cpfInput) {
        cpfInput.addEventListener('input', function(e) {
            e.target.value = applyCPFMask(e.target.value);
        });
    }

    if (form) {
        form.addEventListener('submit', handlePatientRegistration);
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
