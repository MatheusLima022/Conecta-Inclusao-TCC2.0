// Rotas avanÃ§adas de autenticaÃ§Ã£o com suporte a CRM, CNPJ e CPF
import { Router } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "../db.js";
import {
  universalLoginSchema,
  registerPatientSchema,
  registerDoctorSchema,
  registerClinicSchema,
  resetTemporaryPasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from "../validators/auth.advanced.validators.js";
import {
  loginUniversal,
  registerUser,
  registerProfessional,
  resetTemporaryProfessionalPassword,
  requestPasswordReset,
  resetPasswordWithToken,
  authenticateToken,
  getClinicDetails
} from "../services/auth.advanced.service.js";

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false
});

router.post("/login/universal", loginLimiter, async (req, res, next) => {
  try {
    const parsed = universalLoginSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados invalidos",
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

router.post("/professional/reset-temporary-password", loginLimiter, async (req, res, next) => {
  try {
    const parsed = resetTemporaryPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados invalidos",
        errors: parsed.error.errors
      });
    }

    const result = await resetTemporaryProfessionalPassword(parsed.data);

    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }

    return res.status(200).json(result.data);
  } catch (err) {
    next(err);
  }
});

router.post("/register/patient", registerLimiter, async (req, res, next) => {
  try {
    const parsed = registerPatientSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados invalidos",
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
        planoAtual: parsed.data.planoAtual,
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

router.post("/register/doctor", registerLimiter, async (req, res, next) => {
  try {
    const parsed = registerDoctorSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados invalidos",
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
        unidade: parsed.data.unidade,
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

router.post("/register/clinic", registerLimiter, async (req, res, next) => {
  try {
    const parsed = registerClinicSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados invalidos",
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

router.post("/register/professional", authenticateToken, registerLimiter, async (req, res, next) => {
  try {
    if (req.user.profile !== 'clinica') {
      return res.status(403).json({ message: 'Acesso negado. Apenas clinicas podem cadastrar profissionais.' });
    }

    const clinicResult = await getClinicDetails(req.user.sub);
    if (!clinicResult.ok) {
      return res.status(clinicResult.statusCode).json({ message: clinicResult.message });
    }

    const { crm, name, especialidade, bio, password, unidade, email } = req.body;

    if (!crm || !name) {
      return res.status(400).json({
        message: "Dados invalidos",
        errors: [{ message: "CRM e nome sao obrigatorios" }]
      });
    }

    const result = await registerProfessional({
      crm,
      name,
      especialidade,
      clinicaId: clinicResult.data.clinicaId,
      bio,
      password,
      unidade,
      email
    });

    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }

    return res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

router.post("/password/forgot", loginLimiter, async (req, res, next) => {
  try {
    const parsed = forgotPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados invalidos",
        errors: parsed.error.errors
      });
    }

    const result = await requestPasswordReset(parsed.data);

    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }

    return res.status(200).json({
      message: result.message,
      email: result.data.email
    });
  } catch (err) {
    next(err);
  }
});

router.post("/password/reset", loginLimiter, async (req, res, next) => {
  try {
    const parsed = resetPasswordSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Dados invalidos",
        errors: parsed.error.errors
      });
    }

    const result = await resetPasswordWithToken(parsed.data);

    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }

    return res.status(200).json({ message: result.message });
  } catch (err) {
    next(err);
  }
});

router.get("/clinic/professionals", authenticateToken, async (req, res, next) => {
  try {
    if (req.user.profile !== 'clinica') {
      return res.status(403).json({ message: 'Acesso negado. Apenas clinicas podem listar profissionais.' });
    }

    const [rows] = await pool.execute(
      `SELECT id, name, email, crm, especialidade, unidade, bio, status, created_at AS createdAt
       FROM medicos
       WHERE clinica_id = ?
       ORDER BY name ASC`,
      [req.user.sub]
    );

    return res.status(200).json(rows);
  } catch (err) {
    next(err);
  }
});

router.get("/clinic/dashboard-summary", authenticateToken, async (req, res, next) => {
  try {
    if (req.user.profile !== 'clinica') {
      return res.status(403).json({ message: 'Acesso negado. Apenas clinicas podem acessar o resumo.' });
    }

    const clinicaId = Number(req.user.sub);

    const [[professionalStats]] = await pool.execute(
      `SELECT
         COUNT(*) AS activeEmployees,
         SUM(CASE WHEN LOWER(status) = 'trabalhando' THEN 1 ELSE 0 END) AS workingEmployees,
         SUM(CASE WHEN LOWER(status) IN ('ferias', 'férias', 'folga', 'licenca', 'licença') THEN 1 ELSE 0 END) AS breakEmployees
       FROM medicos
       WHERE clinica_id = ?
         AND LOWER(status) IN ('active', 'ativo', 'trabalhando', 'ferias', 'férias', 'folga', 'licenca', 'licença')`,
      [clinicaId]
    );

    const [[appointmentStats]] = await pool.execute(
      `SELECT
         SUM(CASE WHEN data_agendamento >= NOW() AND status <> 'cancelado' THEN 1 ELSE 0 END) AS upcomingAppointments,
         SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) AS pendingRequests
       FROM agendamentos
       WHERE clinica_id = ?`,
      [clinicaId]
    );

    return res.status(200).json({
      activeEmployees: Number(professionalStats.activeEmployees || 0),
      workingEmployees: Number(professionalStats.workingEmployees || 0),
      breakEmployees: Number(professionalStats.breakEmployees || 0),
      upcomingAppointments: Number(appointmentStats.upcomingAppointments || 0),
      pendingRequests: Number(appointmentStats.pendingRequests || 0),
      documentsToValidate: 0
    });
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

    // Verificar se existe um medico com esse CRM, CNPJ e senha
    const [doctorRows] = await pool.execute(
      `SELECT m.id, m.name, m.email, m.senha AS password_hash, 'medico' AS profile,
              m.status, m.crm, c.cnpj
       FROM medicos m
       INNER JOIN clinicas c ON m.clinica_id = c.id
       WHERE m.crm = ? AND c.cnpj = ? LIMIT 1`,
      [normalizedCRM, cleanCNPJ]
    );

    if (doctorRows.length === 0) {
      return res.status(401).json({
        message: "Credenciais inválidas. Verifique CNPJ, CRM e tente novamente."
      });
    }

    const doctor = doctorRows[0];

    // Verificar status do usuário
    if (!['ACTIVE', 'ativo'].includes(doctor.status)) {
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
        profileId: doctor.id,
        profile: 'medico',
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
router.get("/clinic/details", authenticateToken, async (req, res, next) => {
  try {
    if (req.user.profile !== 'clinica') {
      return res.status(403).json({ message: 'Acesso negado. Apenas clÃ­nicas podem acessar este endpoint.' });
    }

    const result = await getClinicDetails(req.user.sub);

    if (!result.ok) {
      return res.status(result.statusCode).json({ message: result.message });
    }

    return res.status(200).json(result.data);
  } catch (err) {
    next(err);
  }
});

export default router;