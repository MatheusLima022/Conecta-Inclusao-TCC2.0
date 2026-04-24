import { pool } from "../db.js";

async function getPatientProfileData(userId) {
  const [rows] = await pool.execute(
    `SELECT id, usuario_id
     FROM pacientes
     WHERE usuario_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function getDoctorProfileData(userId) {
  const [rows] = await pool.execute(
    `SELECT id, usuario_id
     FROM medicos
     WHERE usuario_id = ?
     LIMIT 1`,
    [userId]
  );

  return rows[0] || null;
}

async function resolveActor(reqUser) {
  const userId = Number(reqUser?.sub);
  const profile = reqUser?.profile;

  if (!userId || !["paciente", "medico"].includes(profile)) {
    return {
      ok: false,
      statusCode: 403,
      message: "Acesso negado. Apenas pacientes e medicos podem usar mensagens."
    };
  }

  if (profile === "paciente") {
    const patient = await getPatientProfileData(userId);
    if (!patient) {
      return { ok: false, statusCode: 404, message: "Paciente nao encontrado." };
    }

    return {
      ok: true,
      data: {
        userId,
        profile,
        profileId: patient.id
      }
    };
  }

  const doctor = await getDoctorProfileData(userId);
  if (!doctor) {
    return { ok: false, statusCode: 404, message: "Medico nao encontrado." };
  }

  return {
    ok: true,
    data: {
      userId,
      profile,
      profileId: doctor.id
    }
  };
}

async function ensureMessagingTable() {
  await pool.execute(
    `CREATE TABLE IF NOT EXISTS mensagens (
      id INT AUTO_INCREMENT PRIMARY KEY,
      agendamento_id INT NOT NULL,
      remetente_user_id INT NOT NULL,
      destinatario_user_id INT NOT NULL,
      conteudo TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id) ON DELETE CASCADE,
      FOREIGN KEY (remetente_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (destinatario_user_id) REFERENCES users(id) ON DELETE CASCADE
    )`
  );
}

async function findLinkBetweenUsers(actor, targetUserId) {
  if (actor.profile === "paciente") {
    const [rows] = await pool.execute(
      `SELECT
          a.id AS appointmentId,
          m.usuario_id AS targetUserId,
          u.name AS targetName,
          m.especialidade AS targetSpecialty,
          m.unidade AS targetUnit
       FROM agendamentos a
       INNER JOIN medicos m ON m.id = a.medico_id
       INNER JOIN users u ON u.id = m.usuario_id
       WHERE a.paciente_id = ? AND m.usuario_id = ?
       ORDER BY a.data_hora DESC
       LIMIT 1`,
      [actor.profileId, targetUserId]
    );

    return rows[0] || null;
  }

  const [rows] = await pool.execute(
    `SELECT
        a.id AS appointmentId,
        p.usuario_id AS targetUserId,
        u.name AS targetName
     FROM agendamentos a
     INNER JOIN pacientes p ON p.id = a.paciente_id
     INNER JOIN users u ON u.id = p.usuario_id
     WHERE a.medico_id = ? AND p.usuario_id = ?
     ORDER BY a.data_hora DESC
     LIMIT 1`,
    [actor.profileId, targetUserId]
  );

  return rows[0] || null;
}

export async function listAllowedMessageContacts(reqUser) {
  try {
    const actorResult = await resolveActor(reqUser);
    if (!actorResult.ok) return actorResult;

    const actor = actorResult.data;

    if (actor.profile === "paciente") {
      const [rows] = await pool.execute(
        `SELECT
            DISTINCT u.id AS userId,
            u.name,
            m.crm AS registry,
            m.especialidade AS specialty,
            m.unidade AS unit,
            MAX(a.data_hora) AS lastAppointmentAt
         FROM agendamentos a
         INNER JOIN medicos m ON m.id = a.medico_id
         INNER JOIN users u ON u.id = m.usuario_id
         WHERE a.paciente_id = ?
         GROUP BY u.id, u.name, m.crm, m.especialidade, m.unidade
         ORDER BY lastAppointmentAt DESC, u.name ASC`,
        [actor.profileId]
      );

      return { ok: true, statusCode: 200, data: rows };
    }

    const [rows] = await pool.execute(
      `SELECT
          DISTINCT u.id AS userId,
          u.name,
          p.cpf,
          MAX(a.data_hora) AS lastAppointmentAt
       FROM agendamentos a
       INNER JOIN pacientes p ON p.id = a.paciente_id
       INNER JOIN users u ON u.id = p.usuario_id
       WHERE a.medico_id = ?
       GROUP BY u.id, u.name, p.cpf
       ORDER BY lastAppointmentAt DESC, u.name ASC`,
      [actor.profileId]
    );

    return { ok: true, statusCode: 200, data: rows };
  } catch (error) {
    console.error("Erro em listAllowedMessageContacts:", error);
    return { ok: false, statusCode: 500, message: "Erro interno do servidor." };
  }
}

export async function getConversationWithUser(reqUser, targetUserId) {
  try {
    await ensureMessagingTable();

    const actorResult = await resolveActor(reqUser);
    if (!actorResult.ok) return actorResult;

    const actor = actorResult.data;
    const normalizedTargetUserId = Number(targetUserId);

    if (!normalizedTargetUserId) {
      return { ok: false, statusCode: 400, message: "Destino invalido." };
    }

    const allowedLink = await findLinkBetweenUsers(actor, normalizedTargetUserId);
    if (!allowedLink) {
      return {
        ok: false,
        statusCode: 403,
        message: "Acesso negado. Esta conversa so pode ocorrer entre partes vinculadas pelo mesmo atendimento."
      };
    }

    const [messages] = await pool.execute(
      `SELECT
          m.id,
          m.agendamento_id AS appointmentId,
          m.remetente_user_id AS senderUserId,
          m.destinatario_user_id AS recipientUserId,
          m.conteudo AS content,
          m.created_at AS createdAt
       FROM mensagens m
       WHERE m.agendamento_id = ?
         AND (
           (m.remetente_user_id = ? AND m.destinatario_user_id = ?)
           OR
           (m.remetente_user_id = ? AND m.destinatario_user_id = ?)
         )
       ORDER BY m.created_at ASC, m.id ASC`,
      [
        allowedLink.appointmentId,
        actor.userId,
        normalizedTargetUserId,
        normalizedTargetUserId,
        actor.userId
      ]
    );

    return {
      ok: true,
      statusCode: 200,
      data: {
        contact: {
          userId: normalizedTargetUserId,
          name: allowedLink.targetName,
          specialty: allowedLink.targetSpecialty || null,
          unit: allowedLink.targetUnit || null
        },
        appointmentId: allowedLink.appointmentId,
        messages
      }
    };
  } catch (error) {
    console.error("Erro em getConversationWithUser:", error);
    return { ok: false, statusCode: 500, message: "Erro interno do servidor." };
  }
}

export async function sendMessageToUser(reqUser, targetUserId, content) {
  try {
    await ensureMessagingTable();

    const actorResult = await resolveActor(reqUser);
    if (!actorResult.ok) return actorResult;

    const actor = actorResult.data;
    const normalizedTargetUserId = Number(targetUserId);
    const normalizedContent = String(content || "").trim();

    if (!normalizedTargetUserId) {
      return { ok: false, statusCode: 400, message: "Destino invalido." };
    }

    if (!normalizedContent) {
      return { ok: false, statusCode: 400, message: "A mensagem nao pode ser vazia." };
    }

    const allowedLink = await findLinkBetweenUsers(actor, normalizedTargetUserId);
    if (!allowedLink) {
      return {
        ok: false,
        statusCode: 403,
        message: "Acesso negado. Voce so pode enviar mensagens para usuarios vinculados ao mesmo atendimento."
      };
    }

    const [result] = await pool.execute(
      `INSERT INTO mensagens (agendamento_id, remetente_user_id, destinatario_user_id, conteudo)
       VALUES (?, ?, ?, ?)`,
      [allowedLink.appointmentId, actor.userId, normalizedTargetUserId, normalizedContent]
    );

    return {
      ok: true,
      statusCode: 201,
      data: {
        id: result.insertId,
        appointmentId: allowedLink.appointmentId,
        senderUserId: actor.userId,
        recipientUserId: normalizedTargetUserId,
        content: normalizedContent
      }
    };
  } catch (error) {
    console.error("Erro em sendMessageToUser:", error);
    return { ok: false, statusCode: 500, message: "Erro interno do servidor." };
  }
}
