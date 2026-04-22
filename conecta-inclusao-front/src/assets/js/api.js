// Cliente API para comunicação com o backend
// Conecta Inclusão - API Client

const API_BASE_URL = 'http://localhost:3000'; // Configurar porta conforme seu backend

// ==========================================
// FUNÇÕES DE AUTENTICAÇÃO
// ==========================================

/**
 * Login universal - suporta Email, CRM, CNPJ ou CPF
 */
export async function loginUniversal(identifier, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier, password })
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.message || 'Erro ao fazer login' };
    }

    // Armazena token JWT
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return { ok: true, user: data.user, token: data.token };
  } catch (error) {
    console.error('Erro na requisição de login:', error);
    return { ok: false, error: 'Erro de conexão com o servidor' };
  }
}

/**
 * Registro de paciente com CPF
 */
export async function registerPatient(cpf, password, name, nomeResponsavel, tipoDeficiencia, dataNascimento) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/patient`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cpf,
        password,
        name,
        nomeResponsavel,
        tipoDeficiencia,
        dataNascimento
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.message || 'Erro ao registrar paciente' };
    }

    return { ok: true, data };
  } catch (error) {
    console.error('Erro na requisição de registro:', error);
    return { ok: false, error: 'Erro de conexão com o servidor' };
  }
}

/**
 * Registro de médico com CRM
 */
export async function registerDoctor(crm, password, name, especialidade, clinicaId) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/doctor`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        crm,
        password,
        name,
        especialidade,
        clinicaId
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.message || 'Erro ao registrar médico' };
    }

    return { ok: true, data };
  } catch (error) {
    console.error('Erro na requisição de registro:', error);
    return { ok: false, error: 'Erro de conexão com o servidor' };
  }
}

/**
 * Registro de clínica/empresa com CNPJ
 */
export async function registerClinic(cnpj, password, name, razaoSocial, endereco, cidade, estado, cep, telefone, responsavel) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register/clinic`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cnpj,
        password,
        name,
        razaoSocial,
        endereco,
        cidade,
        estado,
        cep,
        telefone,
        responsavel
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.message || 'Erro ao registrar clínica' };
    }

    return { ok: true, data };
  } catch (error) {
    console.error('Erro na requisição de registro:', error);
    return { ok: false, error: 'Erro de conexão com o servidor' };
  }
}

/**
 * Registra um profissional (médico) para uma clínica
 */
export async function registerProfessional(crm, name, especialidade, clinicaId, bio = null) {
  try {
    const token = getToken();
    
    if (!token) {
      return { ok: false, error: 'Você precisa estar autenticado' };
    }

    const response = await fetch(`${API_BASE_URL}/auth/register/professional`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        crm,
        name,
        especialidade,
        clinicaId,
        bio
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return { ok: false, error: data.message || 'Erro ao registrar profissional' };
    }

    return { ok: true, data };
  } catch (error) {
    console.error('Erro na requisição de registro:', error);
    return { ok: false, error: 'Erro de conexão com o servidor' };
  }
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

/**
 * Obtém o token JWT armazenado
 */
export function getToken() {
  return localStorage.getItem('token');
}

/**
 * Obtém os dados do usuário armazenados
 */
export function getUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

/**
 * Faz logout do usuário
 */
export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.clear();
}

/**
 * Faz uma requisição autenticada (com token JWT)
 */
export async function authenticatedRequest(endpoint, options = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  return response;
}

/**
 * Busca dados de CNPJ na API Brasil
 */
export async function fetchCnpjData(cnpj) {
  try {
    const cnpjDigits = cnpj.replace(/\D/g, '');
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjDigits}`);
    
    if (!response.ok) {
      return { ok: false, error: 'CNPJ não encontrado' };
    }

    const data = await response.json();
    return { ok: true, data };
  } catch (error) {
    console.error('Erro ao buscar dados de CNPJ:', error);
    return { ok: false, error: 'Erro ao buscar dados de CNPJ' };
  }
}

// ==========================================
// FUNÇÕES DE PERFIL/DADOS DO USUÁRIO
// ==========================================

/**
 * Busca dados da clínica do usuário
 */
export async function getClinicData() {
  const response = await authenticatedRequest('/clinic/profile');
  return response.json();
}

/**
 * Busca dados do perfil do médico
 */
export async function getDoctorProfile() {
  const response = await authenticatedRequest('/doctor/profile');
  return response.json();
}

/**
 * Busca dados do perfil do paciente
 */
export async function getPatientProfile() {
  const response = await authenticatedRequest('/patient/profile');
  return response.json();
}

/**
 * Atualiza dados do usuário
 */
export async function updateUserProfile(userData) {
  const response = await authenticatedRequest('/user/profile', {
    method: 'PUT',
    body: JSON.stringify(userData)
  });
  return response.json();
}

// ==========================================
// FUNÇÕES DE AGENDAMENTO
// ==========================================

/**
 * Busca agendamentos do paciente
 */
export async function getPatientAppointments() {
  const response = await authenticatedRequest('/appointments/patient');
  return response.json();
}

/**
 * Busca agendamentos do médico
 */
export async function getDoctorAppointments() {
  const response = await authenticatedRequest('/appointments/doctor');
  return response.json();
}

/**
 * Cria novo agendamento
 */
export async function createAppointment(pacienteId, medicoId, dataHora) {
  const response = await authenticatedRequest('/appointments', {
    method: 'POST',
    body: JSON.stringify({ pacienteId, medicoId, dataHora })
  });
  return response.json();
}

/**
 * Atualiza status de agendamento
 */
export async function updateAppointmentStatus(appointmentId, status) {
  const response = await authenticatedRequest(`/appointments/${appointmentId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  return response.json();
}

/**
 * Cancela agendamento
 */
export async function cancelAppointment(appointmentId) {
  const response = await authenticatedRequest(`/appointments/${appointmentId}`, {
    method: 'DELETE'
  });
  return response.json();
}

// ==========================================
// FUNÇÕES DE RELATÓRIO
// ==========================================

/**
 * Cria novo relatório médico
 */
export async function createReport(agendamentoId, descricao, prescricao) {
  const response = await authenticatedRequest('/reports', {
    method: 'POST',
    body: JSON.stringify({ agendamentoId, descricao, prescricao })
  });
  return response.json();
}

/**
 * Busca relatório de um agendamento
 */
export async function getReport(appointmentId) {
  const response = await authenticatedRequest(`/reports/appointment/${appointmentId}`);
  return response.json();
}
