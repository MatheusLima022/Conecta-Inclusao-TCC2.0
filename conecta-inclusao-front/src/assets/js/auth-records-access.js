// Script de autenticação para acesso aos prontuários
class RecordsAuthenticator {
    constructor() {
        this.form = document.getElementById('authForm');
        this.cnpjInput = document.getElementById('cnpj');
        this.crmInput = document.getElementById('crm');
        this.passwordInput = document.getElementById('password');
        this.togglePasswordBtn = document.getElementById('togglePassword');
        this.submitBtn = this.form.querySelector('button[type="submit"]');
        this.errorMessage = document.getElementById('errorMessage');
        this.loadingSpinner = document.getElementById('loadingSpinner');
        this.backButton = document.getElementById('backButton');
        this.countdown = document.getElementById('countdown');

        this.maxAttempts = 3;
        this.attempts = 0;
        this.countdownInterval = null;
        this.redirectTimeout = null;

        this.init();
    }

    init() {
        // Event listeners
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
        this.togglePasswordBtn.addEventListener('click', () => this.togglePassword());
        this.backButton.addEventListener('click', () => this.goBack());
        this.cnpjInput.addEventListener('input', (e) => this.formatCNPJ(e));

        // Carregar dados armazenados se existirem
        this.loadStoredData();

        // Focar no primeiro campo
        this.cnpjInput.focus();
    }

    formatCNPJ(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 14) {
            value = value.slice(0, 14);
        }

        if (value.length > 11) {
            value = value.slice(0, 8) + '/' + value.slice(8, 12) + '-' + value.slice(12, 14);
        } else if (value.length > 8) {
            value = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5, 8) + '/' + value.slice(8);
        } else if (value.length > 5) {
            value = value.slice(0, 2) + '.' + value.slice(2, 5) + '.' + value.slice(5);
        } else if (value.length > 2) {
            value = value.slice(0, 2) + '.' + value.slice(2);
        }

        e.target.value = value;
    }

    togglePassword() {
        const isPassword = this.passwordInput.type === 'password';
        this.passwordInput.type = isPassword ? 'text' : 'password';
        
        const icon = this.togglePasswordBtn.querySelector('i');
        icon.className = isPassword ? 'ph ph-eye-slash' : 'ph ph-eye';
    }

    loadStoredData() {
        // Tentar carregar dados da sessão anterior se existirem
        const storedCNPJ = sessionStorage.getItem('recordsAuthCNPJ');
        const storedCRM = sessionStorage.getItem('recordsAuthCRM');

        if (storedCNPJ) this.cnpjInput.value = storedCNPJ;
        if (storedCRM) this.crmInput.value = storedCRM;
    }

    clearError() {
        this.errorMessage.style.display = 'none';
        this.errorMessage.textContent = '';
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'flex';
        this.errorMessage.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showLoading(show = true) {
        if (show) {
            this.loadingSpinner.style.display = 'flex';
            this.submitBtn.disabled = true;
            this.submitBtn.style.opacity = '0.6';
        } else {
            this.loadingSpinner.style.display = 'none';
            this.submitBtn.disabled = false;
            this.submitBtn.style.opacity = '1';
        }
    }

    validateInputs() {
        const cnpj = this.cnpjInput.value.replace(/\D/g, '');
        const crm = this.crmInput.value.trim();
        const password = this.passwordInput.value;

        if (!cnpj || cnpj.length !== 14) {
            this.showError('CNPJ inválido. Digite um CNPJ válido com 14 dígitos.');
            return false;
        }

        if (!crm || crm.length < 4) {
            this.showError('CRM inválido. Digite um CRM válido.');
            return false;
        }

        if (!password || password.length < 4) {
            this.showError('Senha inválida. A senha deve ter no mínimo 4 caracteres.');
            return false;
        }

        return true;
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Limpar mensagens de erro anteriores
        this.clearError();

        // Verificar se já atingiu o máximo de tentativas
        if (this.attempts >= this.maxAttempts) {
            this.showError(`Você excedeu o número máximo de tentativas. Aguarde alguns minutos antes de tentar novamente.`);
            return;
        }

        // Validar inputs
        if (!this.validateInputs()) {
            return;
        }

        // Mostrar loading
        this.showLoading(true);

        try {
            const cnpj = this.cnpjInput.value.replace(/\D/g, '');
            const crm = this.crmInput.value.trim().toUpperCase();
            const password = this.passwordInput.value;

            // Tentar autenticar contra a API
            const response = await fetch('http://localhost:3000/auth/records/authenticate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cnpj: cnpj,
                    crm: crm,
                    password: password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                this.attempts++;
                const remainingAttempts = this.maxAttempts - this.attempts;
                
                let errorMsg = data.message || 'Erro ao autenticar. Verifique seus dados.';
                if (remainingAttempts > 0) {
                    errorMsg += ` (${remainingAttempts} tentativa(s) restante(s))`;
                }
                
                this.showError(errorMsg);
                this.showLoading(false);
                return;
            }

            // Sucesso! Armazenar dados
            sessionStorage.setItem('recordsAuthToken', data.token || 'authenticated');
            sessionStorage.setItem('recordsAuthCNPJ', cnpj);
            sessionStorage.setItem('recordsAuthCRM', crm);
            sessionStorage.setItem('recordsAuthTime', new Date().toISOString());

            // Limpar spinner e form
            this.loadingSpinner.style.display = 'none';
            this.form.style.display = 'none';

            // Mostrar mensagem de sucesso
            this.showSuccessAndRedirect();

        } catch (error) {
            console.error('Erro na autenticação:', error);
            this.showError('Erro na conexão. Verifique sua internet e tente novamente.');
            this.showLoading(false);
        }
    }

    showSuccessAndRedirect() {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div style="text-align: center; padding: 40px 20px;">
                <i class="ph ph-check-circle" style="font-size: 64px; color: #2ed573; margin-bottom: 20px; display: block;"></i>
                <h2 style="color: #2ed573; margin-bottom: 15px;">Autenticado com Sucesso!</h2>
                <p style="color: var(--text-secondary); margin-bottom: 30px;">Redirecionando para os prontuários...</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <span style="color: var(--text-secondary); font-size: 14px;">Redirecionando em</span>
                    <span id="redirectCountdown" style="color: var(--primary-color); font-weight: bold; font-size: 14px;">3</span>
                    <span style="color: var(--text-secondary); font-size: 14px;">segundos...</span>
                </div>
            </div>
        `;
        
        this.form.parentElement.replaceChild(successDiv, this.form);
        
        // Contar regressivo antes de redirecionar
        let countdown = 3;
        const countdownEl = document.getElementById('redirectCountdown');
        
        const interval = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            
            if (countdown === 0) {
                clearInterval(interval);
                this.redirectToRecords();
            }
        }, 1000);
    }

    redirectToRecords() {
        // Redirecionar para a página de prontuários
        // Você pode ajustar a URL conforme necessário
        window.location.href = 'records.html';
    }

    goBack() {
        // Voltar ao dashboard
        const previousPage = sessionStorage.getItem('recordsAuthPreviousPage') || 'dashboard-medico.html';
        window.location.href = previousPage;
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    new RecordsAuthenticator();

    // Armazenar página anterior (de onde veio)
    sessionStorage.setItem('recordsAuthPreviousPage', document.referrer || 'dashboard-medico.html');
});

// Adicionar estilos para a mensagem de sucesso dinamicamente
const style = document.createElement('style');
style.textContent = `
    .success-message {
        animation: successSlideIn 0.5s ease-out;
    }

    @keyframes successSlideIn {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);
