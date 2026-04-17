// Serviço avançado de autenticação com suporte a CRM, CNPJ e CPF
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";

const MAX = Number(process.env.MAX_LOGIN_ATTEMPTS || 3);
const LOCK_MINUTES = Number(process.env.LOCK_MINUTES || 5);

function nowPlusMinutes(min) {
  return new Date(Date.now() + min * 60 * 1000);
}

// Detecta o tipo de identificador baseado no padrão
function detectIdentifierType(identifier) {
  const trimmed = identifier.trim();
  
  // CPF: 11 dígitos (xxx.xxx.xxx-xx ou xxxxxxxxxxx)
  if (/^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/.test(trimmed)) {
    return { type: 'cpf', value: trimmed.replace(/\D/g, '') };
  }
  
  // CNPJ: 14 dígitos (xx.xxx.xxx/xxxx-xx ou xxxxxxxxxxxxxx)
  if (/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$|^\d{14}$/.test(trimmed)) {
    return { type: 'cnpj', value: trimmed.replace(/\D/g, '') };
  }
  
  // CRM: geralmente 4-7 caracteres alfanuméricos
  if (/^[A-Z0-9]{4,7}$/i.test(trimmed)) {
    return { type: 'crm', value: trimmed.toUpperCase() };
  }
  
  // Email: contém @
  if (trimmed.includes('@')) {
    return { type: 'email', value: trimmed.toLowerCase() };
  }
  
  return null;
}

// Login com CRM (Médico)
async function loginWithCRM(crm, password) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.password_hash, u.profile, u.status, 
              u.failed_attempts, u.locked_until, m.crm
       FROM users u
       INNER JOIN medicos m ON u.id = m.usuario_id
       WHERE m.crm = ? AND u.profile = 'medico' LIMIT 1`,
      [crm]
    );
    
    if (rows.length === 0) {
      return { ok: false, statusCode: 401, message: "Credenciais inválidas." };
    }
    
    return await validateUserPassword(rows[0], password, 'medico');
  } catch (err) {
    console.error("Erro em loginWithCRM:", err);
    return { ok: false, statusCode: 500, message: "Erro interno do servidor." };
  }
}

// Login com CNPJ (Clínica)
async function loginWithCNPJ(cnpj, password) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.password_hash, u.profile, u.status, 
              u.failed_attempts, u.locked_until, c.cnpj
       FROM users u
       INNER JOIN clinicas c ON u.id = c.usuario_id
       WHERE c.cnpj = ? AND u.profile = 'clinica' LIMIT 1`,
      [cnpj]
    );
    
    if (rows.length === 0) {
      return { ok: false, statusCode: 401, message: "Credenciais inválidas." };
    }
    
    return await validateUserPassword(rows[0], password, 'clinica');
  } catch (err) {
    console.error("Erro em loginWithCNPJ:", err);
    return { ok: false, statusCode: 500, message: "Erro interno do servidor." };
  }
}

