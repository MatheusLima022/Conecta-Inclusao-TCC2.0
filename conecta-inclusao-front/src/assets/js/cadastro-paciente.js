function applyMask(input, maskFn) {
    input.addEventListener('input', function(event) {
        event.target.value = maskFn(event.target.value);
    });
}

function cpfMask(value) {
    let v = value.replace(/\D/g, '');
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    return v;
}

function validatePatientForm() {
    const cpf = document.getElementById('cpf').value.trim();
    const name = document.getElementById('name').value.trim();
    const dataNascimento = document.getElementById('dataNascimento').value;
    const tipoDeficiencia = document.getElementById('tipoDeficiencia').value.trim();
    const nomeResponsavel = document.getElementById('nomeResponsavel').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!cpf || !name || !dataNascimento || !tipoDeficiencia || !nomeResponsavel || !password || !confirmPassword) {
        showPopup('Preencha todos os campos obrigatórios.');
        return false;
    }

    if (cpf.length < 14) {
        showPopup('Insira um CPF válido.');
        return false;
    }

    if (password.length < 6) {
        showPopup('A senha deve ter no mínimo 6 caracteres.');
        return false;
    }

    if (password !== confirmPassword) {
        showPopup('As senhas não coincidem.');
        return false;
    }

    return true;
}

async function registerPatientAPI(data) {
    try {
        const response = await fetch('http://localhost:3000/auth/register/patient', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        const result = await response.json();
        return { ok: response.ok, data: result };
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { ok: false, data: { message: 'Erro de conexão com o servidor' } };
    }
}

function handlePatientRegistration(event) {
    event.preventDefault();
    const submitButton = document.querySelector('.btn-submit');

    if (!validatePatientForm()) {
        return;
    }

    const cpf = document.getElementById('cpf').value.trim();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const dataNascimento = document.getElementById('dataNascimento').value;
    const tipoDeficiencia = document.getElementById('tipoDeficiencia').value.trim();
    const nomeResponsavel = document.getElementById('nomeResponsavel').value.trim();
    const password = document.getElementById('password').value;

    showPopup('Deseja confirmar o cadastro?', 'confirm').then(async (confirmed) => {
        if (!confirmed) return;

        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Cadastrando...';

        const cpfDigits = cpf.replace(/\D/g, '');
        const registrationData = {
            cpf: cpfDigits,
            password: password,
            name: name,
            email: email || null,
            nomeResponsavel: nomeResponsavel,
            tipoDeficiencia: tipoDeficiencia,
            dataNascimento: dataNascimento
        };

        const result = await registerPatientAPI(registrationData);

        if (result.ok) {
            showPopup('Cadastro realizado com sucesso! Você pode fazer login agora.');
            document.getElementById('registerPatientForm').reset();
            
            // Pré-preencher CPF no login
            localStorage.setItem('lastCPF', cpf);
            localStorage.setItem('lastRegisteredCPF', cpfDigits);
            
            setTimeout(() => {
                window.location.href = 'login-paciente.html';
            }, 1500);
        } else {
            showPopup(result.data.message || 'Erro ao cadastrar. Tente novamente.');
        }

        submitButton.disabled = false;
        submitButton.innerText = 'Criar Conta';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const cpfInput = document.getElementById('cpf');
    const form = document.getElementById('registerPatientForm');

    if (cpfInput) applyMask(cpfInput, cpfMask);
    if (form) form.addEventListener('submit', handlePatientRegistration);

    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});
