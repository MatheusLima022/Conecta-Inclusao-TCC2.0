function showPopup(message, type = 'info') {
    return new Promise((resolve) => {
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'popup-modal';
        document.body.appendChild(modal);

        // Common styles
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
        modal.style.display = 'flex';
        modal.style.justifyContent = 'center';
        modal.style.alignItems = 'center';
        modal.style.zIndex = '3000';

        const content = document.createElement('div');
        content.className = 'popup-content';
        content.style.backgroundColor = 'white';
        content.style.padding = '20px';
        content.style.borderRadius = '8px';
        content.style.textAlign = 'center';
        content.style.maxWidth = '400px';
        modal.appendChild(content);

        const p = document.createElement('p');
        p.textContent = message;
        content.appendChild(p);

        if (type === 'confirm') {
            const yesBtn = document.createElement('button');
            yesBtn.className = 'popup-yes';
            yesBtn.textContent = 'Sim';
            yesBtn.style.marginTop = '10px';
            yesBtn.style.marginRight = '10px';
            yesBtn.style.padding = '10px 20px';
            yesBtn.style.border = 'none';
            yesBtn.style.backgroundColor = '#007bff';
            yesBtn.style.color = 'white';
            yesBtn.style.borderRadius = '4px';
            yesBtn.style.cursor = 'pointer';
            content.appendChild(yesBtn);

            const noBtn = document.createElement('button');
            noBtn.className = 'popup-no';
            noBtn.textContent = 'Não';
            noBtn.style.marginTop = '10px';
            noBtn.style.padding = '10px 20px';
            noBtn.style.border = 'none';
            noBtn.style.backgroundColor = '#6c757d';
            noBtn.style.color = 'white';
            noBtn.style.borderRadius = '4px';
            noBtn.style.cursor = 'pointer';
            content.appendChild(noBtn);

            yesBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });

            noBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
        } else {
            const closeBtn = document.createElement('button');
            closeBtn.className = 'popup-close';
            closeBtn.textContent = 'OK';
            closeBtn.style.marginTop = '10px';
            closeBtn.style.padding = '10px 20px';
            closeBtn.style.border = 'none';
            closeBtn.style.backgroundColor = '#007bff';
            closeBtn.style.color = 'white';
            closeBtn.style.borderRadius = '4px';
            closeBtn.style.cursor = 'pointer';
            content.appendChild(closeBtn);

            closeBtn.addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve();
            });
        }
    });
}

function setupPasswordVisibilityToggles() {
    const passwordInputs = document.querySelectorAll('input[type="password"], input[data-password-toggle="true"]');

    if (!passwordInputs.length) return;

    if (!document.getElementById('passwordVisibilityStyles')) {
        const style = document.createElement('style');
        style.id = 'passwordVisibilityStyles';
        style.textContent = `
            .password-visibility-field {
                position: relative;
                display: flex;
                align-items: center;
                width: 100%;
            }

            .password-visibility-field input {
                width: 100%;
                padding-right: 3rem !important;
            }

            .password-visibility-toggle {
                position: absolute;
                right: 0.75rem;
                top: 50%;
                transform: translateY(-50%);
                width: 2rem;
                height: 2rem;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border: 0;
                border-radius: 6px;
                background: transparent;
                color: #64748b;
                cursor: pointer;
                z-index: 2;
            }

            .password-visibility-toggle:hover,
            .password-visibility-toggle:focus-visible {
                color: #0073e6;
                background: rgba(0, 115, 230, 0.08);
                outline: none;
            }

            .password-visibility-toggle i {
                font-size: 1.15rem;
                line-height: 1;
            }
        `;
        document.head.appendChild(style);
    }

    passwordInputs.forEach((input) => {
        if (input.dataset.passwordToggleReady === 'true') return;
        if (input.closest('.password-input-group')?.querySelector('.toggle-password')) return;

        const wrapper = document.createElement('div');
        wrapper.className = 'password-visibility-field';
        input.parentNode.insertBefore(wrapper, input);
        wrapper.appendChild(input);

        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'password-visibility-toggle';
        toggleButton.setAttribute('aria-label', 'Mostrar senha');
        toggleButton.setAttribute('title', 'Mostrar senha');
        toggleButton.innerHTML = '<i class="ph ph-eye"></i>';

        toggleButton.addEventListener('click', () => {
            const showingPassword = input.type === 'text';
            input.type = showingPassword ? 'password' : 'text';
            input.dataset.passwordToggle = 'true';
            toggleButton.setAttribute('aria-label', showingPassword ? 'Mostrar senha' : 'Ocultar senha');
            toggleButton.setAttribute('title', showingPassword ? 'Mostrar senha' : 'Ocultar senha');
            toggleButton.innerHTML = showingPassword ? '<i class="ph ph-eye"></i>' : '<i class="ph ph-eye-slash"></i>';
        });

        wrapper.appendChild(toggleButton);
        input.dataset.passwordToggleReady = 'true';
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupPasswordVisibilityToggles);
} else {
    setupPasswordVisibilityToggles();
}

// Função para validar CPF
function validarCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');

    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) {
        return false;
    }

    // Verifica se todos os dígitos são iguais (CPF inválido)
    if (/^(\d)\1+$/.test(cpf)) {
        return false;
    }

    // Calcula o primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
        soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) {
        return false;
    }

    // Calcula o segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(10))) {
        return false;
    }

    return true;
}
