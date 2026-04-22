// Rotas avançadas de autenticação com suporte a CRM, CNPJ e CPF
import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import { 
  universalLoginSchema,
  registerPatientSchema,
  registerDoctorSchema,
  registerClinicSchema
} from "../validators/auth.advanced.validators.js";
import { 
  loginUniversal,
  registerUser,
  registerProfessional
} from "../services/auth.advanced.service.js";

const router = Router();

// Rate limiter para login
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter para registro
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  limit: 5, // Máximo 5 registros por hora
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * POST /auth/login/universal
 * Realiza login com qualquer tipo de identificador (Email, CRM, CNPJ, CPF)
 * 
 * Body:
 * {
 *   "identifier": "123456789012" | "12.123.123/1234-12" | "ABC1234" | "user@example.com",
 *   "password": "senha123"
 * }
 */
router.post("/login/universal", loginLimiter, async (req, res, next) => {
  try {
    const parsed = universalLoginSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        message: "Dados inválidos",
        errors: parsed.error.errors 
      });
    }
    
    const result = await loginUniversal(parsed.data);
    
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }
    
    return res.status(200).json(result.data);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/register/patient
 * Registra um novo paciente com CPF
 * 
 * Body:
 * {
 *   "cpf": "12345678901",
 *   "password": "senha123",
 *   "name": "João Silva",
 *   "nomeResponsavel": "Maria Silva",
 *   "tipoDeficiencia": "Mobilidade",
 *   "dataNascimento": "1990-01-15"
 * }
 */
router.post("/register/patient", registerLimiter, async (req, res, next) => {
  try {
    const parsed = registerPatientSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        message: "Dados inválidos",
        errors: parsed.error.errors 
      });
    }
    
    const result = await registerUser({
      identifier: parsed.data.cpf,
      password: parsed.data.password,
      name: parsed.data.name,
      profile: 'paciente'
    });
    
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }
    
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/register/doctor
 * Registra um novo médico com CRM
 * 
 * Body:
 * {
 *   "crm": "ABC1234",
 *   "password": "senha123",
 *   "name": "Dr. João",
 *   "especialidade": "Cardiologia",
 *   "clinicaId": 1
 * }
 */
router.post("/register/doctor", registerLimiter, async (req, res, next) => {
  try {
    const parsed = registerDoctorSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        message: "Dados inválidos",
        errors: parsed.error.errors 
      });
    }
    
    const result = await registerUser({
      identifier: parsed.data.crm,
      password: parsed.data.password,
      name: parsed.data.name,
      profile: 'medico'
    });
    
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }
    
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/register/clinic
 * Registra uma nova clínica/empresa com CNPJ
 * 
 * Body:
 * {
 *   "cnpj": "12345678000190",
 *   "password": "senha123",
 *   "name": "Clínica Saúde",
 *   "razaoSocial": "Clínica Saúde Ltda",
 *   "endereco": "Rua...",
 *   "telefone": "1133334444"
 * }
 */
router.post("/register/clinic", registerLimiter, async (req, res, next) => {
  try {
    const parsed = registerClinicSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ 
        message: "Dados inválidos",
        errors: parsed.error.errors 
      });
    }
    
    const result = await registerUser({
      identifier: parsed.data.cnpj,
      password: parsed.data.password,
      name: parsed.data.name,
      profile: 'clinica',
      clinicaData: {
        razaoSocial: parsed.data.razaoSocial,
        endereco: parsed.data.endereco,
        cidade: parsed.data.cidade,
        estado: parsed.data.estado,
        cep: parsed.data.cep,
        telefone: parsed.data.telefone,
        responsavel: parsed.data.responsavel
      }
    });
    
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }
    
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/register/professional
 * Registra um novo profissional (médico) para uma clínica
 * Requer autenticação da clínica
 * 
 * Body:
 * {
 *   "crm": "ABC1234",
 *   "name": "Dr. João",
 *   "especialidade": "Cardiologia",
 *   "clinicaId": 1,
 *   "bio": "Especialista..."
 * }
 */
router.post("/register/professional", registerLimiter, async (req, res, next) => {
  try {
    const { crm, name, especialidade, clinicaId, bio } = req.body;
    
    if (!crm || !name || !clinicaId) {
      return res.status(400).json({ 
        message: "Dados inválidos",
        errors: [{ message: "CRM, nome e clinicaId são obrigatórios" }]
      });
    }
    
    const result = await registerProfessional({
      crm,
      name,
      especialidade,
      clinicaId,
      bio
    });
    
    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }
    
    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /auth/records/authenticate
 * Autentica um profissional para acesso aos prontuários
 * Requer CNPJ da clínica, CRM do profissional e senha
 * 
 * Body:
 * {
 *   "cnpj": "12345678000190",
 *   "crm": "ABC1234",
 *   "password": "senha123"
 * }
 */
router.post("/records/authenticate", loginLimiter, async (req, res, next) => {
  try {
    const { cnpj, crm, password } = req.body;
    
    if (!cnpj || !crm || !password) {
      return res.status(400).json({ 
        message: "CNPJ, CRM e senha são obrigatórios"
      });
    }

    // Validar e normalizar CNPJ
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    if (cleanCNPJ.length !== 14) {
      return res.status(400).json({ 
        message: "CNPJ inválido"
      });
    }

    // Validar e normalizar CRM
    const normalizedCRM = crm.trim().toUpperCase();
    if (normalizedCRM.length < 4) {
      return res.status(400).json({ 
        message: "CRM inválido"
      });
    }

    // Verificar se existe um usuário com esse CRM e senha
    const [doctorRows] = await pool.execute(
      `SELECT u.id, u.name, u.email, u.password_hash, u.profile, u.status, m.crm, c.cnpj
       FROM users u
       INNER JOIN medicos m ON u.id = m.usuario_id
       INNER JOIN clinicas c ON m.clinica_id = c.id
       WHERE m.crm = ? AND c.cnpj = ? AND u.profile = 'medico' LIMIT 1`,
      [normalizedCRM, cleanCNPJ]
    );

    if (doctorRows.length === 0) {
      return res.status(401).json({ 
        message: "Credenciais inválidas. Verifique CNPJ, CRM e tente novamente."
      });
    }

    const doctor = doctorRows[0];

    // Verificar status do usuário
    if (doctor.status !== 'ativo') {
      return res.status(403).json({ 
        message: "Sua conta está desativada. Entre em contato com o administrador."
      });
    }

    // Validar senha
    const passwordMatch = await bcrypt.compare(password, doctor.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ 
        message: "Credenciais inválidas. Verifique CNPJ, CRM e tente novamente."
      });
    }

    // Gerar token JWT para a sessão
    const token = jwt.sign(
      {
        userId: doctor.id,
        crm: doctor.crm,
        cnpj: doctor.cnpj,
        type: 'records_access'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '4h' }
    );

    return res.status(200).json({
      message: "Autenticado com sucesso",
      token: token,
      user: {
        name: doctor.name,
        crm: doctor.crm,
        profile: doctor.profile
      }
    });

  } catch (error) {
    console.error("Erro em /auth/records/authenticate:", error);
    return res.status(500).json({ 
      message: "Erro interno do servidor"
    });
  }
});

export default router;