// Login com CPF (Paciente)
async function loginWithCPF(cpf, password) {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.password_hash, u.profile, u.status, 
              u.failed_attempts, u.locked_until, p.cpf
       FROM users u
       INNER JOIN pacientes p ON u.id = p.usuario_id
       WHERE p.cpf = ? AND u.profile = 'paciente' LIMIT 1`,
      [cpf]
    );
    
    if (rows.length === 0) {
      return { ok: false, statusCode: 401, message: "Credenciais inválidas." };
    }
    
    return await validateUserPassword(rows[0], password, 'paciente');
  } catch (err) {
    console.error("Erro em loginWithCPF:", err);
    return { ok: false, statusCode: 500, message: "Erro interno do servidor." };
  }
}

// Login com Email (compatibilidade com sistema antigo)
async function loginWithEmail(email, password) {
  try {
    const [rows] = await pool.execute(
      `SELECT id, name, email, password_hash, profile, status, failed_attempts, locked_until
       FROM users
       WHERE email = ? LIMIT 1`,
      [email]
    );
    
    if (rows.length === 0) {
      return { ok: false, statusCode: 401, message: "Credenciais inválidas." };
    }
    
    return await validateUserPassword(rows[0], password);
  } catch (err) {
    console.error("Erro em loginWithEmail:", err);
    return { ok: false, statusCode: 500, message: "Erro interno do servidor." };
  }
}

// Valida senha e retorna token JWT
async function validateUserPassword(user, password, expectedProfile = null) {
  // Verifica se o perfil do usuário corresponde ao esperado
  if (expectedProfile && user.profile !== expectedProfile) {
    return { ok: false, statusCode: 401, message: "Credenciais inválidas." };
  }
  
  // Verifica se o usuário está ativo
  if (user.status !== "ACTIVE") {
    return { ok: false, statusCode: 403, message: "Usuário inativo." };
  }
  
  // Verifica bloqueio temporário
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return { ok: false, statusCode: 423, message: "Usuário bloqueado temporariamente." };
  }
  
  // Valida a senha
  const passOk = await bcrypt.compare(password, user.password_hash);
  
  if (!passOk) {
    const newFails = Math.min((user.failed_attempts || 0) + 1, 255);
    
    if (newFails >= MAX) {
      const lockedUntil = nowPlusMinutes(LOCK_MINUTES);
      await pool.execute(
        `UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?`,
        [newFails, lockedUntil, user.id]
      );
      return { ok: false, statusCode: 423, message: "Múltiplas tentativas incorretas. Usuário bloqueado por 5 minutos." };
    }
    
    await pool.execute(
      `UPDATE users SET failed_attempts = ? WHERE id = ?`,
      [newFails, user.id]
    );
    
    return { ok: false, statusCode: 401, message: "Credenciais inválidas." };
  }
  
  // Limpa tentativas falhadas em caso de login bem-sucedido
  if ((user.failed_attempts || 0) > 0 || user.locked_until) {
    await pool.execute(
      `UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?`,
      [user.id]
    );
  }
  
  // Gera token JWT
  const token = jwt.sign(
    { sub: String(user.id), profile: user.profile },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
  );
  
  return {
    ok: true,
    statusCode: 200,
    data: {
      token,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        profile: user.profile 
      }
    }
  };
}

// Função principal de login universal que detecta o tipo de identificador
export async function loginUniversal({ identifier, password }) {
  if (!identifier || !password) {
    return { ok: false, statusCode: 400, message: "Identificador e senha são obrigatórios." };
  }
  
  const identifierInfo = detectIdentifierType(identifier);
  
  if (!identifierInfo) {
    return { ok: false, statusCode: 400, message: "Formato de identificador inválido." };
  }
  
  // Roteia para a função apropriada baseado no tipo
  switch (identifierInfo.type) {
    case 'crm':
      return await loginWithCRM(identifierInfo.value, password);
    case 'cnpj':
      return await loginWithCNPJ(identifierInfo.value, password);
    case 'cpf':
      return await loginWithCPF(identifierInfo.value, password);
    case 'email':
      return await loginWithEmail(identifierInfo.value, password);
    default:
      return { ok: false, statusCode: 400, message: "Tipo de identificador não suportado." };
  }
}

// Função de registro (cadastro) de usuário com suporte a diferentes perfis
export async function registerUser({ identifier, password, name, profile, clinicaData = null }) {
  try {
    // Validações básicas
    if (!identifier || !password || !name || !profile) {
      return { ok: false, statusCode: 400, message: "Todos os campos são obrigatórios." };
    }
    
    if (!['paciente', 'medico', 'clinica'].includes(profile)) {
      return { ok: false, statusCode: 400, message: "Perfil inválido." };
    }
    
    const identifierInfo = detectIdentifierType(identifier);
    if (!identifierInfo) {
      return { ok: false, statusCode: 400, message: "Identificador inválido para o perfil." };
    }
    
    // Valida correspondência entre perfil e tipo de identificador
    const validCombinations = {
      'paciente': 'cpf',
      'medico': 'crm',
      'clinica': 'cnpj'
    };
    
    if (validCombinations[profile] !== identifierInfo.type) {
      return { ok: false, statusCode: 400, message: `Perfil ${profile} requer ${validCombinations[profile].toUpperCase()}.` };
    }
    
    // Hash da senha
    const SALT_ROUNDS = 10;
    const password_hash = await bcrypt.hash(password.trim(), SALT_ROUNDS);
    
    // Inicia transação
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      
      // Cria usuário
      const [userResult] = await connection.execute(
        `INSERT INTO users (name, email, password_hash, profile, status)
         VALUES (?, ?, ?, ?, 'ACTIVE')`,
        [name, `${identifierInfo.value}@conecta.local`, password_hash, profile]
      );
      
      const userId = userResult.insertId;
      
      // Cria registro específico do perfil
      if (profile === 'paciente') {
        await connection.execute(
          `INSERT INTO pacientes (usuario_id, cpf)
           VALUES (?, ?)`,
          [userId, identifierInfo.value]
        );
      } else if (profile === 'medico') {
        await connection.execute(
          `INSERT INTO medicos (usuario_id, crm)
           VALUES (?, ?)`,
          [userId, identifierInfo.value]
        );
      } else if (profile === 'clinica') {
        // Salva todos os dados da clínica
        await connection.execute(
          `INSERT INTO clinicas (usuario_id, cnpj, razao_social, endereco, cidade, estado, cep, telefone, responsavel)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            identifierInfo.value,
            clinicaData?.razaoSocial || name,
            clinicaData?.endereco || '',
            clinicaData?.cidade || '',
            clinicaData?.estado || '',
            clinicaData?.cep || '',
            clinicaData?.telefone || '',
            clinicaData?.responsavel || ''
          ]
        );
      }
      
      await connection.commit();
      
      return {
        ok: true,
        statusCode: 201,
        message: "Usuário registrado com sucesso.",
        data: { userId, profile, identifier: identifierInfo.value }
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Erro em registerUser:", err);
    
    // Verifica duplicidade
    if (err.code === 'ER_DUP_ENTRY') {
      return { ok: false, statusCode: 409, message: "Identificador já cadastrado." };
    }
    
    return { ok: false, statusCode: 500, message: "Erro ao registrar usuário." };
  }
}

