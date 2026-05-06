const PROFESSIONALS_STORAGE_KEY = 'companyProfessionals';
const PATIENT_MESSAGES_STORAGE_KEY = 'patientProfessionalMessages';
const GUARDIANS_STORAGE_KEY = 'patientGuardians';
const DEMO_PROFESSIONAL_REGISTRIES = ['CRM 123456'];
const CHATBOT_CONTACT = {
    key: 'conecta-chatbot',
    name: 'Assistente Conecta',
    specialty: 'Chatbot de apoio',
    hospital: 'Portal do Paciente',
    type: 'bot'
};
const CHATBOT_QUICK_ACTIONS = [
    'Quero agendar uma consulta',
    'Quais sao meus proximos agendamentos?',
    'O que levar para a consulta?',
    'Como desmarcar uma consulta?'
];
let activeChatContactKey = CHATBOT_CONTACT.key;
let chatbotScheduleDraft = null;

// Função para abrir modal de responsável
function openGuardianModal() {
    const modal = document.getElementById('guardianModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

// Função para fechar modal de responsável
function closeGuardianModal() {
    const modal = document.getElementById('guardianModal');
    if (modal) {
        modal.style.display = 'none';
    }
    const form = document.getElementById('formNewGuardian');
    if (form) {
        form.reset();
    }
}

// Carregar responsáveis do localStorage
function loadGuardians() {
    try {
        const data = localStorage.getItem(GUARDIANS_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Erro ao carregar responsáveis:', error);
        return [];
    }
}

// Salvar responsáveis no localStorage
function saveGuardians(guardians) {
    localStorage.setItem(GUARDIANS_STORAGE_KEY, JSON.stringify(guardians));
}

// Renderizar lista de responsáveis
function renderGuardians() {
    const guardiansList = document.getElementById('guardiansList');
    if (!guardiansList) return;

    const guardians = loadGuardians();

    if (guardians.length === 0) {
        guardiansList.innerHTML = `
            <div class="guardians-empty">
                <i class="ph ph-users-three"></i>
                <p>Nenhum responsável cadastrado ainda.</p>
            </div>
        `;
        return;
    }

    guardiansList.innerHTML = '';

    guardians.forEach((guardian, index) => {
        const permissionsText = (guardian.permissions || [])
            .map(p => {
                const permissionMap = {
                    'view_appointments': 'Ver agendamentos',
                    'manage_appointments': 'Gerenciar agendamentos',
                    'view_records': 'Ver registros',
                    'send_messages': 'Enviar mensagens'
                };
                return permissionMap[p] || p;
            })
            .join(', ');

        const card = document.createElement('div');
        card.className = 'guardian-card';
        card.innerHTML = `
            <div class="guardian-card-header">
                <div class="guardian-info">
                    <strong>${guardian.name}</strong>
                    <span>${guardian.relationship}</span>
                    <span>${guardian.phone}</span>
                </div>
                <div class="guardian-actions">
                    <button class="btn-secondary" type="button" onclick="editGuardian(${index})">
                        <i class="ph ph-pencil"></i>
                    </button>
                    <button class="btn-danger" type="button" onclick="removeGuardian(${index})">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
            <div class="guardian-details">
                <div class="guardian-detail">
                    <label>E-mail</label>
                    <p>${guardian.email}</p>
                </div>
                <div class="guardian-detail">
                    <label>Acesso desde</label>
                    <p>${guardian.dateAdded || 'Hoje'}</p>
                </div>
            </div>
            <div class="guardian-permissions">
                <div class="guardian-permissions-label">Permissões concedidas:</div>
                <div class="permissions-list">
                    ${permissionsText ? permissionsText.split(', ').map(p => `<span class="permission-badge"><i class="ph ph-check-circle"></i>${p}</span>`).join('') : '<span style="color: #64748b;">Nenhuma permissão</span>'}
                </div>
            </div>
        `;
        guardiansList.appendChild(card);
    });
}

// Remover responsável
function removeGuardian(index) {
    const guardians = loadGuardians();
    if (index >= 0 && index < guardians.length) {
        const guardian = guardians[index];
        guardians.splice(index, 1);
        saveGuardians(guardians);
        renderGuardians();
        showPopup(`Responsável ${guardian.name} removido com sucesso.`);
    }
}

// Editar responsável
function editGuardian(index) {
    const guardians = loadGuardians();
    if (index >= 0 && index < guardians.length) {
        const guardian = guardians[index];
        
        // Preencher o formulário com os dados do responsável
        document.getElementById('guardianName').value = guardian.name;
        document.getElementById('guardianRelationship').value = guardian.relationship;
        document.getElementById('guardianPhone').value = guardian.phone;
        document.getElementById('guardianEmail').value = guardian.email;

        // Selecionar as permissões
        const checkboxes = document.querySelectorAll('input[name="permissions"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = guardian.permissions.includes(checkbox.value);
        });

        // Armazenar o índice para atualização
        document.getElementById('formNewGuardian').dataset.editIndex = index;
        document.querySelector('.modal-header div h3').textContent = 'Editar Responsável';
        document.querySelector('button[type="submit"]').textContent = 'Atualizar Responsável';

        openGuardianModal();
    }
}

// Renderizar sugestões de atendimento baseadas em profissionais cadastrados
function renderSuggestions() {
    const suggestionGrid = document.getElementById('suggestionGrid');
    if (!suggestionGrid) return;

    const professionals = loadRegisteredProfessionals();
    const specialtiesMap = new Map();

    // Agrupar profissionais por especialidade
    professionals.forEach(prof => {
        if (!specialtiesMap.has(prof.role)) {
            specialtiesMap.set(prof.role, []);
        }
        specialtiesMap.get(prof.role).push(prof);
    });

    // Se não há profissionais, mostrar mensagem vazia
    if (specialtiesMap.size === 0) {
        suggestionGrid.innerHTML = `
            <div class="suggestion-empty">
                <i class="ph ph-stethoscope"></i>
                <p>Nenhum profissional cadastrado no momento.</p>
            </div>
        `;
        return;
    }

    suggestionGrid.innerHTML = '';

    // Renderizar cards para cada especialidade
    let cardCount = 0;
    specialtiesMap.forEach((professionals, specialty) => {
        if (cardCount >= 6) return; // Limitar a 6 sugestões

        const firstProf = professionals[0];
        const countText = professionals.length > 1 ? `${professionals.length} profissionais` : '1 profissional';

        const card = document.createElement('div');
        card.className = 'suggestion-card';
        card.innerHTML = `
            <strong>${specialty}</strong>
            <span>${firstProf.unit || 'Unidade não informada'}</span>
            <p>${countText} disponível${professionals.length > 1 ? 's' : ''}. Agenda aberta para agendamentos.</p>
            <button class="btn-schedule-suggestion" type="button" onclick="scrollToSpecialty('${specialty}')">
                Agendar
            </button>
        `;
        suggestionGrid.appendChild(card);
        cardCount++;
    });
}

// Função auxiliar para scroll até a especialidade
function scrollToSpecialty(specialty) {
    switchTab('appointments');
    const select = document.getElementById('modalProfessional');
    if (select) {
        // Encontrar a opção correspondente
        const professionals = loadRegisteredProfessionals();
        const prof = professionals.find(p => p.role === specialty);
        if (prof) {
            select.value = prof.registry;
            updateSelectedProfessionalDetails();
            openModal();
        }
    }
}

function openModal() {
    populateProfessionalOptions();
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closeModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function switchTab(tabKey) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.nav-link');

    tabs.forEach(tab => tab.classList.toggle('active', tab.id === tabKey));
    buttons.forEach(button => button.classList.toggle('active', button.dataset.tab === tabKey));
}

function parseAppointmentDate(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}

function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

function formatProfessionalListForChat(professionals) {
    return professionals
        .map((professional, index) => `${index + 1}. ${professional.name} - ${professional.role} (${professional.unit || 'Unidade a confirmar'})`)
        .join('\n');
}

function parseDateFromMessage(message) {
    const normalizedMessage = normalizeText(message);

    if (normalizedMessage.includes('amanha')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().slice(0, 10);
    }

    const isoMatch = message.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    if (isoMatch) {
        return isoMatch[0];
    }

    const brMatch = message.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/);
    if (brMatch) {
        const day = brMatch[1].padStart(2, '0');
        const month = brMatch[2].padStart(2, '0');
        return `${brMatch[3]}-${month}-${day}`;
    }

    return '';
}

function isValidAppointmentDate(dateString) {
    if (!dateString) return false;

    const date = parseAppointmentDate(dateString);
    if (Number.isNaN(date.getTime())) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
}

function formatDateTime(date = new Date()) {
    return date.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getAppointmentCards() {
    return Array.from(document.querySelectorAll('.appointment-card'));
}

function loadRegisteredProfessionals() {
    try {
        const raw = localStorage.getItem(PROFESSIONALS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : [];

        if (!Array.isArray(parsed)) {
            return [];
        }

        return parsed.filter(isAvailableRegisteredDoctor);
    } catch (error) {
        console.error('Erro ao carregar profissionais cadastrados:', error);
        return [];
    }
}

function isAvailableRegisteredDoctor(professional) {
    if (!professional || !professional.name || !professional.role || !professional.registry) {
        return false;
    }

    const registry = String(professional.registry).trim().toUpperCase();
    const isDemoProfessional = DEMO_PROFESSIONAL_REGISTRIES.includes(registry);
    const normalizedRegistry = registry.replace(/^CRM\s*/i, '').replace(/[\s-]/g, '');
    const isDoctorRegistry = registry.includes('CRM') || /^[A-Z0-9]{4,7}$/.test(normalizedRegistry);
    const isAvailable = ['Ativo', 'Trabalhando'].includes(professional.status);

    return isDoctorRegistry && isAvailable && !isDemoProfessional;
}

function getProfessionalByRegistry(registry) {
    return loadRegisteredProfessionals().find(professional => professional.registry === registry) || null;
}

function updateSelectedProfessionalDetails() {
    const professionalSelect = document.getElementById('modalProfessional');
    const specialtyInput = document.getElementById('modalSpec');
    const unitInput = document.getElementById('modalUnit');

    if (!professionalSelect || !specialtyInput || !unitInput) return;

    const selectedProfessional = getProfessionalByRegistry(professionalSelect.value);

    specialtyInput.value = selectedProfessional?.role || '';
    unitInput.value = selectedProfessional?.unit || '';
}

function populateProfessionalOptions() {
    const professionalSelect = document.getElementById('modalProfessional');
    if (!professionalSelect) return;

    const professionals = loadRegisteredProfessionals();
    const currentValue = professionalSelect.value;

    professionalSelect.innerHTML = '<option value="">Selecione um profissional...</option>';

    if (!professionals.length) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Nenhum médico cadastrado disponível';
        option.disabled = true;
        professionalSelect.appendChild(option);
        updateSelectedProfessionalDetails();
        return;
    }

    professionals.forEach(professional => {
        const option = document.createElement('option');
        option.value = professional.registry;
        option.textContent = `${professional.name} - ${professional.role}`;
        professionalSelect.appendChild(option);
    });

    if (professionals.some(professional => professional.registry === currentValue)) {
        professionalSelect.value = currentValue;
    }

    updateSelectedProfessionalDetails();
}

function populateSearchFilters() {
    const specialtySelect = document.getElementById('searchSpecialty');
    const unitSelect = document.getElementById('searchHospital');
    if (!specialtySelect || !unitSelect) return;

    const professionals = loadRegisteredProfessionals();
    const specialties = Array.from(new Set(professionals.map(professional => professional.role).filter(Boolean))).sort();
    const units = Array.from(new Set(professionals.map(professional => professional.unit).filter(Boolean))).sort();

    specialtySelect.innerHTML = '<option value="">Todas as areas</option>';
    specialties.forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty;
        option.textContent = specialty;
        specialtySelect.appendChild(option);
    });

    unitSelect.innerHTML = '<option value="">Todas as unidades</option>';
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        unitSelect.appendChild(option);
    });
}

