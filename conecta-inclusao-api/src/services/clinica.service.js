// Importa bcrypt para criptografar senhas
import bcrypt from "bcrypt";
// Importa jsonwebtoken para gerar tokens JWT
import jwt from "jsonwebtoken";
// Importa o pool de conexão do banco de dados
import { pool } from "../db.js";
// Importa a função de hash de senha
import { hashPassword } from "./auth.service.js";

// Função para validar CNPJ (algoritmo completo)
export function validateCNPJ(cnpj) {
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (cleanCNPJ.length !== 14) return false;
    if (cleanCNPJ === cleanCNPJ[0].repeat(14)) return false;
    
    let sum = 0;
    let remainder;
    
    // Validação primeiro dígito
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleanCNPJ[i]) * (5 - (i % 4));
    }
    
    remainder = (sum % 11);
    remainder = remainder < 2 ? 0 : 11 - remainder;
    
    if (remainder !== parseInt(cleanCNPJ[12])) return false;
    
    sum = 0;
    // Validação segundo dígito
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleanCNPJ[i]) * (6 - ((i + 1) % 5));
    }
    
    remainder = (sum % 11);
    remainder = remainder < 2 ? 0 : 11 - remainder;
    
    if (remainder !== parseInt(cleanCNPJ[13])) return false;
    
    return true;
}

// Função para validar CPF
export function validateCPF(cpf) {
    const cleanCPF = cpf.replace(/\D/g, '');
    
    if (cleanCPF.length !== 11) return false;
    if (cleanCPF === cleanCPF[0].repeat(11)) return false;
    
    let sum = 0;
    let remainder;
    
    // Validação primeiro dígito
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleanCPF[i]) * (10 - i);
    }
    
    remainder = (sum * 10) % 11;
    remainder = remainder === 10 || remainder === 11 ? 0 : remainder;
    
    if (remainder !== parseInt(cleanCPF[9])) return false;
    
    sum = 0;
    // Validação segundo dígito
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCPF[i]) * (11 - i);
    }
    
    remainder = (sum * 10) % 11;
    remainder = remainder === 10 || remainder === 11 ? 0 : remainder;
    
    if (remainder !== parseInt(cleanCPF[10])) return false;
    
    return true;
}

// Função para criar clínica
export async function createClinica(data) {
    const connection = await pool.getConnection();
    
    try {
        // Iniciar transação
        await connection.beginTransaction();
        
        // Validar CNPJ único
        const [existingCNPJ] = await connection.query(
            'SELECT id FROM clinicas WHERE cnpj = ?',
            [data.cnpj.replace(/\D/g, '')]
        );
        
        if (existingCNPJ.length > 0) {
            await connection.rollback();
            return {
                ok: false,
                statusCode: 409,
                message: "CNPJ já cadastrado no sistema"
            };
        }
        
        // Validar email único
        const [existingEmail] = await connection.query(
            'SELECT id FROM clinicas WHERE email = ?',
            [data.clinicEmail]
        );
        
        if (existingEmail.length > 0) {
            await connection.rollback();
            return {
                ok: false,
                statusCode: 409,
                message: "Email já cadastrado no sistema"
            };
        }
        
        // Validar email do responsável único
        const [existingResponsibleEmail] = await connection.query(
            'SELECT id FROM usuarios WHERE email = ?',
            [data.responsibleEmail]
        );
        
        if (existingResponsibleEmail.length > 0) {
            await connection.rollback();
            return {
                ok: false,
                statusCode: 409,
                message: "Email do responsável já cadastrado"
            };
        }
        
        // Hash da senha
        const passwordHash = await hashPassword(data.password);
        
        if (!passwordHash.ok) {
            await connection.rollback();
            return {
                ok: false,
                statusCode: 400,
                message: passwordHash.error
            };
        }
        
        // Inserir clínica
        const clinicaData = {
            nome: data.clinicName,
            cnpj: data.cnpj.replace(/\D/g, ''),
            email: data.clinicEmail,
            telefone: data.clinicPhone,
            descricao: data.description || null,
            endereco: data.address,
            numero: data.number,
            complemento: data.complement || null,
            bairro: data.neighborhood,
            cidade: data.city,
            estado: data.state,
            cep: data.cep.replace(/\D/g, ''),
            status: 'ativo',
            data_criacao: new Date()
        };
        
        const [clinicaResult] = await connection.query(
            `INSERT INTO clinicas 
            (nome, cnpj, email, telefone, descricao, endereco, numero, complemento, bairro, cidade, estado, cep, status, data_criacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                clinicaData.nome,
                clinicaData.cnpj,
                clinicaData.email,
                clinicaData.telefone,
                clinicaData.descricao,
                clinicaData.endereco,
                clinicaData.numero,
                clinicaData.complemento,
                clinicaData.bairro,
                clinicaData.cidade,
                clinicaData.estado,
                clinicaData.cep,
                clinicaData.status,
                clinicaData.data_criacao
            ]
        );
        
        const clinicaId = clinicaResult.insertId;
        
        // Inserir especialidades
        const specialtyInserts = data.specialty.map(spec => 
            connection.query(
                'INSERT INTO clinica_especialidades (clinica_id, especialidade) VALUES (?, ?)',
                [clinicaId, spec]
            )
        );
        
        await Promise.all(specialtyInserts);
        
        // Inserir responsável (usuário)
        const userData = {
            nome: data.responsibleName,
            email: data.responsibleEmail,
            cpf: data.cpf.replace(/\D/g, ''),
            crm: data.crm || null,
            telefone: data.responsiblePhone,
            senha: passwordHash.hash,
            clinica_id: clinicaId,
            role: 'admin_clinica',
            status: 'ativo',
            data_criacao: new Date()
        };
        
        const [usuarioResult] = await connection.query(
            `INSERT INTO usuarios 
            (nome, email, cpf, crm, telefone, senha, clinica_id, role, status, data_criacao)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                userData.nome,
                userData.email,
                userData.cpf,
                userData.crm,
                userData.telefone,
                userData.senha,
                userData.clinica_id,
                userData.role,
                userData.status,
                userData.data_criacao
            ]
        );
        
        // Commit da transação
        await connection.commit();
        
        // Gerar token JWT
        const token = jwt.sign(
            {
                id: usuarioResult.insertId,
                email: userData.email,
                role: userData.role,
                clinicaId: clinicaId
            },
            process.env.JWT_SECRET || 'seu-segredo-super-seguro',
            { expiresIn: '7d' }
        );
        
        return {
            ok: true,
            statusCode: 201,
            message: "Clínica cadastrada com sucesso",
            data: {
                clinic: {
                    id: clinicaId,
                    nome: clinicaData.nome,
                    email: clinicaData.email,
                    cnpj: clinicaData.cnpj,
                    especialidades: data.specialty
                },
                user: {
                    id: usuarioResult.insertId,
                    nome: userData.nome,
                    email: userData.email,
                    role: userData.role
                },
                token
            }
        };
        
    } catch (err) {
        await connection.rollback();
        console.error("Erro ao criar clínica:", err);
        
        return {
            ok: false,
            statusCode: 500,
            message: "Erro interno do servidor ao criar clínica"
        };
        
    } finally {
        connection.release();
    }
}

