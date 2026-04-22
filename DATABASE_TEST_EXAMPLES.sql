-- ==========================================
-- SCRIPT DE TESTE E EXEMPLOS
-- Conecta Inclusão - Sistema de Autenticação
-- ==========================================

-- Este arquivo contém exemplos de como inserir dados de teste
-- e consultas úteis para o novo sistema de autenticação

-- ==========================================
-- 1. INSERIR DADOS DE TESTE
-- ==========================================

-- Inserir uma clínica (empresa)
INSERT INTO clinicas (usuario_id, cnpj, razao_social, endereco, cidade, estado, cep, telefone, responsavel)
VALUES (1, '12345678000190', 'Clínica Saúde Plus Ltda', 'Rua Principal, 123', 'São Paulo', 'SP', '01310100', '1133334444', 'João Silva');

-- Inserir um médico vinculado à clínica
INSERT INTO medicos (usuario_id, clinica_id, crm, especialidade, bio)
VALUES (2, 1, 'ABC1234', 'Cardiologia', 'Especialista em doenças cardiovasculares');

-- Inserir um paciente
INSERT INTO pacientes (usuario_id, cpf, nome_responsavel, tipo_deficiencia, data_nascimento)
VALUES (3, '12345678901', 'Maria Silva', 'Mobilidade', '1990-05-15');

-- ==========================================
-- 2. CONSULTAS ÚTEIS
-- ==========================================

-- Ver todos os usuários com seus perfis
SELECT 
  u.id,
  u.name,
  u.email,
  u.profile,
  u.status,
  u.created_at
FROM users u
ORDER BY u.created_at DESC;

-- Ver todos os médicos com informações de clínica
SELECT 
  m.id,
  m.crm,
  u.name AS nome_medico,
  m.especialidade,
  c.razao_social AS clinica,
  u.status
FROM medicos m
INNER JOIN users u ON m.usuario_id = u.id
LEFT JOIN clinicas c ON m.clinica_id = c.id
ORDER BY m.crm;

-- Ver todos os pacientes
SELECT 
  p.id,
  p.cpf,
  u.name AS nome_paciente,
  p.nome_responsavel,
  p.tipo_deficiencia,
  p.data_nascimento,
  u.status
FROM pacientes p
INNER JOIN users u ON p.usuario_id = u.id
ORDER BY p.cpf;

-- Ver todas as clínicas
SELECT 
  c.id,
  c.cnpj,
  c.razao_social,
  u.name AS nome_usuario,
  c.endereco,
  c.cidade,
  c.telefone,
  u.status,
  COUNT(m.id) AS total_medicos
FROM clinicas c
INNER JOIN users u ON c.usuario_id = u.id
LEFT JOIN medicos m ON c.id = m.clinica_id
GROUP BY c.id
ORDER BY c.razao_social;

-- Ver médicos de uma clínica específica
SELECT 
  m.id,
  m.crm,
  u.name AS nome_medico,
  m.especialidade
FROM medicos m
INNER JOIN users u ON m.usuario_id = u.id
WHERE m.clinica_id = 1
ORDER BY u.name;

-- Ver agendamentos de um paciente
SELECT 
  a.id,
  a.data_hora,
  u_medico.name AS medico,
  m.crm,
  a.status,
  a.link_reuniao
FROM agendamentos a
INNER JOIN pacientes p ON a.paciente_id = p.id
INNER JOIN medicos m ON a.medico_id = m.id
INNER JOIN users u_medico ON m.usuario_id = u_medico.id
WHERE p.id = 1
ORDER BY a.data_hora;

-- Ver histórico de agendamentos de um médico
SELECT 
  a.id,
  a.data_hora,
  u_paciente.name AS paciente,
  p.cpf,
  a.status,
  r.descricao AS ultima_descricao