function getAppointmentData() {
    return getAppointmentCards()
        .map(card => ({
            specialty: card.dataset.specialty || '',
            doctor: card.dataset.doctor || '',
            hospital: card.dataset.hospital || '',
            date: card.dataset.date || '',
            contactKey: `${card.dataset.doctor || ''}::${card.dataset.hospital || ''}::${card.dataset.specialty || ''}`
        }))
        .sort((first, second) => parseAppointmentDate(first.date) - parseAppointmentDate(second.date));
}

function getPatientName() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.name || 'Paciente';
}

function loadStoredConversations() {
    try {
        const raw = localStorage.getItem(PATIENT_MESSAGES_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : {};
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        return {};
    }
}

function saveStoredConversations(conversations) {
    localStorage.setItem(PATIENT_MESSAGES_STORAGE_KEY, JSON.stringify(conversations));
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeText(value) {
    return String(value)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function getMessageContacts() {
    const contactsMap = new Map();

    getAppointmentData().forEach(appointment => {
        if (!appointment.doctor) return;

        if (!contactsMap.has(appointment.contactKey)) {
            contactsMap.set(appointment.contactKey, {
                key: appointment.contactKey,
                name: appointment.doctor,
                specialty: appointment.specialty,
                hospital: appointment.hospital,
                date: appointment.date
            });
        }
    });

    const appointmentContacts = Array.from(contactsMap.values())
        .sort((first, second) => first.name.localeCompare(second.name, 'pt-BR'));

    return [CHATBOT_CONTACT, ...appointmentContacts];
}

function createInitialConversation(contact) {
    if (contact.type === 'bot') {
        return [
            {
                sender: 'bot',
                content: `Ola, ${getPatientName()}. Sou a Assistente Conecta. Posso te ajudar com agendamentos, preparo para consultas, documentos, responsaveis e orientacoes gerais do portal.`,
                timestamp: formatDateTime()
            }
        ];
    }

    return [
        {
            sender: 'professional',
            content: `Ola, eu sou a assistente virtual de ${contact.name}. Posso te ajudar com orientacoes sobre sua consulta de ${contact.specialty.toLowerCase()} em ${contact.hospital}.`,
            timestamp: formatDateTime()
        }
    ];
}

function ensureConversationExists(contactKey) {
    const contacts = getMessageContacts();
    const contact = contacts.find(item => item.key === contactKey);
    if (!contact) return [];

    const conversations = loadStoredConversations();
    if (!Array.isArray(conversations[contactKey]) || conversations[contactKey].length === 0) {
        conversations[contactKey] = createInitialConversation(contact);
        saveStoredConversations(conversations);
    }

    return conversations[contactKey];
}

function getActiveContact() {
    return getMessageContacts().find(contact => contact.key === activeChatContactKey) || null;
}

function buildAiReply(contact, userMessage) {
    if (contact.type === 'bot') {
        return buildChatbotReply(userMessage);
    }

    const normalizedMessage = userMessage.toLowerCase();

    if (normalizedMessage.includes('horario') || normalizedMessage.includes('hora') || normalizedMessage.includes('dia')) {
        return `Verifiquei aqui: o ideal e manter o horario ja agendado para ${formatDate(contact.date)}. Se quiser remarcacao, eu posso te orientar a procurar outro horario disponivel com ${contact.name}.`;
    }

    if (normalizedMessage.includes('exame') || normalizedMessage.includes('documento')) {
        return `Para a consulta com ${contact.name}, leve seus documentos pessoais e, se tiver, exames recentes relacionados a ${contact.specialty.toLowerCase()}. Isso ajuda bastante no atendimento.`;
    }

    if (normalizedMessage.includes('dor') || normalizedMessage.includes('sintoma') || normalizedMessage.includes('febre')) {
        return `Entendi. Vou registrar sua queixa para o atendimento com ${contact.name}. Se os sintomas piorarem antes da consulta, procure atendimento imediato na unidade mais proxima.`;
    }

    if (normalizedMessage.includes('obrigad')) {
        return `Por nada. Sempre que precisar, pode me chamar por aqui e eu te ajudo com informacoes sobre seu atendimento com ${contact.name}.`;
    }

    return `Recebi sua mensagem e deixei tudo organizado para o atendimento com ${contact.name}. Se quiser, me diga se sua duvida e sobre preparo, horario, documentos ou sintomas antes da consulta.`;
}

function handleChatbotScheduling(userMessage) {
    const professionals = loadRegisteredProfessionals();
    const normalizedMessage = normalizeText(userMessage);

    if (!chatbotScheduleDraft && !isScheduleIntent(userMessage)) {
        return null;
    }

    if (!professionals.length) {
        chatbotScheduleDraft = null;
        return 'No momento nao ha medicos cadastrados disponiveis para agendamento. Assim que a empresa cadastrar medicos ativos, eles aparecerao para agendar aqui no chat.';
    }

    if (!chatbotScheduleDraft) {
        chatbotScheduleDraft = { step: 'professional' };
        return `Claro, vamos agendar por aqui. Escolha o medico pelo numero:\n${formatProfessionalListForChat(professionals)}`;
    }

    if (normalizedMessage.includes('cancelar') || normalizedMessage.includes('sair')) {
        chatbotScheduleDraft = null;
        return 'Tudo bem, cancelei o agendamento pelo chat. Quando quiser tentar novamente, escreva "agendar consulta".';
    }

    if (chatbotScheduleDraft.step === 'professional') {
        const selectedIndex = Number((userMessage.match(/\d+/) || [])[0]) - 1;
        const selectedProfessional = professionals[selectedIndex] || professionals.find(professional =>
            normalizeText(professional.name).includes(normalizedMessage) ||
            normalizeText(professional.role).includes(normalizedMessage)
        );

        if (!selectedProfessional) {
            return `Nao encontrei esse medico na lista. Responda com o numero do profissional:\n${formatProfessionalListForChat(professionals)}`;
        }

        chatbotScheduleDraft = {
            step: 'date',
            professionalRegistry: selectedProfessional.registry
        };

        return `Perfeito. Para ${selectedProfessional.name} - ${selectedProfessional.role}, qual data voce deseja? Use DD/MM/AAAA, por exemplo 20/05/2026.`;
    }

    if (chatbotScheduleDraft.step === 'date') {
        const selectedProfessional = getProfessionalByRegistry(chatbotScheduleDraft.professionalRegistry);
        const date = parseDateFromMessage(userMessage);

        if (!selectedProfessional) {
            chatbotScheduleDraft = null;
            return 'Esse medico nao esta mais disponivel. Escreva "agendar consulta" para iniciar novamente.';
        }

        if (!isValidAppointmentDate(date)) {
            return 'Nao consegui entender a data ou ela esta no passado. Envie no formato DD/MM/AAAA, por exemplo 20/05/2026.';
        }

        const created = addAppointmentToDashboard(selectedProfessional, date);
        chatbotScheduleDraft = null;

        if (!created) {
            return 'Nao consegui criar o agendamento agora. Tente novamente pela aba Agendamentos.';
        }

        return `Consulta agendada com sucesso para ${formatDate(date)} com ${selectedProfessional.name}, em ${selectedProfessional.unit || 'Unidade a confirmar'}. Ja coloquei na area de consultas agendadas.`;
    }

    chatbotScheduleDraft = null;
    return null;
}

function buildChatbotReply(userMessage) {
    const normalizedMessage = normalizeText(userMessage);
    const appointments = getAppointmentData();
    const professionals = loadRegisteredProfessionals();

    const schedulingReply = handleChatbotScheduling(userMessage);
    if (schedulingReply) {
        return schedulingReply;
    }

    if (normalizedMessage.includes('oi') || normalizedMessage.includes('ola') || normalizedMessage.includes('bom dia') || normalizedMessage.includes('boa tarde') || normalizedMessage.includes('boa noite')) {
        return 'Ola. Eu posso te ajudar com agendamentos, consultas marcadas, preparo, documentos, responsaveis e uso do portal. Me diga o que voce precisa fazer agora.';
    }

    if (normalizedMessage.includes('emergencia') || normalizedMessage.includes('urgente') || normalizedMessage.includes('falta de ar') || normalizedMessage.includes('dor forte') || normalizedMessage.includes('desmaio') || normalizedMessage.includes('sangramento')) {
        return 'Se for uma urgencia, procure atendimento imediato na unidade de emergencia mais proxima ou acione o servico de emergencia da sua regiao. O chatbot nao substitui avaliacao medica em situacoes graves.';
    }

    if (normalizedMessage.includes('agendar') || normalizedMessage.includes('marcar') || normalizedMessage.includes('consulta nova')) {
        if (!professionals.length) {
            return 'No momento nao ha medicos cadastrados disponiveis para agendamento. Assim que a empresa cadastrar medicos ativos, eles aparecerao em Agendamentos > Novo Agendamento.';
        }

        const specialties = Array.from(new Set(professionals.map(professional => professional.role))).slice(0, 4).join(', ');
        return `Temos ${professionals.length} medico(s) disponivel(is)${specialties ? `, incluindo ${specialties}` : ''}. Escreva "agendar consulta" para eu marcar pelo chat.`;
    }

    if (normalizedMessage.includes('proximo') || normalizedMessage.includes('minhas consultas') || normalizedMessage.includes('agendamento') || normalizedMessage.includes('horario')) {
        if (!appointments.length) {
            return 'Voce ainda nao possui consultas agendadas. Para marcar uma, va em Agendamentos e clique em Novo Agendamento.';
        }

        const nextAppointment = appointments[0];
        return `Sua proxima consulta esta marcada para ${formatDate(nextAppointment.date)} com ${nextAppointment.doctor}, em ${nextAppointment.hospital}, na especialidade ${nextAppointment.specialty}.`;
    }

    if (normalizedMessage.includes('desmarcar') || normalizedMessage.includes('cancelar') || normalizedMessage.includes('remarcar')) {
        return 'Para desmarcar, abra Agendamentos e clique em Desmarcar na consulta desejada. O sistema permite cancelar apenas com no minimo 2 semanas de antecedencia.';
    }

    if (normalizedMessage.includes('documento') || normalizedMessage.includes('levar') || normalizedMessage.includes('exame') || normalizedMessage.includes('preparo')) {
        return 'Para a consulta, leve documento com foto, CPF, carteirinha do plano se houver, exames recentes e receitas em uso. Se a consulta tiver preparo especifico, confirme com a unidade antes do atendimento.';
    }

    if (normalizedMessage.includes('responsavel') || normalizedMessage.includes('autorizado') || normalizedMessage.includes('permissao')) {
        return 'Voce pode gerenciar responsaveis na aba Responsaveis. La e possivel adicionar contatos autorizados e definir permissoes como ver agendamentos, registros e enviar mensagens.';
    }

    if (normalizedMessage.includes('cpf') || normalizedMessage.includes('perfil') || normalizedMessage.includes('meus dados') || normalizedMessage.includes('cadastro')) {
        return 'Seus dados principais ficam em Meu Perfil. Confira nome, CPF e responsavel cadastrado. Para alterar informacoes sensiveis, procure o suporte da unidade responsavel.';
    }

    if (normalizedMessage.includes('medico') || normalizedMessage.includes('profissional') || normalizedMessage.includes('especialidade')) {
        if (!professionals.length) {
            return 'Ainda nao ha medicos cadastrados disponiveis no sistema. Quando houver, eles aparecerao em Buscar Atendimento e no modal de Novo Agendamento.';
        }

        return `Encontrei ${professionals.length} medico(s) disponivel(is). Voce pode ver as especialidades em Buscar Atendimento ou iniciar um agendamento pela aba Agendamentos.`;
    }

    if (normalizedMessage.includes('obrigad')) {
        return 'Por nada. Quando precisar, me chame por aqui e eu te ajudo a navegar pelo portal.';
    }

    return 'Entendi. Posso te ajudar com: agendar consulta, ver proximos agendamentos, saber o que levar, desmarcar consulta, gerenciar responsaveis ou conferir dados do perfil. Escreva uma dessas opcoes para eu te orientar.';
}

function isScheduleIntent(message) {
    const normalizedMessage = normalizeText(message);
    return normalizedMessage.includes('agendar') ||
        normalizedMessage.includes('marcar') ||
        normalizedMessage.includes('consulta nova');
}

function renderMessageContacts() {
    const contactsContainer = document.getElementById('messageContactsList');
    if (!contactsContainer) return;

    const contacts = getMessageContacts();

    if (!contacts.length) {
        contactsContainer.innerHTML = `
            <div class="chat-contacts-empty">
                <i class="ph ph-user-list"></i>
                <p>Voce ainda nao possui profissionais vinculados para conversar.</p>
            </div>
        `;
        activeChatContactKey = '';
        renderActiveConversation();
        return;
    }

    if (!contacts.some(contact => contact.key === activeChatContactKey)) {
        activeChatContactKey = contacts[0].key;
    }

    contactsContainer.innerHTML = '';

    contacts.forEach(contact => {
        ensureConversationExists(contact.key);

        const button = document.createElement('button');
        button.type = 'button';
        button.className = `chat-contact-card${contact.key === activeChatContactKey ? ' active' : ''}`;
        button.innerHTML = `
            <strong>${escapeHTML(contact.name)}</strong>
            <span>${escapeHTML(contact.specialty)}</span>
            <small>${escapeHTML(contact.hospital)}</small>
        `;
        button.addEventListener('click', () => {
            activeChatContactKey = contact.key;
            renderMessageContacts();
            renderActiveConversation();
        });
        contactsContainer.appendChild(button);
    });
}

function renderActiveConversation() {
    const messagesList = document.getElementById('chatMessagesList');
    const contactName = document.getElementById('chatContactName');
    const contactMeta = document.getElementById('chatContactMeta');
    const messageInput = document.getElementById('messageInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const quickActions = document.getElementById('chatbotQuickActions');

    if (!messagesList || !contactName || !contactMeta || !messageInput || !sendMessageButton) return;

    const contact = getActiveContact();

    if (!contact) {
        contactName.textContent = CHATBOT_CONTACT.name;
        contactMeta.textContent = 'Chatbot de apoio ao paciente.';
        messageInput.value = '';
        messageInput.disabled = false;
        sendMessageButton.disabled = false;
        if (quickActions) quickActions.innerHTML = '';
        messagesList.innerHTML = `
            <div class="chat-empty">
                <i class="ph ph-chat-circle-dots"></i>
                <p>Envie uma mensagem para iniciar o atendimento virtual.</p>
            </div>
        `;
        return;
    }

    const messages = ensureConversationExists(contact.key);
    contactName.textContent = contact.name;
    contactMeta.textContent = contact.type === 'bot'
        ? 'Chatbot de apoio ao paciente. Para urgencias, procure atendimento imediato.'
        : `${contact.specialty} - ${contact.hospital} - Resposta assistida por IA.`;
    messageInput.disabled = false;
    sendMessageButton.disabled = false;

    messagesList.innerHTML = '';

    messages.forEach(message => {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${message.sender}`;
        bubble.innerHTML = `
            <div>${escapeHTML(message.content)}</div>
            <span class="chat-bubble-meta">${escapeHTML(message.sender === 'patient' ? getPatientName() : contact.name)} - ${escapeHTML(message.timestamp)}</span>
        `;
        messagesList.appendChild(bubble);
    });

    renderChatbotQuickActions(contact);
    messagesList.scrollTop = messagesList.scrollHeight;
}

function renderChatbotQuickActions(contact) {
    const quickActions = document.getElementById('chatbotQuickActions');
    const messageInput = document.getElementById('messageInput');
    if (!quickActions || !messageInput) return;

    if (contact.type !== 'bot') {
        quickActions.innerHTML = '';
        return;
    }

    quickActions.innerHTML = CHATBOT_QUICK_ACTIONS.map(action => `
        <button type="button" class="chatbot-chip" data-message="${escapeHTML(action)}">${escapeHTML(action)}</button>
    `).join('');

    quickActions.querySelectorAll('.chatbot-chip').forEach(button => {
        button.addEventListener('click', () => {
            const message = button.dataset.message || '';
            messageInput.value = '';
            sendPatientMessage(message);
        });
    });
}

function appendMessageToConversation(contactKey, message) {
    const conversations = loadStoredConversations();
    const currentMessages = Array.isArray(conversations[contactKey]) ? conversations[contactKey] : [];
    currentMessages.push(message);
    conversations[contactKey] = currentMessages;
    saveStoredConversations(conversations);
}

function sendPatientMessage(content) {
    const contact = getActiveContact();
    if (!contact) return;

    appendMessageToConversation(contact.key, {
        sender: 'patient',
        content,
        timestamp: formatDateTime()
    });

    renderActiveConversation();
    renderMessageContacts();

    window.setTimeout(() => {
        appendMessageToConversation(contact.key, {
            sender: contact.type === 'bot' ? 'bot' : 'professional',
            content: buildAiReply(contact, content),
            timestamp: formatDateTime()
        });
        renderActiveConversation();
    }, 900);
}

function renderOverviewAppointments() {
    const tableBody = document.getElementById('overviewAppointmentsTable');
    if (!tableBody) return;

    const appointments = getAppointmentData();
    tableBody.innerHTML = '';

    if (!appointments.length) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">Nenhum agendamento encontrado.</td>
            </tr>
        `;
        return;
    }

    appointments.slice(0, 4).forEach(appointment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${appointment.specialty}</td>
            <td>${appointment.doctor}</td>
            <td>${appointment.hospital}</td>
            <td>${formatDate(appointment.date)}</td>
        `;
        tableBody.appendChild(row);
    });
}

function updateOverviewCards() {
    const appointments = getAppointmentData();
    const totalAppointments = document.getElementById('totalAppointments');
    const nextAppointmentDate = document.getElementById('nextAppointmentDate');
    const specialtyCount = document.getElementById('specialtyCount');
    const favoriteHospital = document.getElementById('favoriteHospital');

    if (totalAppointments) {
        totalAppointments.innerText = appointments.length;
    }

    if (nextAppointmentDate) {
        nextAppointmentDate.innerText = appointments.length ? formatDate(appointments[0].date) : '--';
    }

    if (specialtyCount) {
        specialtyCount.innerText = new Set(appointments.map(appointment => appointment.specialty)).size;
    }

    if (favoriteHospital) {
        favoriteHospital.innerText = appointments.length ? appointments[0].hospital : 'Nenhum';
    }
}

function renderAppointmentsState() {
    const list = document.getElementById('appointmentsList');
    if (!list) return;

    const cards = getAppointmentCards();
    const emptyState = list.querySelector('.empty-state');

    if (cards.length > 0) {
        if (emptyState) {
            emptyState.remove();
        }
        return;
    }

    if (!emptyState) {
        const message = document.createElement('div');
        message.className = 'empty-state';
        message.innerHTML = `
            <i class="ph ph-calendar-x"></i>
            <p>Voce ainda nao possui consultas agendadas.</p>
        `;
        list.appendChild(message);
    }
}

function addAppointmentToDashboard(selectedProfessional, date) {
    const appointmentsList = document.getElementById('appointmentsList');
    if (!appointmentsList || !selectedProfessional || !date) return false;

    const specialty = selectedProfessional.role;
    const unit = selectedProfessional.unit || 'Unidade a confirmar';
    const appointmentCard = document.createElement('div');
    appointmentCard.className = 'appointment-card';
    appointmentCard.dataset.date = date;
    appointmentCard.dataset.specialty = specialty;
    appointmentCard.dataset.doctor = selectedProfessional.name;
    appointmentCard.dataset.hospital = unit;
    appointmentCard.innerHTML = `
        <div class="card-top">
            <span class="specialty-badge">${escapeHTML(specialty)}</span>
            <span class="date-tag">${formatDate(date)}</span>
        </div>
        <div class="card-body">
            <strong>${escapeHTML(selectedProfessional.name)}</strong>
            <span>${escapeHTML(unit)}</span>
        </div>
        <div class="card-actions">
            <button class="btn-secondary" type="button" onclick="switchTab('search')">Buscar outro horario</button>
            <button class="btn-danger" type="button" onclick="cancelAppointment(this)">Desmarcar</button>
        </div>
    `;

    appointmentsList.prepend(appointmentCard);
    refreshDashboard();
    switchTab('appointments');
    return true;
}

function refreshDashboard() {
    populateSearchFilters();
    updateOverviewCards();
    renderOverviewAppointments();
    renderAppointmentsState();
    renderMessageContacts();
    renderActiveConversation();
    renderGuardians();
    renderSuggestions();
}

async function handleLogout() {
    const result = await showPopup('Deseja realmente sair?', 'confirm');
    if (result) {
        window.location.href = 'login-paciente.html';
    }
}

async function filterResults() {
    const specialty = document.getElementById('searchSpecialty')?.value || '';
    const hospital = document.getElementById('searchHospital')?.value || '';
    const plan = document.getElementById('searchPlan')?.value || '';
    const button = document.querySelector('.btn-search-filter');

    if (button) {
        button.innerHTML = '<i class="ph ph-spinner-gap"></i> Buscando...';
        button.disabled = true;
    }

    setTimeout(async () => {
        const description = [specialty || 'todas as areas', hospital || 'todos os hospitais', plan || 'todos os planos'].join(', ');
        await showPopup(`Filtro aplicado para ${description}.`);

        if (button) {
            button.innerHTML = '<i class="ph ph-magnifying-glass"></i> Filtrar';
            button.disabled = false;
        }
    }, 800);
}

async function cancelAppointment(button) {
    const card = button.closest('.appointment-card');
    if (!card) return;

    const dateString = card.getAttribute('data-date');
    if (!dateString) return;

    const appointmentDate = parseAppointmentDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffInTime = appointmentDate.getTime() - today.getTime();
    const diffInDays = Math.ceil(diffInTime / (1000 * 3600 * 24));

    if (diffInDays < 14) {
        await showPopup('Atencao: cancelamentos devem ser feitos com no minimo 2 semanas de antecedencia.');
        return;
    }

    const result = await showPopup('Tem certeza que deseja desmarcar esta consulta?', 'confirm');
    if (result) {
        card.remove();
        refreshDashboard();
        await showPopup('Consulta removida com sucesso.');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-link');
    navButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    const overviewButton = document.getElementById('btnOverviewNewAppointment');
    if (overviewButton) {
        overviewButton.addEventListener('click', openModal);
    }

    const appointmentsButton = document.getElementById('btnGoAppointments');
    if (appointmentsButton) {
        appointmentsButton.addEventListener('click', () => switchTab('appointments'));
    }

    const appointmentForm = document.getElementById('formNewAppointment');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async event => {
            event.preventDefault();

            const date = document.getElementById('modalDate')?.value;
            const professionalRegistry = document.getElementById('modalProfessional')?.value;
            const specialty = document.getElementById('modalSpec')?.value;
            const unit = document.getElementById('modalUnit')?.value;
            const selectedProfessional = getProfessionalByRegistry(professionalRegistry);

            if (!selectedProfessional) {
                await showPopup('Selecione um profissional que esteja cadastrado no sistema.');
                return;
            }

            if (!date || !specialty) return;

            addAppointmentToDashboard(selectedProfessional, date);
            appointmentForm.reset();
            updateSelectedProfessionalDetails();
            closeModal();
            await showPopup(`Sucesso! Consulta com ${selectedProfessional.name} agendada para ${formatDate(date)}.`);
        });
    }

    const professionalSelect = document.getElementById('modalProfessional');
    if (professionalSelect) {
        professionalSelect.addEventListener('change', updateSelectedProfessionalDetails);
    }

    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', event => {
            event.preventDefault();

            const messageInput = document.getElementById('messageInput');
            const content = messageInput?.value.trim() || '';

            if (!content) return;

            sendPatientMessage(content);
            messageInput.value = '';
        });
    }

    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                closeModal();
            }
        });
    }

    const guardianModal = document.getElementById('guardianModal');
    if (guardianModal) {
        guardianModal.addEventListener('click', event => {
            if (event.target === guardianModal) {
                closeGuardianModal();
            }
        });
    }

    const guardianForm = document.getElementById('formNewGuardian');
    if (guardianForm) {
        guardianForm.addEventListener('submit', async event => {
            event.preventDefault();

            const name = document.getElementById('guardianName')?.value.trim();
            const relationship = document.getElementById('guardianRelationship')?.value;
            const phone = document.getElementById('guardianPhone')?.value.trim();
            const email = document.getElementById('guardianEmail')?.value.trim();

            if (!name || !relationship || !phone || !email) {
                await showPopup('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            const permissions = Array.from(document.querySelectorAll('input[name="permissions"]:checked'))
                .map(checkbox => checkbox.value);

            if (permissions.length === 0) {
                await showPopup('Selecione pelo menos uma permissão.');
                return;
            }

            const guardians = loadGuardians();
            const editIndex = guardianForm.dataset.editIndex;

            if (editIndex !== undefined && editIndex !== '') {
                // Atualizar responsável existente
                guardians[parseInt(editIndex)] = {
                    name,
                    relationship,
                    phone,
                    email,
                    permissions,
                    dateAdded: guardians[parseInt(editIndex)].dateAdded
                };
                await showPopup(`Responsável ${name} atualizado com sucesso.`);
            } else {
                // Adicionar novo responsável
                const today = new Date().toLocaleDateString('pt-BR');
                guardians.push({
                    name,
                    relationship,
                    phone,
                    email,
                    permissions,
                    dateAdded: today
                });
                await showPopup(`Responsável ${name} adicionado com sucesso.`);
            }

            saveGuardians(guardians);
            guardianForm.reset();
            delete guardianForm.dataset.editIndex;
            document.querySelector('.modal-header div h3').textContent = 'Adicionar Responsável';
            document.querySelector('button[type="submit"]').textContent = 'Adicionar Responsável';
            closeGuardianModal();
            renderGuardians();
        });
    }

    // Carregar dados do paciente
    function loadPatientData() {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const cpf = localStorage.getItem('patientCPF') || '';
        
        // Atualizar nome do paciente
        const profilePatientName = document.getElementById('profilePatientName');
        if (profilePatientName && user.name) {
            profilePatientName.textContent = user.name;
        }
        
        // Atualizar CPF do paciente
        const profilePatientCPF = document.getElementById('profilePatientCPF');
        if (profilePatientCPF && cpf) {
            // Formatar CPF (XXX.XXX.XXX-XX)
            const cpfFormatted = cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
            profilePatientCPF.textContent = cpfFormatted;
        }
        
        // Atualizar cabeçalho com nome do paciente
        const patientHeaderName = document.getElementById('patientHeaderName');
        if (patientHeaderName && user.name) {
            patientHeaderName.textContent = user.name;
        }
    }

    loadPatientData();
    populateProfessionalOptions();
    refreshDashboard();
});

window.openModal = openModal;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.handleLogout = handleLogout;
window.filterResults = filterResults;
window.cancelAppointment = cancelAppointment;
window.openGuardianModal = openGuardianModal;
window.closeGuardianModal = closeGuardianModal;
window.removeGuardian = removeGuardian;
window.editGuardian = editGuardian;
window.renderGuardians = renderGuardians;
window.scrollToSpecialty = scrollToSpecialty;
