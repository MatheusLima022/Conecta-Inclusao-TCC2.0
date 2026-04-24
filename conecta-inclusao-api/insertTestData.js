import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

// Configuração do banco de dados
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'usbw',
  database: 'conecta_inclusao',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Função para inserir dados de teste
async function insertTestData() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Hash da senha '123456'
    const password = '123456';
    const password_hash = await bcrypt.hash(password, 10);
    
    console.log('Hash da senha gerado:', password_hash);
    
    // Inserir usuário para clínica
    const [userResult] = await connection.execute(
      `INSERT INTO users (name, email, password_hash, profile, status) 
       VALUES (?, ?, ?, ?, ?)`,
      ['Clínica Teste', 'clinica@test.local', password_hash, 'clinica', 'ACTIVE']
    );
    
    const userId = userResult.insertId;
    console.log('Usuário criado com ID:', userId);
    
    // Inserir clínica
    await connection.execute(
      `INSERT INTO clinicas (usuario_id, cnpj, email, razao_social, endereco, cidade, estado, cep, telefone, responsavel) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        '12345678000190',
        'clinica@test.local',
        'Clínica Teste LTDA',
        'Rua Teste, 123',
        'São Paulo',
        'SP',
        '01310100',
        '1133334444',
        'Gerente Teste'
      ]
    );
    
    console.log('Clínica inserida com CNPJ: 12345678000190');
    console.log('\n✅ Dados de teste inseridos com sucesso!');
    console.log('\nCredenciais para login:');
    console.log('  CNPJ: 12345678000190');
    console.log('  Senha: 123456');
    
  } catch (error) {
    console.error('Erro ao inserir dados:', error.message);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

// Executar
insertTestData();
