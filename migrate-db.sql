-- Migração para ajustar a estrutura do banco de dados
-- Execute estes comandos no MySQL para alinhar com o código

-- Adicionar colunas faltantes na tabela agendamentos
ALTER TABLE agendamentos
ADD COLUMN clinica_id INT NOT NULL AFTER id,
ADD COLUMN especialidade VARCHAR(100) AFTER data_hora,
ADD COLUMN tipo_consulta ENUM('presencial', 'online', 'telefone') DEFAULT 'presencial' AFTER especialidade,
ADD COLUMN observacoes TEXT AFTER tipo_consulta,
ADD FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE;

-- Renomear medico_id para profissional_id (opcional, mas para consistência)
-- ALTER TABLE agendamentos CHANGE medico_id profissional_id INT NOT NULL;

-- Renomear data_hora para data_agendamento
ALTER TABLE agendamentos CHANGE data_hora data_agendamento DATETIME NOT NULL;

-- Atualizar status enum para incluir mais opções
ALTER TABLE agendamentos MODIFY COLUMN status ENUM('confirmado', 'aguardando', 'cancelado', 'realizado', 'faltou') DEFAULT 'aguardando';

-- Verificar estrutura
DESCRIBE agendamentos;