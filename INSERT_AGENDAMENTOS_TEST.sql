-- Inserir dados de teste para agendamentos

-- Assumindo IDs: clinica_id=1, paciente_id=2, profissional_id=3

INSERT INTO agendamentos (clinica_id, paciente_id, profissional_id, data_agendamento, especialidade, tipo_consulta, status, observacoes)
VALUES
(1, 2, 3, '2026-04-30 09:00:00', 'Cardiologia', 'presencial', 'confirmado', 'Consulta de rotina'),
(1, 2, 3, '2026-04-30 10:00:00', 'Cardiologia', 'presencial', 'aguardando', 'Retorno'),
(1, 4, 3, '2026-04-30 11:00:00', 'Neurologia', 'online', 'confirmado', 'Avaliação inicial');