import { getUserProfile, getPatientAppointments, getAvailableDoctors } from './api.js';

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
let userProfile = null;
let patientAppointments = [];
let availableDoctors = [];

// Função para carregar informações do usuário
async function loadUserInfo() {
    try {
        const profileResponse = await getUserProfile();
        if (profileResponse.ok) {
            userProfile = profileResponse.data;
            updateUserInterface();
        } else {
            console.error('Erro ao carregar perfil:', profileResponse.data);
            userProfile = null;
        }

        if (userProfile && userProfile.id) {
            const appointmentsResponse = await getPatientAppointments(userProfile.id);
            if (appointmentsResponse.ok) {
                patientAppointments = appointmentsResponse.data.data || [];
            } else {
                console.error('Erro ao carregar agendamentos:', appointmentsResponse.data);
                patientAppointments = [];
            }
        } else {
            patientAppointments = [];
        }

        // Carregar médicos disponíveis
        const doctorsResponse = await getAvailableDoctors();
        if (doctorsResponse.ok) {
            availableDoctors = doctorsResponse.data || [];
        } else {
            console.error('Erro ao carregar médicos:', doctorsResponse.data);
            availableDoctors = [];
        }

        // Sempre atualizar o dashboard após carregar tudo
        updateDashboardData();
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        userProfile = null;
        patientAppointments = [];
        availableDoctors = [];
        updateDashboardData();
    }
}

