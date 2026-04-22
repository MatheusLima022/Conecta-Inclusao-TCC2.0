// Rotas avançadas de autenticação com suporte a CRM, CNPJ e CPF
import { Router } from "express";
import rateLimit from "express-rate-limit";
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
      profile: 'paciente',
      userData: {
        email: parsed.data.email,
        nomeResponsavel: parsed.data.nomeResponsavel,
        tipoDeficiencia: parsed.data.tipoDeficiencia,
        dataNascimento: parsed.data.dataNascimento
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
      profile: 'medico',
      userData: {
        email: parsed.data.email,
        especialidade: parsed.data.especialidade,
        bio: parsed.data.bio,
        clinicaId: parsed.data.clinicaId
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
      userData: {
        email: parsed.data.email,
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

export default router;
