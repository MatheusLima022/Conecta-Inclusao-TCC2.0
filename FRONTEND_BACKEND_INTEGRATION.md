# 🔧 Guia Completo de Integração Frontend-Backend

## 📋 Resumo das Mudanças Realizadas

### ✅ Backend (Node.js/Express)
- Sistema de autenticação com CRM, CNPJ e CPF
- Detecção automática de tipo de identificador
- Rate limiting e proteção contra força bruta
- Transações ACID para integridade de dados

### ✅ Frontend (HTML/CSS/JS)
- Criados arquivos de cadastro para pacientes, médicos e empresas
- Sistema de login integrado com API do backend
- Cliente HTTP (api.js) com funções reutilizáveis
- Suporte a módulos ES6 para estrutura escalável

## 🚀 Passos para Configuração

### 1. **Backend - Integração ao app.js**

Adicione estas linhas ao seu `conecta-inclusao-api/src/app.js`:

```javascript
// ... outras importações ...
import authAdvancedRoutes from "./routes/auth.advanced.routes.js";

// ... middleware setup ...

// Adicione APÓS suas rotas existentes:
app.use("/auth", authAdvancedRoutes);

// ... resto do código ...
```

### 2. **Variáveis de Ambiente**

Configure o arquivo `.env` da API:

```env
# Banco de Dados
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=conecta_inclusao
DB_PORT=3306

# JWT
JWT_SECRET=sua_chave_secreta_super_segura_aqui_123456
JWT_EXPIRES_IN=1h

# Segurança
MAX_LOGIN_ATTEMPTS=3
LOCK_MINUTES=5

# Servidor
PORT=3000
NODE_ENV=development
```

### 3. **Configuração do Frontend**

Edite o arquivo `conecta-inclusao-front/src/assets/js/api.js` com o URL correto do backend:

```javascript
// Linha 4 - Atualize para sua URL
const API_BASE_URL = 'http://localhost:3000'; // ou seu servidor
```

### 4. **Banco de Dados**

Execute o script SQL atualizado:

```bash
mysql -u seu_usuario -p < "Banco de dados.sql"
```

Ou execute direto no MySQL:
```sql
USE conecta_inclusao;
-- Executar o arquivo SQL completo
```

## 📱 Fluxo de Acesso Disponível

### 🏥 **Empresa/Clínica**
1. Clique em "Cadastre sua empresa" no índice
2. Preencha formulário com CNPJ
3. Login com CNPJ + Senha
4. Acesso ao dashboard da empresa

### 👨‍⚕️ **Médico**
1. Clique em "Login de Médico"
2. Clique em "Não tem conta? Crie aqui"
3. Cadastre-se com CRM
4. Login com CRM + Senha
5. Acesso ao dashboard do médico

### 🧑‍🤝‍🧑 **Paciente**
1. Clique em "Login de Paciente"
2. Clique em "Não tem conta? Crie aqui"
3. Cadastre-se com CPF
4. Login com CPF + Senha
5. Acesso ao dashboard do paciente

## 🔗 Endpoints da API Disponíveis

### Autenticação
```
POST   /auth/login/universal        - Login com Email/CRM/CNPJ/CPF
POST   /auth/register/patient       - Cadastro de Paciente
POST   /auth/register/doctor        - Cadastro de Médico
POST   /auth/register/clinic        - Cadastro de Clínica
```

### Perfil de Usuário (requer JWT)
```
GET    /user/profile                - Dados do usuário
PUT    /user/profile                - Atualizar dados
GET    /clinic/profile              - Dados da clínica
GET    /doctor/profile              - Dados do médico
GET    /patient/profile             - Dados do paciente
```

### Agendamentos (requer JWT)
```
GET    /appointments/patient        - Agendamentos do paciente
GET    /appointments/doctor         - Agendamentos do médico
POST   /appointments                - Criar agendamento
PUT    /appointments/:id            - Atualizar agendamento
DELETE /appointments/:id            - Cancelar agendamento
```

### Relatórios (requer JWT)
```
POST   /reports                     - Criar relatório
GET    /reports/appointment/:id     - Buscar relatório
```

## 🧪 Testando os Endpoints

### Com Postman/Insomnia/Thunder Client:

**1. Registrar Paciente:**
```
POST http://localhost:3000/auth/register/patient
Content-Type: application/json

{
  "cpf": "12345678901",
  "password": "Senha123!",
  "name": "João Silva",
  "nomeResponsavel": "Maria Silva",
  "tipoDeficiencia": "Mobilidade",
  "dataNascimento": "1990-05-15"
}
```

**2. Registrar Médico:**
```
POST http://localhost:3000/auth/register/doctor
Content-Type: application/json

{
  "crm": "ABC1234",
  "password": "Senha123!",
  "name": "Dr. João",
  "especialidade": "Cardiologia"
}
```

