-- Script para inserir dados de teste com CNPJ falso
-- Execute este script no seu banco de dados para adicionar dados de teste

-- 1. Inserir usuário para a clínica (empresa)
INSERT INTO users (name, email, password_hash, profile, status)
VALUES ('Clínica Teste', 'clinica@test.local', '$2b$10$vYkuJgFpDQVkQXrPLkZXp.KJM3TH5fNZwlZmhXj2DL0Y8h5S0x8L.', 'clinica', 'ACTIVE');

-- 2. Obter o ID do usuário inserido (substitua se necessário)
-- Para referência, o ID deve ser 1 se for o primeiro usuário

-- 3. Inserir clínica com CNPJ falso
INSERT INTO clinicas (usuario_id, cnpj, email, razao_social, endereco, cidade, estado, cep, telefone, responsavel)
VALUES (1, '12345678000190', 'clinica@test.local', 'Clínica Teste LTDA', 'Rua Teste, 123', 'São Paulo', 'SP', '01310100', '1133334444', 'Gerente Teste');

-- Login com essas credenciais:
-- CNPJ: 12345678000190
-- Senha: 123456 (a senha que você registrar ao fazer o hash)

-- Verificar se os dados foram inseridos
SELECT * FROM users WHERE profile = 'clinica';
SELECT * FROM clinicas WHERE cnpj = '12345678000190';
