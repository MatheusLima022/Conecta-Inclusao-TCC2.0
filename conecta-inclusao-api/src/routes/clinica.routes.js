// Importa o Router do Express
import { Router } from "express";
// Importa o rate limiter
import rateLimit from "express-rate-limit";
// Importa schema de validação
import { createClinicSchema } from "../validators/clinica.validators.js";
// Importa as funções do serviço
import {
    createClinica,
    getClinicaById,
    listClinicas,
    updateClinica,
    validateCNPJ,
    validateCPF
} from "../services/clinica.service.js";

const router = Router();

// Configurar rate limiter para cadastro de clínica
const clinicaCreateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    limit: 5, // Máximo 5 cadastros por hora por IP
    standardHeaders: true,
    legacyHeaders: false
});

// POST /api/clinicas/register - Registrar nova clínica
router.post("/register", clinicaCreateLimiter, async (req, res, next) => {
    try {
        // Validar dados com Zod
        const parsed = createClinicSchema.safeParse(req.body);
        
        if (!parsed.success) {
            // Formatar erros de validação
            const errors = parsed.error.flatten().fieldErrors;
            const errorMessages = {};
            
            for (const [field, messages] of Object.entries(errors)) {
                errorMessages[field] = messages[0];
            }
            
            return res.status(400).json({
                ok: false,
                message: "Dados inválidos",
                errors: errorMessages
            });
        }
        
        // Validar CNPJ com algoritmo completo
        if (!validateCNPJ(parsed.data.cnpj)) {
            return res.status(400).json({
                ok: false,
                message: "CNPJ inválido",
                field: "cnpj"
            });
        }
        
        // Validar CPF com algoritmo completo
        if (!validateCPF(parsed.data.cpf)) {
            return res.status(400).json({
                ok: false,
                message: "CPF inválido",
                field: "cpf"
            });
        }
        
        // Chamar serviço
        const result = await createClinica(parsed.data);
        
        if (!result.ok) {
            return res.status(result.statusCode).json({
                ok: false,
                message: result.message
            });
        }
        
        return res.status(result.statusCode).json(result);
        
    } catch (err) {
        next(err);
    }
});

// GET /api/clinicas - Listar clínicas
router.get("/", async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = parseInt(req.query.offset) || 0;
        
        const result = await listClinicas(limit, offset);
        
        return res.status(200).json(result);
        
    } catch (err) {
        next(err);
    }
});

// GET /api/clinicas/:id - Obter clínica por ID
router.get("/:id", async (req, res, next) => {
    try {
        const clinicaId = parseInt(req.params.id);
        
        if (isNaN(clinicaId)) {
            return res.status(400).json({
                ok: false,
                message: "ID de clínica inválido"
            });
        }
        
        const result = await getClinicaById(clinicaId);
        
        if (!result.ok) {
            return res.status(result.statusCode).json({
                ok: false,
                message: result.message
            });
        }
        
        return res.status(200).json({
            ok: true,
            data: result.data
        });
        
    } catch (err) {
        next(err);
    }
});

// PUT /api/clinicas/:id - Atualizar clínica
router.put("/:id", async (req, res, next) => {
    try {
        const clinicaId = parseInt(req.params.id);
        
        if (isNaN(clinicaId)) {
            return res.status(400).json({
                ok: false,
                message: "ID de clínica inválido"
            });
        }
        
        // TODO: Adicionar autenticação e autorização
        // Verificar se o usuário é admin da clínica
        
        const result = await updateClinica(clinicaId, req.body);
        
        if (!result.ok) {
            return res.status(result.statusCode).json({
                ok: false,
                message: result.message
            });
        }
        
        return res.status(200).json(result);
        
    } catch (err) {
        next(err);
    }
});

export default router;