**3. Registrar Clínica:**
```
POST http://localhost:3000/auth/register/clinic
Content-Type: application/json

{
  "cnpj": "12345678000190",
  "password": "Senha123!",
  "name": "Clínica Saúde",
  "razaoSocial": "Clínica Saúde Ltda",
  "endereco": "Rua Principal, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01310100"
}
```

**4. Login Universal:**
```
POST http://localhost:3000/auth/login/universal
Content-Type: application/json

{
  "identifier": "12345678901",  // CPF, CNPJ, CRM ou Email
  "password": "Senha123!"
}
```

**Response (sucesso):**
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

## ⚡ Formatos Aceitos

### CPF
- Formatado: `123.456.789-10`
- Sem formatação: `12345678910`

### CNPJ
- Formatado: `12.345.678/0001-90`
- Sem formatação: `12345678000190`

### CRM
- `ABC1234` (4-7 caracteres)
- `XYZ123`

### Email
- `usuario@example.com`

## 🔐 Fluxo de Segurança

```
1. Usuário submete credenciais
   ↓
2. Frontend valida formato
   ↓
3. Requisição POST com dados (HTTPS em produção)
   ↓
4. Backend valida esquema Zod
   ↓
5. Banco verifica existência e senha
   ↓
6. JWT gerado (válido por 1 hora)
   ↓
7. Token armazenado em localStorage
   ↓
8. Requisições subsequentes incluem token no header Authorization
```

## 📊 Arquivos Criados/Modificados

### Novo Backend
- ✅ `src/services/auth.advanced.service.js` - Lógica de autenticação
- ✅ `src/validators/auth.advanced.validators.js` - Validações Zod
- ✅ `src/routes/auth.advanced.routes.js` - Rotas HTTP

### Novo Frontend
- ✅ `pages/cadastro-paciente.html` - Formulário de cadastro
- ✅ `pages/cadastro-medico.html` - Formulário de cadastro
- ✅ `assets/js/api.js` - Cliente HTTP (módulo ES6)
- ✅ `assets/js/cadastro-paciente.js` - Lógica de cadastro
- ✅ `assets/js/cadastro-medico.js` - Lógica de cadastro
- ✅ `assets/js/login-paciente.js` - Atualizado para API
- ✅ `assets/js/login-medico.js` - Atualizado para API
- ✅ `assets/js/script-paciente.js` - Atualizado para API
- ✅ `assets/js/login-empresa.js` - Atualizado para API
- ✅ `assets/js/cadastro-empresa.js` - Atualizado para API

### Atualizado Banco de Dados
- ✅ `Banco de dados.sql` - Tabelas clinicas, cpf em pacientes, etc

### Documentação
- ✅ `AUTHENTICATION_INTEGRATION.md` - Guia de integração
- ✅ `DATABASE_TEST_EXAMPLES.sql` - Exemplos e testes
- ✅ `FRONTEND_BACKEND_INTEGRATION.md` - Este arquivo

## 🐛 Solução de Problemas

### Erro: "Failed to fetch from http://localhost:3000"
**Solução:** 
- Verifique se a API está rodando: `npm start`
- Verifique a porta (padrão 3000)
- Verifique se há CORS habilitado no backend

### Erro: "Módulo api.js não encontrado"
**Solução:**
- Certifique-se que navegador suporta módulos ES6
- Use navegador moderno (Chrome 61+, Firefox 67+, Safari 10.1+)

### Erro: "Credenciais inválidas"
**Solução:**
- Verifique formato do identificador (sem caracteres especiais)
- Verifique se o usuário foi registrado
- Verifique se a senha está correta

### Dados não são salvos no banco
**Solução:**
- Abra o DevTools (F12) → Network → verifique se requisição foi enviada
- Verifique se a API retornou sucesso (status 200 ou 201)
- Verifique logs da API: `npm start` mostra erros
- Conecte-se ao MySQL e verifique: `SELECT * FROM users;`

## 🚀 Próximos Passos

1. **Testes Automatizados**
   - Criar testes para autenticação
   - Validar fluxo de login/registro

2. **Implementar Endpoints Restantes**
   - Agendamentos
   - Relatórios médicos
   - Perfil de usuário

3. **Melhorias de Segurança**
   - HTTPS em produção
   - Refresh tokens
   - Autenticação multi-fator (2FA)

4. **Dashboard Funcional**
   - Integrar dashboards com API
   - Exibir dados reais do banco
   - Operações CRUD completas

## 📞 Suporte

Dúvidas sobre a implementação? Verifique:
- Logs do terminal da API
- DevTools do navegador (F12 → Console)
- Estado das requisições (F12 → Network)
- Arquivo de exemplo: `DATABASE_TEST_EXAMPLES.sql`
