import { pool } from "../db.js";

async function resolvePacienteId(pacienteId) {
    const [pacienteRows] = await pool.execute(
        `SELECT p.id, p.usuario_id
         FROM pacientes p
         INNER JOIN users u ON u.id = p.usuario_id
         WHERE (p.id = ? OR p.usuario_id = ?)
           AND u.profile = 'paciente'
           AND u.status = 'ACTIVE'
         LIMIT 1`,
        [pacienteId, pacienteId]
    );

    return pacienteRows[0] || null;
}

async function resolveProfissionalId(profissionalId) {
    const [profissionalRows] = await pool.execute(
        `SELECT m.id, m.usuario_id, m.clinica_id, m.especialidade, m.unidade
         FROM medicos m
         INNER JOIN users u ON u.id = m.usuario_id
         WHERE (m.id = ? OR m.usuario_id = ?)
           AND u.profile = 'medico'
           AND u.status = 'ACTIVE'
         LIMIT 1`,
        [profissionalId, profissionalId]
    );

    return profissionalRows[0] || null;
}

async function resolveClinicaId(clinicaId) {
    const [clinicaRows] = await pool.execute(
        "SELECT id, razao_social FROM clinicas WHERE id = ? LIMIT 1",
        [clinicaId]
    );

    return clinicaRows[0] || null;
}

export async function createAgendamento(data) {
    try {
        const {
            clinica_id,
            paciente_id,
            profissional_id,
            data_agendamento,
            especialidade,
            tipo_consulta = "presencial",
            observacoes
        } = data;

        const clinica = await resolveClinicaId(clinica_id);
        if (!clinica) {
            return {
                ok: false,
                statusCode: 404,
                message: "Clinica nao encontrada"
            };
        }

        const paciente = await resolvePacienteId(paciente_id);
        if (!paciente) {
            return {
                ok: false,
                statusCode: 404,
                message: "Paciente nao encontrado ou inativo"
            };
        }

        const profissional = await resolveProfissionalId(profissional_id);
        if (!profissional) {
            return {
                ok: false,
                statusCode: 404,
                message: "Profissional nao encontrado ou inativo"
            };
        }

        const clinicaRelacionada = profissional.clinica_id || clinica.id;
        if (clinicaRelacionada !== clinica.id) {
            return {
                ok: false,
                statusCode: 409,
                message: "Profissional nao pertence a clinica informada"
            };
        }

        const [conflito] = await pool.execute(
            `SELECT id
             FROM agendamentos
             WHERE profissional_id = ?
               AND data_agendamento = ?
               AND status IN ('confirmado', 'aguardando')`,
            [profissional.id, data_agendamento]
        );

        if (conflito.length > 0) {
            return {
                ok: false,
                statusCode: 409,
                message: "Horario ja ocupado para este profissional"
            };
        }

        const [result] = await pool.execute(
            `INSERT INTO agendamentos (clinica_id, paciente_id, profissional_id, data_agendamento, especialidade, tipo_consulta, status, observacoes)
             VALUES (?, ?, ?, ?, ?, ?, 'aguardando', ?)`,
            [
                clinica.id,
                paciente.id,
                profissional.id,
                data_agendamento,
                especialidade || profissional.especialidade || null,
                tipo_consulta,
                observacoes || null
            ]
        );

        return {
            ok: true,
            statusCode: 201,
            message: "Agendamento criado com sucesso",
            data: {
                id: result.insertId,
                clinica_id: clinica.id,
                paciente_id: paciente.id,
                profissional_id: profissional.id,
                data_agendamento,
                especialidade: especialidade || profissional.especialidade || null,
                tipo_consulta,
                status: "aguardando",
                observacoes
            }
        };
    } catch (error) {
        console.error("Erro ao criar agendamento:", error);
        return {
            ok: false,
            statusCode: 500,
            message: "Erro interno do servidor"
        };
    }
}

export async function listAgendamentosByClinica(clinica_id, limit = 10, offset = 0) {
    try {
        const [rows] = await pool.execute(
            `SELECT a.*,
                    up.name AS paciente_nome,
                    p.cpf AS paciente_cpf,
                    um.name AS profissional_nome,
                    m.crm AS profissional_crm
             FROM agendamentos a
             INNER JOIN pacientes p ON a.paciente_id = p.id
             INNER JOIN users up ON p.usuario_id = up.id
             INNER JOIN medicos m ON a.profissional_id = m.id
             INNER JOIN users um ON m.usuario_id = um.id
             WHERE a.clinica_id = ?
             ORDER BY a.data_agendamento DESC
             LIMIT ? OFFSET ?`,
            [clinica_id, limit, offset]
        );

        return {
            ok: true,
            data: rows
        };
    } catch (error) {
        console.error("Erro ao listar agendamentos por clinica:", error);
        return {
            ok: false,
            statusCode: 500,
            message: "Erro interno do servidor"
        };
    }
}

export async function listAgendamentosByProfissional(profissional_id, limit = 10, offset = 0) {
    try {
        const profissional = await resolveProfissionalId(profissional_id);
        if (!profissional) {
            return {
                ok: false,
                statusCode: 404,
                message: "Profissional nao encontrado"
            };
        }

        const [rows] = await pool.execute(
            `SELECT a.*,
                    up.name AS paciente_nome,
                    p.cpf AS paciente_cpf,
                    c.razao_social AS clinica_nome,
                    m.especialidade AS profissional_especialidade
             FROM agendamentos a
             INNER JOIN pacientes p ON a.paciente_id = p.id
             INNER JOIN users up ON p.usuario_id = up.id
             INNER JOIN clinicas c ON a.clinica_id = c.id
             INNER JOIN medicos m ON a.profissional_id = m.id
             WHERE a.profissional_id = ?
             ORDER BY a.data_agendamento DESC
             LIMIT ? OFFSET ?`,
            [profissional.id, limit, offset]
        );

        return {
            ok: true,
            data: rows
        };
    } catch (error) {
        console.error("Erro ao listar agendamentos por profissional:", error);
        return {
            ok: false,
            statusCode: 500,
            message: "Erro interno do servidor"
        };
    }
}

export async function updateAgendamentoStatus(id, status) {
    try {
        const validStatuses = ["confirmado", "aguardando", "cancelado", "realizado", "faltou"];

        if (!validStatuses.includes(status)) {
            return {
                ok: false,
                statusCode: 400,
                message: "Status invalido"
            };
        }

        const [result] = await pool.execute(
            "UPDATE agendamentos SET status = ? WHERE id = ?",
            [status, id]
        );

        if (result.affectedRows === 0) {
            return {
                ok: false,
                statusCode: 404,
                message: "Agendamento nao encontrado"
            };
        }

        return {
            ok: true,
            statusCode: 200,
            message: "Status atualizado com sucesso"
        };
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        return {
            ok: false,
            statusCode: 500,
            message: "Erro interno do servidor"
        };
    }
}
