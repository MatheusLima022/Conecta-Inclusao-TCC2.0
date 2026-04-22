# Integração do Sistema de Autenticação Avançado

## 📋 Resumo das Mudanças

### Banco de Dados (Banco de dados.sql)
✅ **Adicionadas:**
- Tabela `clinicas` com campos: cnpj, razao_social, endereco, cidade, estado, cep, telefone, responsavel
- Campo `cpf` (único) na tabela `pacientes`
- Campo `clinica_id` (FK) na tabela `medicos` para vincular a uma clínica
- Relacionamentos (Foreign Keys) adequados para integridade referencial

### Backend (Node.js/Express)

#### Novos Arquivos:
1. **`src/services/auth.advanced.service.js`**
   - `loginUniversal()` - Login com detecção automática de tipo (CRM, CNPJ, CPF, Email)
   - `registerUser()` - Registro universal com validação de perfil
   - Funções auxiliares: `loginWithCRM()`, `loginWithCNPJ()`, `loginWithCPF()`, `loginWithEmail()`

2. **`src/validators/auth.advanced.validators.js`**
   - Schemas Zod para validação
   - Suporte para múltiplos formatos (com ou sem formatação)

3. **`src/routes/auth.advanced.routes.js`**
   - Rotas para login universal
   - Rotas para registro de pacientes (CPF)
   - Rotas para registro de médicos (CRM)
   - Rotas para registro de clínicas (CNPJ)

## 🔧 Como Integrar ao app.js

Adicione as seguintes linhas ao seu `src/app.js`:

```javascript
import authAdvancedRoutes from "./routes/auth.advanced.routes.js";

// ... outras importações ...

// Adicione esta linha após suas outras rotas de autenticação:
app.use("/auth", authAdvancedRoutes);
```

## 📚 Exemplos de Uso

### 1. Login Universal

**Request:**
```bash
POST /auth/login/universal
Content-Type: application/json

{
  "identifier": "123456789012",  // CPF sem formatação
  "password": "senha123"
}
```

Aceita qualquer um destes formatos para `identifier`:
- **CPF**: `123.456.789-12` ou `12345678901`
- **CNPJ**: `12.345.678/0001-90` ou `12345678000190`
- **CRM**: `ABC1234` ou `CRM1234`
- **Email**: `usuario@example.com`

**Response (Sucesso - 200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "12345678901@conecta.local",
    "profile": "paciente"
  }
}
```

### 2. Registrar Paciente

**Request:**
```bash
POST /auth/register/patient
Content-Type: application/json

{
  "cpf": "12345678901",
  "password": "SenhaForte123",
  "name": "João Silva",
  "nomeResponsavel": "Maria Silva",
  "tipoDeficiencia": "Mobilidade",
  "dataNascimento": "1990-05-15"
}
```

**Response (Sucesso - 201):**
```json
{
  "ok": true,
  "statusCode": 201,
  "message": "Usuário registrado com sucesso.",
  "data": {
    "userId": 10,
    "profile": "paciente",
    "identifier": "12345678901"
  }
}
```

### 3. Registrar Médico

**Request:**
```bash
POST /auth/register/doctor
Content-Type: application/json

{
  "crm": "ABC1234",
  "password": "SenhaForte123",
  "name": "Dr. João Silva",
  "especialidade": "Cardiologia",
  "clinicaId": 1
}
```

### 4. Registrar Clínica/Empresa

**Request:**
```bash
POST /auth/register/clinic
Content-Type: application/json

{
  "cnpj": "12345678000190",
  "password": "SenhaForte123",
  "name": "Clínica Saúde",
  "razaoSocial": "Clínica Saúde Ltda",
  "endereco": "Rua Principal, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01310100",
  "telefone": "1133334444",
  "responsavel": "João Silva"
}
```

## 🔐 Segurança Implementada

- ✅ **Rate Limiting**: 20 tentativas de login por minuto, 5 registros por hora
- ✅ **Bloqueio por Tentativas**: Após 3 falhas, usuário bloqueado por 5 minutos
- ✅ **Hash de Senha**: BCrypt com 10 salt rounds
- ✅ **JWT Tokens**: Expiração em 1 hora (configurável via `JWT_EXPIRES_IN`)
- ✅ **SQL Injection Prevention**: Prepared statements em todas as queries
- ✅ **Validação em Múltiplas Camadas**: Schema Zod + Backend

## 🎯 Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────┐
│           Usuário envia Identificador + Senha           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │ Detectar tipo de identifier│
        │ (CPF/CNPJ/CRM/Email)       │
        └────────────┬───────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
    ┌───▼────┐  ┌───▼────┐  ┌───▼────┐
    │  CPF   │  │ CNPJ   │  │  CRM   │
    │(Pac.)  │  │(Clín.) │  │(Méd.)  │
    └───┬────┘  └───┬────┘  └───┬────┘
        │           │           │
        └───┬───────┴───────────┘
            │
            ▼
    ┌──────────────────────┐
    │ Buscar no Banco      │
    │ Validar Senha        │
    │ Gerar JWT Token      │
    └──────────────────────┘
```

## 🛠️ Variáveis de Ambiente Necessárias

```env
JWT_SECRET=sua_chave_secreta_super_segura_aqui
JWT_EXPIRES_IN=1h
MAX_LOGIN_ATTEMPTS=3
LOCK_MINUTES=5
```

## 📝 Notas Importantes

1. **Compatibilidade com sistema antigo**: O endpoint `/auth/login` original continua funcionando com email
2. **Transações ACID**: Registros usam transações para garantir consistência de dados
3. **Email automático**: Pacientes, médicos e clínicas têm um email gerado automaticamente no formato `{identificador}@conecta.local`
4. **Restrições de perfil**: Um médico só pode fazer login com CRM, paciente com CPF, clínica com CNPJ

## 🚀 Próximos Passos

1. Importar as rotas no `app.js`
2. Atualizar as interfaces de login no frontend para aceitar os novos identificadores
3. Testar os endpoints com ferramentas como Postman ou Thunder Client
4. Migrar usuários existentes se necessário

## ✨ Melhorias Futuras

- [ ] Recuperação de senha via identificador
- [ ] Autenticação multi-fator (2FA)
- [ ] Login social (Google, GitHub)
- [ ] Auditoria de logins
- [ ] Dashboard de segurança
