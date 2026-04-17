-- 1. Criar o Banco de Dados
CREATE DATABASE IF NOT EXISTS conecta_inclusao;
USE conecta_inclusao;

-- 2. Tabela de Usuários (Base para login e tipos de perfil)
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    tipo_usuario ENUM('paciente', 'medico', 'clinica') NOT NULL,
    criado_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Médicos (Detalhes profissionais)
CREATE TABLE medicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    crm VARCHAR(20) UNIQUE NOT NULL,
    especialidade VARCHAR(100),
    bio TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Tabela de Pacientes (Informações do responsável e PCD)
CREATE TABLE pacientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome_responsavel VARCHAR(100),
    tipo_deficiencia VARCHAR(100),
    data_nascimento DATE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. Tabela de Agendamentos (Consultas)
CREATE TABLE agendamentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    paciente_id INT NOT NULL,
    medico_id INT NOT NULL,
    data_hora DATETIME NOT NULL,
    status ENUM('pendente', 'confirmado', 'cancelado', 'realizado') DEFAULT 'pendente',
    link_reuniao VARCHAR(255), -- Para a consulta online
    FOREIGN KEY (paciente_id) REFERENCES pacientes(id),
    FOREIGN KEY (medico_id) REFERENCES medicos(id)
);

-- 6. Tabela de Relatórios Médicos (Histórico e Registros)
CREATE TABLE relatorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agendamento_id INT NOT NULL,
    descricao TEXT NOT NULL,
    prescricao TEXT,
    data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agendamento_id) REFERENCES agendamentos(id)
);