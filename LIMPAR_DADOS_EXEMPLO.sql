-- ==========================================
-- SCRIPT PARA LIMPAR DADOS DE EXEMPLO
-- Conecta Inclusão
-- ==========================================
-- Este script remove todos os dados de exemplo do banco

-- ⚠️ CUIDADO: Este script é destrutivo, remova dados anteriores!
-- Faça backup antes de executar!

-- Desabilitar verificação de chaves estrangeiras temporariamente
SET FOREIGN_KEY_CHECKS=0;

-- Limpar todas as tabelas na ordem correta (respeitar foreign keys)
DELETE FROM sessions;
DELETE FROM relatorios;
DELETE FROM agendamentos;
DELETE FROM medicos;
DELETE FROM pacientes;
DELETE FROM clinicas;
DELETE FROM users;

-- Resetar AUTO_INCREMENT para todos os IDs
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE clinicas AUTO_INCREMENT = 1;
ALTER TABLE medicos AUTO_INCREMENT = 1;
ALTER TABLE pacientes AUTO_INCREMENT = 1;
ALTER TABLE agendamentos AUTO_INCREMENT = 1;
ALTER TABLE relatorios AUTO_INCREMENT = 1;
ALTER TABLE sessions AUTO_INCREMENT = 1;

-- Reabilitar verificação de chaves estrangeiras
SET FOREIGN_KEY_CHECKS=1;

-- Verificar resultado
SELECT 
  (SELECT COUNT(*) FROM users) AS total_users,
  (SELECT COUNT(*) FROM clinicas) AS total_clinicas,
  (SELECT COUNT(*) FROM medicos) AS total_medicos,
  (SELECT COUNT(*) FROM pacientes) AS total_pacientes,
  (SELECT COUNT(*) FROM agendamentos) AS total_agendamentos;

-- Output esperado: 0, 0, 0, 0, 0