// Função para atualizar a interface com dados do usuário
function updateUserInterface() {
    if (!userProfile) return;

    const patientHeaderName = document.getElementById('patientHeaderName');
    if (patientHeaderName) {
        patientHeaderName.textContent = userProfile.name || 'Paciente';
    }

    const patientHeaderSubtitle = document.getElementById('patientHeaderSubtitle');
    if (patientHeaderSubtitle) {
        patientHeaderSubtitle.textContent = 'Paciente ativo';
    }

    const patientAvatar = document.getElementById('patientAvatar');
    if (patientAvatar) {
        patientAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'Paciente')}&background=0073e6&color=fff`;
    }

    // Atualizar perfil
    const profilePatientName = document.getElementById('profilePatientName');
    if (profilePatientName) {
        profilePatientName.textContent = userProfile.name || '';
    }

    const profilePatientCPF = document.getElementById('profilePatientCPF');
    if (profilePatientCPF && userProfile.cpf) {
        const cpfFormatted = userProfile.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        profilePatientCPF.textContent = cpfFormatted;
    }

    const profileBirthDate = document.getElementById('profileBirthDate');
    if (profileBirthDate && userProfile.data_nascimento) {
        const date = new Date(userProfile.data_nascimento);
        const formattedDate = date.toLocaleDateString('pt-BR');
        profileBirthDate.textContent = formattedDate;
    }

    const profilePatientResponsible = document.getElementById('profilePatientResponsible');
    if (profilePatientResponsible) {
        profilePatientResponsible.textContent = userProfile.nome_responsavel || 'Não informado';
    }

    const profileDisabilityType = document.getElementById('profileDisabilityType');
    if (profileDisabilityType) {
        profileDisabilityType.textContent = userProfile.tipo_deficiencia || 'Não informado';
    }

    const profilePlan = document.getElementById('profilePlan');
    if (profilePlan) {
        profilePlan.textContent = userProfile.plano_atual || 'Não informado';
    }

    const profilePreferredUnit = document.getElementById('profilePreferredUnit');
    if (profilePreferredUnit) {
        // Por enquanto mantém o valor padrão, pode ser implementado depois
        profilePreferredUnit.textContent = 'Hospital Central';
    }
}

// Função para atualizar dados do dashboard
function updateDashboardData() {
    const totalAppointments = document.getElementById('totalAppointments');
    if (totalAppointments) {
        totalAppointments.textContent = patientAppointments.length;
    }

    const nextAppointmentDate = document.getElementById('nextAppointmentDate');
    if (nextAppointmentDate) {
        if (patientAppointments.length > 0) {
            const nextAppointment = patientAppointments[0]; // Já ordenado por data
            nextAppointmentDate.textContent = formatDateTime(nextAppointment.data_agendamento);
        } else {
            nextAppointmentDate.textContent = '--';
        }
    }

    const specialtyCount = document.getElementById('specialtyCount');
    if (specialtyCount) {
        const uniqueSpecialties = new Set(patientAppointments.map(app => app.profissional_especialidade).filter(Boolean));
        specialtyCount.textContent = uniqueSpecialties.size;
    }

    // Atualizar hospital frequente
    const favoriteHospital = document.getElementById('favoriteHospital');
    if (favoriteHospital) {
        console.log('Atualizando hospital frequente. Agendamentos:', patientAppointments.length);
        if (patientAppointments && patientAppointments.length > 0) {
            const hospitalCounts = {};
            patientAppointments.forEach(app => {
                const hospital = app.clinica_nome;
                console.log('Hospital do agendamento:', hospital);
                if (hospital) {
                    hospitalCounts[hospital] = (hospitalCounts[hospital] || 0) + 1;
                }
            });

            console.log('Contagem de hospitais:', hospitalCounts);

            if (Object.keys(hospitalCounts).length > 0) {
                const mostFrequent = Object.keys(hospitalCounts).reduce((a, b) =>
                    hospitalCounts[a] > hospitalCounts[b] ? a : b
                );
                console.log('Hospital mais frequente:', mostFrequent);
                favoriteHospital.textContent = mostFrequent;
            } else {
                favoriteHospital.textContent = 'Nenhum';
            }
        } else {
            favoriteHospital.textContent = 'Nenhum';
        }
        console.log('Hospital frequente final:', favoriteHospital.textContent);
    }

    // Atualizar plano atual
    const currentPlan = document.getElementById('currentPlan');
    console.log('Atualizando plano atual. userProfile:', userProfile);
    if (currentPlan && userProfile) {
        const planValue = userProfile.plano_atual || 'Não informado';
        console.log('Plano atual:', planValue);
        currentPlan.textContent = planValue;
    } else {
        console.log('Elemento currentPlan ou userProfile não encontrado');
    }
}

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

    const professionals = availableDoctors;
    const specialtiesMap = new Map();

    // Agrupar profissionais por especialidade
    professionals.forEach(prof => {
        if (!specialtiesMap.has(prof.especialidade)) {
            specialtiesMap.set(prof.especialidade, []);
        }
        specialtiesMap.get(prof.especialidade).push(prof);
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
            <span>${firstProf.unidade || 'Unidade não informada'}</span>
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
        const professionals = availableDoctors;
        const prof = professionals.find(p => p.especialidade === specialty);
        if (prof) {
            select.value = prof.crm;
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
    const date = new Date(dateString);
    if (!Number.isNaN(date.getTime())) {
        return date;
    }

    const normalized = dateString.replace(' ', 'T');
    return new Date(normalized);
}

function formatDate(dateString) {
    const date = parseAppointmentDate(dateString);
    if (Number.isNaN(date.getTime())) {
        return dateString;
    }
    return date.toLocaleDateString('pt-BR');
}

function combineDateTime(date, time) {
    return `${date}T${time}:00`;
}

function formatProfessionalListForChat(professionals) {
    return professionals
        .map((professional, index) => `${index + 1}. ${professional.name} - ${professional.especialidade} (${professional.unidade || 'Unidade a confirmar'})`)
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
    const parsed = typeof date === 'string' ? parseAppointmentDate(date) : date;
    if (Number.isNaN(parsed.getTime())) {
        return String(date);
    }
    return parsed.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getAppointmentCards() {
    return Array.from(document.querySelectorAll('.appointment-card'));
}

function getProfessionalByRegistry(crm) {
    return availableDoctors.find(doctor => doctor.crm === crm) || null;
}

function updateSelectedProfessionalDetails() {
    const professionalSelect = document.getElementById('modalProfessional');
    const specialtyInput = document.getElementById('modalSpec');
    const unitInput = document.getElementById('modalUnit');

    if (!professionalSelect || !specialtyInput || !unitInput) return;

    const selectedProfessional = getProfessionalByRegistry(professionalSelect.value);

    specialtyInput.value = selectedProfessional?.especialidade || '';
    unitInput.value = selectedProfessional?.unidade || '';
}

function populateProfessionalOptions() {
    const professionalSelect = document.getElementById('modalProfessional');
    if (!professionalSelect) return;

    const professionals = availableDoctors;
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
        option.value = professional.crm;
        option.textContent = `${professional.name} - ${professional.especialidade} (${professional.unidade || 'Unidade não informada'})`;
        professionalSelect.appendChild(option);
    });

    if (professionals.some(professional => professional.crm === currentValue)) {
        professionalSelect.value = currentValue;
    }

    updateSelectedProfessionalDetails();
}

function populateSearchFilters() {
    const specialtySelect = document.getElementById('searchSpecialty');
    const unitSelect = document.getElementById('searchHospital');
    if (!specialtySelect || !unitSelect) return;

    const professionals = availableDoctors;
    const specialties = Array.from(new Set(professionals.map(professional => professional.especialidade).filter(Boolean))).sort();
    const units = Array.from(new Set(professionals.map(professional => professional.unidade).filter(Boolean))).sort();

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
    return patientAppointments.map(app => ({
        specialty: app.profissional_especialidade || '',
        doctor: app.profissional_nome || '',
        crm: app.profissional_crm || '',
        hospital: app.clinica_nome || '',
        date: app.data_agendamento || '',
        status: app.status || '',
        id: app.id
    })).sort((a, b) => new Date(a.date) - new Date(b.date));
}

function getPatientName() {
    return userProfile ? userProfile.name : 'Paciente';
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
    const professionals = availableDoctors;
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
            normalizeText(professional.especialidade).includes(normalizedMessage)
        );

        if (!selectedProfessional) {
            return `Nao encontrei esse medico na lista. Responda com o numero do profissional:\n${formatProfessionalListForChat(professionals)}`;
        }

        chatbotScheduleDraft = {
            step: 'date',
            professionalRegistry: selectedProfessional.crm
        };

        return `Perfeito. Para ${selectedProfessional.name} - ${selectedProfessional.especialidade}, qual data voce deseja? Use DD/MM/AAAA, por exemplo 20/05/2026.`;
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
    const professionals = availableDoctors;

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

        const specialties = Array.from(new Set(professionals.map(professional => professional.especialidade))).slice(0, 4).join(', ');
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
            <td>${appointment.doctor}${appointment.crm ? ` (CRM: ${appointment.crm})` : ''}</td>
            <td>${appointment.hospital}</td>
            <td>${formatDateTime(appointment.date)}</td>
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
        nextAppointmentDate.innerText = appointments.length ? formatDateTime(appointments[0].date) : '--';
    }

    if (specialtyCount) {
        specialtyCount.innerText = new Set(appointments.map(appointment => appointment.specialty)).size;
    }

    if (favoriteHospital) {
        favoriteHospital.innerText = appointments.length ? appointments[0].hospital : 'Nenhum';
    }
}

function renderPatientAppointments() {
    const appointmentsList = document.getElementById('appointmentsList');
    if (!appointmentsList) return;

    // Limpar agendamentos locais (se houver)
    const existingCards = appointmentsList.querySelectorAll('.appointment-card');
    existingCards.forEach(card => card.remove());

    // Renderizar agendamentos da API
    patientAppointments.forEach(appointment => {
        const appointmentCard = document.createElement('div');
        appointmentCard.className = 'appointment-card';
        appointmentCard.dataset.id = appointment.id;
        appointmentCard.dataset.date = appointment.data_agendamento;
        appointmentCard.dataset.status = appointment.status;

        const statusClass = appointment.status === 'confirmado' ? 'status-confirmed' :
                           appointment.status === 'cancelado' ? 'status-cancelled' :
                           appointment.status === 'realizado' ? 'status-completed' : 'status-pending';

        appointmentCard.innerHTML = `
            <div class="card-top">
                <span class="specialty-badge">${escapeHTML(appointment.profissional_especialidade || 'Especialidade não informada')}</span>
                <span class="date-tag ${statusClass}">${formatDateTime(appointment.data_agendamento)}</span>
            </div>
            <div class="card-body">
                <strong>${escapeHTML(appointment.profissional_nome || 'Médico não informado')}</strong>
                ${appointment.profissional_crm ? `<span>CRM: ${appointment.profissional_crm}</span>` : ''}
                <span>${escapeHTML(appointment.clinica_nome || 'Clínica não informada')}</span>
                <span class="appointment-status">Status: ${appointment.status || 'Pendente'}</span>
            </div>
            <div class="card-actions">
                <button class="btn-secondary" type="button" onclick="switchTab('messages')">Enviar mensagem</button>
                ${appointment.status === 'confirmado' ? '<button class="btn-danger" type="button" onclick="cancelAppointmentApi(this)">Desmarcar</button>' : ''}
            </div>
        `;

        appointmentsList.appendChild(appointmentCard);
    });

    // Atualizar estado vazio se necessário
    renderAppointmentsState();
}

function addAppointmentToDashboard(selectedProfessional, date) {
    const appointmentsList = document.getElementById('appointmentsList');
    if (!appointmentsList || !selectedProfessional || !date) return false;

    const specialty = selectedProfessional.especialidade;
    const unit = selectedProfessional.unidade || 'Unidade a confirmar';
    const appointmentCard = document.createElement('div');
    appointmentCard.className = 'appointment-card';
    appointmentCard.dataset.date = date;
    appointmentCard.dataset.specialty = specialty;
    appointmentCard.dataset.doctor = selectedProfessional.name;
    appointmentCard.dataset.hospital = unit;
    appointmentCard.innerHTML = `
        <div class="card-top">
            <span class="specialty-badge">${escapeHTML(specialty)}</span>
            <span class="date-tag">${formatDateTime(date)}</span>
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
    renderPatientAppointments();
    renderMessageContacts();
    renderActiveConversation();
    renderGuardians();
    renderSuggestions();
}