// Função para obter clínica por ID
export async function getClinicaById(clinicaId) {
    try {
        const [clinica] = await pool.query(
            'SELECT * FROM clinicas WHERE id = ?',
            [clinicaId]
        );
        
        if (clinica.length === 0) {
            return {
                ok: false,
                statusCode: 404,
                message: "Clínica não encontrada"
            };
        }
        
        // Obter especialidades
        const [especialidades] = await pool.query(
            'SELECT especialidade FROM clinica_especialidades WHERE clinica_id = ?',
            [clinicaId]
        );
        
        return {
            ok: true,
            data: {
                ...clinica[0],
                especialidades: especialidades.map(e => e.especialidade)
            }
        };
        
    } catch (err) {
        console.error("Erro ao obter clínica:", err);
        return {
            ok: false,
            statusCode: 500,
            message: "Erro ao obter clínica"
        };
    }
}

// Função para listar clínicas
export async function listClinicas(limit = 10, offset = 0) {
    try {
        const [clinicas] = await pool.query(
            'SELECT * FROM clinicas LIMIT ? OFFSET ?',
            [limit, offset]
        );
        
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as total FROM clinicas'
        );
        
        return {
            ok: true,
            data: clinicas,
            total: countResult[0].total,
            limit,
            offset
        };
        
    } catch (err) {
        console.error("Erro ao listar clínicas:", err);
        return {
            ok: false,
            statusCode: 500,
            message: "Erro ao listar clínicas"
        };
    }
}

// Função para atualizar clínica
export async function updateClinica(clinicaId, data) {
    try {
        const updateFields = [];
        const updateValues = [];
        
        if (data.clinicName) {
            updateFields.push('nome = ?');
            updateValues.push(data.clinicName);
        }
        
        if (data.clinicPhone) {
            updateFields.push('telefone = ?');
            updateValues.push(data.clinicPhone);
        }
        
        if (data.description !== undefined) {
            updateFields.push('descricao = ?');
            updateValues.push(data.description);
        }
        
        if (updateFields.length === 0) {
            return {
                ok: false,
                statusCode: 400,
                message: "Nenhum campo para atualizar"
            };
        }
        
        updateValues.push(clinicaId);
        
        const [result] = await pool.query(
            `UPDATE clinicas SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );
        
        if (result.affectedRows === 0) {
            return {
                ok: false,
                statusCode: 404,
                message: "Clínica não encontrada"
            };
        }
        
        return {
            ok: true,
            message: "Clínica atualizada com sucesso"
        };
        
    } catch (err) {
        console.error("Erro ao atualizar clínica:", err);
        return {
            ok: false,
            statusCode: 500,
            message: "Erro ao atualizar clínica"
        };
    }
}
