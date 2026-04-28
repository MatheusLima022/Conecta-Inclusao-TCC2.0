// Script para verificar se o banco de dados está de acordo com o código
import { pool } from './conecta-inclusao-api/src/db.js';

async function checkDatabase() {
    try {
        console.log('Verificando conexão com o banco de dados...');

        // Verificar tabelas existentes
        const [tables] = await pool.execute('SHOW TABLES');
        console.log('Tabelas encontradas:', tables.map(t => Object.values(t)[0]));

        // Verificar estrutura das tabelas principais
        const tablesToCheck = ['clinicas', 'usuarios', 'agendamentos'];

        for (const table of tablesToCheck) {
            console.log(`\nEstrutura da tabela ${table}:`);
            const [columns] = await pool.execute(`DESCRIBE ${table}`);
            columns.forEach(col => {
                console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
            });
        }

        // Verificar se há dados
        for (const table of tablesToCheck) {
            const [count] = await pool.execute(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`Tabela ${table} tem ${count[0].count} registros`);
        }

        console.log('\nVerificação concluída!');
        process.exit(0);

    } catch (error) {
        console.error('Erro ao verificar banco de dados:', error);
        process.exit(1);
    }
}

checkDatabase();