FROM agendamentos a
INNER JOIN medicos m ON a.medico_id = m.id
INNER JOIN pacientes p ON a.paciente_id = p.id
INNER JOIN users u_paciente ON p.usuario_id = u_paciente.id
LEFT JOIN relatorios r ON a.id = r.agendamento_id
WHERE m.id = 1
ORDER BY a.data_hora DESC;

-- ==========================================
-- 3. OPERAÇÕES DE ATUALIZAÇÃO
-- ==========================================

-- Adicionar um médico a uma clínica
UPDATE medicos
SET clinica_id = 1
WHERE id = 2;

-- Ativar/desativar um usuário
UPDATE users
SET status = 'INACTIVE'
WHERE id = 3;

UPDATE users
SET status = 'ACTIVE'
WHERE id = 3;

-- Resetar tentativas de login falhadas
UPDATE users
SET failed_attempts = 0,
    locked_until = NULL
WHERE id = 1;

-- Desbloquear um usuário manualmente
UPDATE users
SET locked_until = NULL
WHERE id = 1;

-- ==========================================
-- 4. OPERAÇÕES DE LIMPEZA
-- ==========================================

-- ⚠️ CUIDADO: Deletar um usuário e todo seu relacionamento
-- DELETE FROM users WHERE id = 1;

-- ⚠️ CUIDADO: Resetar tudo (banco limpo)
-- DELETE FROM agendamentos;
-- DELETE FROM relatorios;
-- DELETE FROM sessions;
-- DELETE FROM pacientes;
-- DELETE FROM medicos;
-- DELETE FROM clinicas;
-- DELETE FROM users;
-- ALTER TABLE users AUTO_INCREMENT = 1;

-- ==========================================
-- 5. ÍNDICES PARA PERFORMANCE (OPCIONAL)
-- ==========================================

-- Índice para buscar usuário por email (já existe por UNIQUE)
-- CREATE INDEX idx_users_email ON users(email);

-- Índice para buscar médico por CRM
CREATE INDEX IF NOT EXISTS idx_medicos_crm ON medicos(crm);

-- Índice para buscar paciente por CPF
CREATE INDEX IF NOT EXISTS idx_pacientes_cpf ON pacientes(cpf);

-- Índice para buscar clínica por CNPJ
CREATE INDEX IF NOT EXISTS idx_clinicas_cnpj ON clinicas(cnpj);

-- Índice para agendamentos por status
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);

-- Índice para agendamentos por data
CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos(data_hora);

-- ==========================================
-- 6. VIEWS ÚTEIS (OPCIONAL)
-- ==========================================

-- View para listar todas as sessões ativas
CREATE OR REPLACE VIEW vw_sessoes_ativas AS
SELECT 
  s.session_id,
  u.name,
  u.email,
  u.profile,
  s.expires_at,
  CASE 
    WHEN s.expires_at > NOW() THEN 'Ativa'
    ELSE 'Expirada'
  END AS status
FROM sessions s
INNER JOIN users u ON s.user_id = u.id;

-- View para listar usuários bloqueados
CREATE OR REPLACE VIEW vw_usuarios_bloqueados AS
SELECT 
  id,
  name,
  email,
  profile,
  locked_until,
  failed_attempts,
  TIMESTAMPDIFF(MINUTE, NOW(), locked_until) AS minutos_restantes
FROM users
WHERE locked_until > NOW();

-- View com estatísticas gerais
CREATE OR REPLACE VIEW vw_estatisticas AS
SELECT 
  (SELECT COUNT(*) FROM users WHERE profile = 'paciente') AS total_pacientes,
  (SELECT COUNT(*) FROM users WHERE profile = 'medico') AS total_medicos,
  (SELECT COUNT(*) FROM users WHERE profile = 'clinica') AS total_clinicas,
  (SELECT COUNT(*) FROM agendamentos WHERE status = 'confirmado') AS agendamentos_confirmados,
  (SELECT COUNT(*) FROM agendamentos WHERE status = 'pendente') AS agendamentos_pendentes,
  (SELECT COUNT(*) FROM agendamentos WHERE status = 'realizado') AS agendamentos_realizados;
