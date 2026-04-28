// Script para renomear coluna
import { pool } from './src/db.js';

async function renameColumn() {
    try {
        await pool.execute(`
            ALTER TABLE agendamentos
            CHANGE medico_id profissional_id INT NOT NULL
        `);
        console.log('Coluna renomeada com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

renameColumn();