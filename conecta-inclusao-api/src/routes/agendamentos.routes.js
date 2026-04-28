// Importa o Router do Express
import { Router } from "express";
// Importa o rate limiter
import rateLimit from "express-rate-limit";
// Importa schema de validação
import { createAgendamentoSchema } from "../validators/agendamentos.validators.js";
// Importa as funções do serviço
import {
    createAgendamento,
    listAgendamentosByClinica,
    listAgendamentosByProfissional,
    updateAgendamentoStatus
} from "../services/agendamentos.service.js";

const router = Router();

// Configurar rate limiter para criação de agendamentos
const agendamentoCreateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    limit: 10, // Máximo 10 agendamentos por 15 minutos por IP
    standardHeaders: true,
    legacyHeaders: false
});

// POST /api/agendamentos - Criar novo agendamento
router.post("/", agendamentoCreateLimiter, async (req, res, next) => {
    try {
        // Validar dados com Zod
        const parsed = createAgendamentoSchema.safeParse(req.body);

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

        // Chamar serviço
        const result = await createAgendamento(parsed.data);

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

// GET /api/agendamentos/clinica/:clinica_id - Listar agendamentos por clínica
router.get("/clinica/:clinica_id", async (req, res, next) => {
    try {
        const clinica_id = parseInt(req.params.clinica_id);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = parseInt(req.query.offset) || 0;

        const result = await listAgendamentosByClinica(clinica_id, limit, offset);

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

// GET /api/agendamentos/profissional/:profissional_id - Listar agendamentos por profissional
router.get("/profissional/:profissional_id", async (req, res, next) => {
    try {
        const profissional_id = parseInt(req.params.profissional_id);
        const limit = Math.min(parseInt(req.query.limit) || 10, 100);
        const offset = parseInt(req.query.offset) || 0;

        const result = await listAgendamentosByProfissional(profissional_id, limit, offset);

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

// PUT /api/agendamentos/:id/status - Atualizar status do agendamento
router.put("/:id/status", async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                ok: false,
                message: "Status é obrigatório"
            });
        }

        const result = await updateAgendamentoStatus(id, status);

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

export default router;