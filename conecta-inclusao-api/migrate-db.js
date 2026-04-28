// Script de migração do banco de dados
import { pool } from './src/db.js';

async function migrateDatabase() {
    try {
        console.log('Iniciando migração do banco de dados...');

        // Renomear data_hora para data_agendamento
        await pool.execute(`
            ALTER TABLE agendamentos
            CHANGE data_hora data_agendamento DATETIME NOT NULL
        `);

        // Adicionar colunas faltantes
        await pool.execute(`
            ALTER TABLE agendamentos
            ADD COLUMN clinica_id INT NOT NULL AFTER id,
            ADD COLUMN especialidade VARCHAR(100) AFTER data_agendamento,
            ADD COLUMN tipo_consulta ENUM('presencial', 'online', 'telefone') DEFAULT 'presencial' AFTER especialidade,
            ADD COLUMN observacoes TEXT AFTER tipo_consulta
        `);

        // Adicionar foreign key
        await pool.execute(`
            ALTER TABLE agendamentos
            ADD FOREIGN KEY (clinica_id) REFERENCES clinicas(id) ON DELETE CASCADE
        `);

        // Renomear medico_id para profissional_id
        await pool.execute(`
            ALTER TABLE agendamentos
            CHANGE medico_id profissional_id INT NOT NULL
        `);

        console.log('Migração concluída com sucesso!');

        // Verificar estrutura final
        const [columns] = await pool.execute('DESCRIBE agendamentos');
        console.log('Estrutura final da tabela agendamentos:');
        columns.forEach(col => {
            console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key}`);
        });

        process.exit(0);

    } catch (error) {
        console.error('Erro na migração:', error);
        process.exit(1);
    }
}

migrateDatabase();