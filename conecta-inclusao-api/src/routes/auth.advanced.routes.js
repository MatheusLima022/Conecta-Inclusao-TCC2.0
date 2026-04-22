// Rotas avanÃ§adas de autenticaÃ§Ã£o com suporte a CRM, CNPJ e CPF
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
  registerProfessional,
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