async function handleLogout() {
    const result = await showPopup('Deseja realmente sair?', 'confirm');
    if (result) {
        localStorage.removeItem('token');
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

document.addEventListener('DOMContentLoaded', async () => {
    await loadUserInfo();
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
            const time = document.getElementById('modalTime')?.value;
            const professionalRegistry = document.getElementById('modalProfessional')?.value;
            const selectedProfessional = getProfessionalByRegistry(professionalRegistry);

            if (!selectedProfessional) {
                await showPopup('Selecione um profissional que esteja cadastrado no sistema.');
                return;
            }

            if (!date || !time) {
                await showPopup('Informe a data e o horário do agendamento.');
                return;
            }

            const dateTime = combineDateTime(date, time);
            addAppointmentToDashboard(selectedProfessional, dateTime);
            appointmentForm.reset();
            updateSelectedProfessionalDetails();
            closeModal();
            await showPopup(`Sucesso! Consulta com ${selectedProfessional.name} agendada para ${formatDateTime(dateTime)}.`);
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

function renderAppointmentsState() {
    const list = document.getElementById('appointmentsList');
    if (!list) return;

    const localCards = list.querySelectorAll('.appointment-card');
    const hasApiAppointments = patientAppointments && patientAppointments.length > 0;
    const emptyState = list.querySelector('.empty-state');

    if (localCards.length > 0 || hasApiAppointments) {
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

async function cancelAppointmentApi(button) {
    const card = button.closest('.appointment-card');
    if (!card) return;

    const appointmentId = card.dataset.id;
    if (!appointmentId) return;

    const result = await showPopup('Tem certeza que deseja cancelar este agendamento?', 'confirm');
    if (!result) return;

    try {
        const response = await fetch(`${API_BASE_URL}/agendamentos/${appointmentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            await showPopup('Agendamento cancelado com sucesso!');
            // Recarregar agendamentos
            await loadPatientAppointments();
            renderPatientAppointments();
            updateOverviewCards();
            renderOverviewAppointments();
        } else {
            const errorData = await response.json();
            await showPopup(`Erro ao cancelar agendamento: ${errorData.message || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        await showPopup('Erro ao cancelar agendamento. Tente novamente.');
    }
}

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
