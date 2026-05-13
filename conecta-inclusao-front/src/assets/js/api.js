// API base URL - ajuste conforme necessário
const API_BASE = 'http://localhost:3000/auth';

// Função para obter token do localStorage
export function getToken() {
    return localStorage.getItem('token');
}

// Função genérica para fazer requisições
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    try {
        const response = await fetch(url, { ...defaultOptions, ...options });
        const data = await response.json();
        return { ok: response.ok, status: response.status, data };
    } catch (error) {
        console.error('Erro na requisição:', error);
        return { ok: false, status: 0, data: { message: 'Erro de conexão' } };
    }
}

// Funções de registro
export async function registerPatient(data) {
    return apiRequest('/register/patient', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function registerDoctor(data) {
    return apiRequest('/register/doctor', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function registerClinic(data) {
    return apiRequest('/register/clinic', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

export async function registerProfessional(crm, name, especialidade, unidade, password, email, bio) {
    const token = getToken();
    if (!token) {
        return { ok: false, error: 'Token não encontrado' };
    }
    return apiRequest('/register/professional', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ crm, name, especialidade, unidade, password, email, bio })
    });
}

// Funções de login
export async function loginUniversal(data) {
    return apiRequest('/login/universal', {
        method: 'POST',
        body: JSON.stringify(data)
    });
}

// Função para obter dados do usuário (se necessário)
export async function getUserData(token) {
    return apiRequest('/user', {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });
}

// Função para obter perfil do usuário
export async function getUserProfile() {
    const token = getToken();
    if (!token) {
        return { ok: false, error: 'Token não encontrado' };
    }
    return apiRequest('/profile', {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });
}

// Função para obter agendamentos do paciente
export async function getPatientAppointments(pacienteId) {
    const token = getToken();
    if (!token) {
        return { ok: false, error: 'Token não encontrado' };
    }
    const response = await fetch(`http://localhost:3000/api/agendamentos/paciente/${pacienteId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        }
    });
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
}

// Função para obter médicos disponíveis
export async function getAvailableDoctors() {
    const response = await fetch(`${API_BASE}/doctors/available`);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
}