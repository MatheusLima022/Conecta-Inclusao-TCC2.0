// Script para gerenciar a página de prontuários
class RecordsManager {
    constructor() {
        this.records = [];
        this.filteredRecords = [];
        this.modal = document.getElementById('recordModal');
        this.recordForm = document.getElementById('recordForm');
        this.newRecordBtn = document.getElementById('newRecordBtn');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.searchInput = document.getElementById('searchInput');
        this.filterStatus = document.getElementById('filterStatus');
        this.recordsGrid = document.getElementById('recordsGrid');

        this.init();
    }

    init() {
        // Event listeners
        this.newRecordBtn.addEventListener('click', () => this.openModal());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.recordForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.searchInput.addEventListener('input', () => this.filterRecords());
        this.filterStatus.addEventListener('change', () => this.filterRecords());

        // Carregar dados
        this.loadProfessionalInfo();
        this.loadRecords();
    }

    loadProfessionalInfo() {
        const name = sessionStorage.getItem('professionalName') || 'Dr. Nome';
        const registry = sessionStorage.getItem('professionalRegistry') || 'CRM';

        const nameEl = document.getElementById('professionalName');
        const registryEl = document.getElementById('professionalRegistry');
        const avatarEl = document.getElementById('professionalAvatar');

        if (nameEl) nameEl.innerText = name;
        if (registryEl) registryEl.innerText = registry;
        if (avatarEl) avatarEl.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0073e6&color=fff`;
    }

    async loadRecords() {
        // Simular carregamento de prontuários (em produção, viriam da API)
        // Por enquanto, mostrar uma tela vazia com instruções
        
        this.recordsGrid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <i class="ph ph-folder-open"></i>
                <p>Nenhum prontuário registrado ainda</p>
                <p style="font-size: 13px; color: #94a3b8;">
                    Clique no botão "Novo Prontuário" para criar o primeiro registro
                </p>
            </div>
        `;

        this.records = [];
        this.filteredRecords = [];
    }

    filterRecords() {
        const searchTerm = this.searchInput.value.toLowerCase();
        const statusFilter = this.filterStatus.value;

        this.filteredRecords = this.records.filter(record => {
            const matchesSearch = 
                record.patientName.toLowerCase().includes(searchTerm) ||
                record.patientCPF.includes(searchTerm);
            
            const matchesStatus = !statusFilter || record.status === statusFilter;

            return matchesSearch && matchesStatus;
        });

        this.renderRecords();
    }

    renderRecords() {
        if (this.filteredRecords.length === 0) {
            this.recordsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="ph ph-magnifying-glass"></i>
                    <p>Nenhum prontuário encontrado</p>
                </div>
            `;
            return;
        }

        this.recordsGrid.innerHTML = this.filteredRecords.map(record => `
            <div class="record-card" data-id="${record.id}">
                <div class="record-card-header">
                    <div class="patient-info">
                        <div class="patient-name">${record.patientName}</div>
                        <div class="patient-cpf">${record.patientCPF}</div>
                    </div>
                    <span class="record-status status-${record.status}">${this.formatStatus(record.status)}</span>
                </div>
                <div class="record-body">
                    <div class="record-date">${this.formatDate(record.date)}</div>
                    <div class="record-diagnosis">${record.diagnosis}</div>
                </div>
                <div class="record-actions">
                    <button type="button" class="btn-view" onclick="recordsManager.viewRecord('${record.id}')">
                        <i class="ph ph-eye"></i> Ver
                    </button>
                    <button type="button" class="btn-edit" onclick="recordsManager.editRecord('${record.id}')">
                        <i class="ph ph-pencil"></i> Editar
                    </button>
                    <button type="button" class="btn-delete" onclick="recordsManager.deleteRecord('${record.id}')">
                        <i class="ph ph-trash"></i> Deletar
                    </button>
                </div>
            </div>
        `).join('');
    }

    openModal() {
        this.recordForm.reset();
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = {
            patientCPF: document.getElementById('patientCPF').value,
            patientName: document.getElementById('patientName').value,
            diagnosis: document.getElementById('diagnosis').value,
            treatment: document.getElementById('treatment').value,
            notes: document.getElementById('notes').value,
            date: new Date().toISOString(),
            status: 'ativo'
        };

        try {
            // Simular envio para API
            console.log('Prontuário a ser salvo:', formData);

            // Em produção, fazer requisição à API:
            // const response = await fetch('/api/records', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(formData)
            // });

            // Adicionar ao array local (para demonstração)
            formData.id = Date.now().toString();
            this.records.push(formData);
            this.filterRecords();

            // Mostrar mensagem de sucesso
            alert('Prontuário salvo com sucesso!');
            this.closeModal();

        } catch (error) {
            console.error('Erro ao salvar prontuário:', error);
            alert('Erro ao salvar prontuário. Tente novamente.');
        }
    }

    viewRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (record) {
            alert(`Visualizando prontuário de ${record.patientName}\n\nDiagnóstico: ${record.diagnosis}`);
        }
    }

    editRecord(recordId) {
        const record = this.records.find(r => r.id === recordId);
        if (record) {
            document.getElementById('patientCPF').value = record.patientCPF;
            document.getElementById('patientName').value = record.patientName;
            document.getElementById('diagnosis').value = record.diagnosis;
            document.getElementById('treatment').value = record.treatment;
            document.getElementById('notes').value = record.notes;
            this.openModal();
        }
    }

    deleteRecord(recordId) {
        if (confirm('Tem certeza que deseja deletar este prontuário?')) {
            this.records = this.records.filter(r => r.id !== recordId);
            this.filterRecords();
        }
    }

    formatStatus(status) {
        const statusMap = {
            'ativo': 'Ativo',
            'pendente': 'Pendente',
            'concluido': 'Concluído'
        };
        return statusMap[status] || status;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Variável global para acessar a instância do gerenciador
let recordsManager;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    // Verificar se foi autenticado
    const authToken = sessionStorage.getItem('recordsAuthToken');
    if (!authToken) {
        alert('Você precisa se autenticar para acessar esta página.');
        window.location.href = 'dashboard-medico.html';
        return;
    }

    recordsManager = new RecordsManager();

    // Fechar modal ao clicar fora dele
    document.addEventListener('click', (e) => {
        if (e.target === recordsManager.modal) {
            recordsManager.closeModal();
        }
    });
});

// Prevenir navegação acidental
window.addEventListener('beforeunload', (e) => {
    if (recordsManager && recordsManager.recordForm.querySelector('input[value]').length > 0) {
        e.preventDefault();
        e.returnValue = '';
    }
});