// Função para registrar profissional (médico) quando a clínica o cadastra
export async function registerProfessional({ crm, name, especialidade, clinicaId, bio = null }) {
  try {
    // Validações básicas
    if (!crm || !name || !clinicaId) {
      return { ok: false, statusCode: 400, message: "Todos os campos obrigatórios não foram preenchidos." };
    }

    // Validar CRM
    const crmInfo = detectIdentifierType(crm);
    if (!crmInfo || crmInfo.type !== 'crm') {
      return { ok: false, statusCode: 400, message: "CRM inválido." };
    }

    // Inicia transação
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Gera uma senha padrão (a clínica deve obrigar alteração no primeiro login)
      const SALT_ROUNDS = 10;
      const defaultPassword = `${crm}@${new Date().getFullYear()}`;
      const password_hash = await bcrypt.hash(defaultPassword, SALT_ROUNDS);

      // Cria usuário com perfil de médico
      const [userResult] = await connection.execute(
        `INSERT INTO users (name, email, password_hash, profile, status)
         VALUES (?, ?, ?, 'medico', 'ACTIVE')`,
        [name, `${crmInfo.value}@conecta.local`, password_hash]
      );

      const userId = userResult.insertId;

      // Registra o médico vinculado à clínica
      await connection.execute(
        `INSERT INTO medicos (usuario_id, clinica_id, crm, especialidade, bio)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, clinicaId, crmInfo.value, especialidade || null, bio || null]
      );

      await connection.commit();

      return {
        ok: true,
        statusCode: 201,
        message: "Profissional registrado com sucesso.",
        data: {
          userId,
          crm: crmInfo.value,
          defaultPassword, // Retornar para que a clínica possa informar ao profissional
          name
        }
      };
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error("Erro em registerProfessional:", err);

    if (err.code === 'ER_DUP_ENTRY') {
      return { ok: false, statusCode: 409, message: "CRM já cadastrado." };
    }

    if (err.message.includes('FK_medicos_clinica')) {
      return { ok: false, statusCode: 404, message: "Clínica não encontrada." };
    }

    return { ok: false, statusCode: 500, message: "Erro ao registrar profissional." };
  }
}
