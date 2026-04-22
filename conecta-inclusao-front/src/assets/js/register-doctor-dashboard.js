// Integração de cadastro de médico com autenticação
async function registerDoctorFromDashboard(data) {
    const token = localStorage.getItem('token');
    
    if (!token) {
        showPopup('Você precisa estar autenticado para cadastrar um médico.');
        window.location.href = 'login-empresa.html';
        return { ok: false };
    }

    try {
        const response = await fetch('http://localhost:3000/auth/register/doctor', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        return { ok: response.ok, data: result, status: response.status };
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { ok: false, data: { message: 'Erro de conexão com o servidor' } };
    }
}

function showCredentialsModal(credentials) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 2rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    `;

    content.innerHTML = `
        <div style="text-align: center; margin-bottom: 1.5rem;">
            <i class="ph ph-check-circle" style="font-size: 3rem; color: #27ae60;"></i>
            <h2 style="color: #333; margin-top: 1rem;">Médico Cadastrado com Sucesso!</h2>
        </div>

        <div style="background-color: #e8f4f8; border-left: 4px solid #3498db; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="color: #2c3e50; margin: 0; font-size: 0.95rem;">
                <strong>⚠️ Importante:</strong> Compartilhe as credenciais abaixo com o médico. Ele deverá alterar a senha no primeiro login.
            </p>
        </div>

        <div style="background-color: #f5f5f5; padding: 1.5rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">CRM:</label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="text" value="${credentials.identifier}" readonly style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-family: monospace; font-size: 1rem;">
                    <button onclick="copyToClipboard('${credentials.identifier}')" style="padding: 0.75rem 1rem; background-color: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="ph ph-copy"></i> Copiar
                    </button>
                </div>
            </div>

            <div style="margin-bottom: 1.5rem;">
                <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">Senha Temporária:</label>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <input type="text" value="${credentials.password}" readonly style="flex: 1; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-family: monospace; font-size: 1rem;">
                    <button onclick="copyToClipboard('${credentials.password}')" style="padding: 0.75rem 1rem; background-color: #3498db; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        <i class="ph ph-copy"></i> Copiar
                    </button>
                </div>
            </div>

            <div>
                <label style="display: block; font-weight: 600; color: #333; margin-bottom: 0.5rem;">Nome Médico:</label>
                <p style="margin: 0; padding: 0.75rem; background-color: white; border-radius: 6px; border: 1px solid #ddd;">${credentials.name}</p>
            </div>
        </div>

        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem;">
            <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                <strong>Dica:</strong> Envie estas credenciais de forma segura ao médico via email ou mensagem criptografada.
            </p>
        </div>

        <div style="display: flex; gap: 1rem;">
            <button onclick="this.closest('div').parentElement.parentElement.remove();" style="flex: 1; padding: 0.75rem 1.5rem; background-color: #27ae60; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                Fechar
            </button>
            <button onclick="printCredentials('${credentials.identifier}', '${credentials.password}', '${credentials.name}')" style="flex: 1; padding: 0.75rem 1.5rem; background-color: #3498db; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                <i class="ph ph-printer"></i> Imprimir
            </button>
        </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showPopup('Copiado para a área de transferência!');
    }).catch(() => {
        alert('Erro ao copiar: ' + text);
    });
}

function printCredentials(crm, password, name) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Credenciais do Médico</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 2rem; }
                    .header { text-align: center; margin-bottom: 2rem; }
                    .content { max-width: 500px; margin: 0 auto; }
                    .field { margin-bottom: 1.5rem; }
                    label { display: block; font-weight: bold; margin-bottom: 0.5rem; }
                    .value { padding: 0.75rem; background-color: #f5f5f5; border-radius: 6px; }
                    .warning { background-color: #fff3cd; padding: 1rem; border-radius: 6px; margin-bottom: 1rem; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Credenciais de Acesso - Conecta Inclusão</h1>
                </div>
                <div class="content">
                    <div class="warning">
                        <strong>IMPORTANTE:</strong> Guarde estas credenciais com segurança. O médico deve alterar a senha no primeiro login.
                    </div>
                    <div class="field">
                        <label>Nome do Médico:</label>
                        <div class="value">${name}</div>
                    </div>
                    <div class="field">
                        <label>CRM (Identificador de Login):</label>
                        <div class="value">${crm}</div>
                    </div>
                    <div class="field">
                        <label>Senha Temporária:</label>
                        <div class="value">${password}</div>
                    </div>
                    <div class="warning">
                        <strong>URL de Acesso:</strong> Direcionar para a página de login de médicos
                    </div>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('registerDoctorForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const crm = document.getElementById('docCRM').value.trim().toUpperCase();
        const name = document.getElementById('docName').value.trim();
        const especialidade = document.getElementById('docEspecialidade').value.trim();
        const email = document.getElementById('docEmail').value.trim();
        const bio = document.getElementById('docBio').value.trim();
        const password = document.getElementById('docPassword').value;
        const confirmPassword = document.getElementById('docConfirmPassword').value;

        // Validações
        if (!crm || !name || !especialidade || !password || !confirmPassword) {
            showPopup('Preencha todos os campos obrigatórios.');
            return;
        }

        if (crm.length < 4 || crm.length > 7) {
            showPopup('CRM deve ter entre 4 e 7 caracteres.');
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

        // Buscar clinicaId do usuário autenticado
        const userStr = localStorage.getItem('user');
        if (!userStr) {
            showPopup('Você precisa estar autenticado.');
            window.location.href = 'login-empresa.html';
            return;
        }

        const user = JSON.parse(userStr);
        
        // Por enquanto, usaremos um clinicaId mock (será implementado após obter ID do banco)
        // TODO: Implementar endpoint para buscar clinicaId do usuário autenticado
        const clinicaId = 1; // Mock - será dinâmico

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="ph ph-circle-notch-bold" style="animation: spin 1s linear infinite;"></i> Cadastrando...';

        const registrationData = {
            crm: crm,
            password: password,
            name: name,
            email: email || null,
            especialidade: especialidade,
            bio: bio || null,
            clinicaId: clinicaId
        };

        const result = await registerDoctorFromDashboard(registrationData);

        if (result.ok) {
            showPopup('Médico cadastrado com sucesso!');
            
            // Mostrar modal com credenciais
            showCredentialsModal({
                identifier: crm,
                password: password,
                name: name
            });

            form.reset();
        } else {
            const errorMsg = result.data?.message || 'Erro ao cadastrar médico.';
            showPopup(errorMsg);
        }

        submitBtn.disabled = false;
        submitBtn.innerText = originalText;
    });

    // Máscara para CRM
    const crmInput = document.getElementById('docCRM');
    if (crmInput) {
        crmInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
        });
    }

    // CSS para animação de carregamento
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});
