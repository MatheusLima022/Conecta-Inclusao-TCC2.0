// Importa a biblioteca Zod para validação de dados
import { z } from "zod";

// Schema de validação para criação de clínica
export const createClinicSchema = z.object({
    clinicName: z
        .string()
        .trim()
        .min(3, "Nome da clínica deve ter no mínimo 3 caracteres")
        .max(150, "Nome da clínica deve ter no máximo 150 caracteres"),
    
    cnpj: z
        .string()
        .regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, "CNPJ inválido"),
    
    clinicPhone: z
        .string()
        .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone inválido"),
    
    clinicEmail: z
        .string()
        .trim()
        .toLowerCase()
        .email("Email da clínica inválido"),
    
    specialty: z
        .array(z.string())
        .min(1, "Selecione pelo menos uma especialidade"),
    
    description: z
        .string()
        .trim()
        .max(500, "Descrição não pode ter mais de 500 caracteres")
        .optional(),
    
    // Endereço
    cep: z
        .string()
        .regex(/^\d{5}-\d{3}$/, "CEP inválido"),
    
    address: z
        .string()
        .trim()
        .min(3, "Endereço inválido")
        .max(150, "Endereço muito longo"),
    
    number: z
        .string()
        .trim()
        .min(1, "Número é obrigatório"),
    
    complement: z
        .string()
        .trim()
        .max(100, "Complemento muito longo")
        .optional(),
    
    neighborhood: z
        .string()
        .trim()
        .min(2, "Bairro inválido"),
    
    city: z
        .string()
        .trim()
        .min(2, "Cidade inválida"),
    
    state: z
        .string()
        .trim()
        .length(2, "Estado deve ter 2 letras"),
    
    // Responsável
    responsibleName: z
        .string()
        .trim()
        .min(3, "Nome do responsável deve ter no mínimo 3 caracteres"),
    
    cpf: z
        .string()
        .regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF inválido"),
    
    crm: z
        .string()
        .trim()
        .optional(),
    
    responsibleEmail: z
        .string()
        .trim()
        .toLowerCase()
        .email("Email do responsável inválido"),
    
    responsiblePhone: z
        .string()
        .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, "Telefone do responsável inválido"),
    
    password: z
        .string()
        .min(8, "Senha deve ter no mínimo 8 caracteres")
        .max(100, "Senha muito longa")
        .regex(/[a-zA-Z]/, "Senha deve conter letras")
        .regex(/[0-9]/, "Senha deve conter números"),
    
    confirmPassword: z
        .string(),
    
    agreeTerms: z
        .boolean()
        .refine(val => val === true, "Você deve concordar com os termos")
}).refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"]
});
