// Importa a biblioteca Zod para validação de dados
import { z } from "zod";

// Schema de validação para criação de agendamento
export const createAgendamentoSchema = z.object({
    clinica_id: z
        .number()
        .int()
        .positive("ID da clínica deve ser um número positivo"),
    
    paciente_id: z
        .number()
        .int()
        .positive("ID do paciente deve ser um número positivo"),
    
    profissional_id: z
        .number()
        .int()
        .positive("ID do profissional deve ser um número positivo"),
    
    data_agendamento: z
        .string()
        .refine((date) => !isNaN(Date.parse(date)), "Data de agendamento inválida")
        .refine((date) => new Date(date) > new Date(), "Data de agendamento deve ser futura"),
    
    especialidade: z
        .string()
        .trim()
        .min(1, "Especialidade é obrigatória")
        .max(100, "Especialidade muito longa"),
    
    tipo_consulta: z
        .enum(['presencial', 'online', 'telefone'])
        .default('presencial'),
    
    observacoes: z
        .string()
        .trim()
        .max(500, "Observações não podem ter mais de 500 caracteres")
        .optional()
});