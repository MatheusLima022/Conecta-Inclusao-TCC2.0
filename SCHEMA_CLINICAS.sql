-- Script SQL para criar tabelas de Clínicas
-- Execute este script no seu banco de dados MySQL para criar as tabelas necessárias

-- Tabela de Clínicas
CREATE TABLE IF NOT EXISTS clinicas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    cnpj VARCHAR(14) NOT NULL UNIQUE COMMENT 'CNPJ sem formatação (14 dígitos)',
    email VARCHAR(150) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    descricao TEXT,
    endereco VARCHAR(150) NOT NULL,
    numero VARCHAR(20) NOT NULL,
    complemento VARCHAR(100),
    bairro VARCHAR(100) NOT NULL,
    cidade VARCHAR(100) NOT NULL,
    estado VARCHAR(2) NOT NULL,
    cep VARCHAR(8) NOT NULL COMMENT 'CEP sem formatação',
    status ENUM('ativo', 'inativo', 'suspenso') DEFAULT 'ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cnpj (cnpj),
    INDEX idx_email (email),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Especialidades por Clínica
CREATE TABLE IF NOT EXISTS clinica_especialidades (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clinica_id INT NOT NULL,
    especialidade VARCHAR(100) NOT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    UNIQUE KEY unique_clinica_especialidade (clinica_id, especialidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Usuários (se ainda não existir, adapte conforme necessário)
CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    cpf VARCHAR(11) NOT NULL UNIQUE COMMENT 'CPF sem formatação (11 dígitos)',
    crm VARCHAR(20),
    telefone VARCHAR(20),
    senha VARCHAR(255) NOT NULL,
    clinica_id INT,
    role ENUM('paciente', 'profissional', 'admin_clinica', 'admin_sistema') DEFAULT 'paciente',
    status ENUM('ativo', 'inativo', 'bloqueado') DEFAULT 'ativo',
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE SET NULL,
    INDEX idx_email (email),
    INDEX idx_cpf (cpf),
    INDEX idx_clinica_id (clinica_id),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Agendamentos (opcional)
CREATE TABLE IF NOT EXISTS agendamentos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clinica_id INT NOT NULL,
    paciente_id INT NOT NULL,
    profissional_id INT NOT NULL,
    data_agendamento DATETIME NOT NULL,
    especialidade VARCHAR(100),
    tipo_consulta ENUM('presencial', 'online', 'telefone') DEFAULT 'presencial',
    status ENUM('confirmado', 'aguardando', 'cancelado', 'realizado', 'faltou') DEFAULT 'aguardando',
    observacoes TEXT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE,
    FOREIGN KEY (paciente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (profissional_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_clinica_id (clinica_id),
    INDEX idx_paciente_id (paciente_id),
    INDEX idx_profissional_id (profissional_id),
    INDEX idx_data_agendamento (data_agendamento),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de Logs de Acesso (opcional)
CREATE TABLE IF NOT EXISTS logs_acesso (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    clinica_id INT,
    acao VARCHAR(100),
    descricao TEXT,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE SET NULL,
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_clinica_id (clinica_id),
    INDEX idx_data_criacao (data_criacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
