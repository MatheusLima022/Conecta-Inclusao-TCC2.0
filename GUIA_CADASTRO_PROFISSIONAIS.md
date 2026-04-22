# 📋 Guia Completo: Cadastro de Profissionais pela Empresa

## 🎯 O que foi implementado

### Backend
✅ Função `registerProfessional()` para registrar médicos
✅ Rota `POST /auth/register/professional` para cadastro de profissionais
✅ Dados da clínica agora são salvos completamente na tabela `clinicas`
✅ Profissionais são vinculados à clínica pelo `clinica_id`

### Frontend
✅ Arquivo `dashboard-empresa-profissionais.js` para gerenciar profissionais
✅ Função `registerProfessional()` no `api.js` para comunicação com backend
✅ Carregamento automático de lista de profissionais
✅ Validação de CRM com máscara automática

## 🔧 Fluxo de Funcionamento

```
1. Empresa faz login com CNPJ
   ↓
2. Dados da empresa vão para tabela clinicas:
   - CNPJ (chave única)
   - Razão Social
   - Endereço
   - Cidade
   - Estado
   - CEP
   - Telefone
   - Responsável
   ↓
3. Empresa acessa dashboard e clica em "Cadastrar Profissionais"
   ↓
4. Empresa preenche:
   - CRM
   - Nome do Médico
   - Especialidade
   - Biografia (opcional)
   ↓
5. Dados vão para tabela medicos:
   - usuario_id (novo usuário criado)
   - clinica_id (vínculo com empresa)
   - crm
   - especialidade
   - bio
   ↓
6. Médico recebe senha temporária: CRM@2026
   (Deve mudar na primeiro login)
```

## 📊 Estrutura de Dados

### Tabela `users` (novo médico criado)
```sql
- id: AUTO_INCREMENT
- name: Nome do médico
- email: CRM@conecta.local
- password_hash: CRM@2026 (hasheado)
- profile: 'medico'
- status: 'ACTIVE'
```

### Tabela `clinicas` (dados da empresa)
```sql
- id: AUTO_INCREMENT
- usuario_id: FK → users (empresa)
- cnpj: UNIQUE
- razao_social: ✅ Agora salvo
- endereco: ✅ Agora salvo
- cidade: ✅ Agora salvo
- estado: ✅ Agora salvo
- cep: ✅ Agora salvo
- telefone: ✅ Agora salvo
- responsavel: ✅ Agora salvo
```

### Tabela `medicos` (médico vinculado)
```sql
- id: AUTO_INCREMENT
- usuario_id: FK → users (médico)
- clinica_id: FK → clinicas ✅ Agora vinculado
- crm: UNIQUE
- especialidade: ✅ Salvo
- bio: Opcional
```

## 🔄 Testando o Sistema

### 1. Limpar Dados de Exemplo
```bash
mysql -u seu_usuario -p conecta_inclusao < LIMPAR_DADOS_EXEMPLO.sql
```

### 2. Registrar Empresa
**Request:**
```bash
POST http://localhost:3000/auth/register/clinic
Content-Type: application/json

{
  "cnpj": "12345678000190",
  "password": "Empresa123!",
  "name": "Clínica Saúde",
  "razaoSocial": "Clínica Saúde Plus Ltda",
  "endereco": "Rua Principal, 123",
  "cidade": "São Paulo",
  "estado": "SP",
  "cep": "01310100",
  "telefone": "1133334444",
  "responsavel": "João Silva"
}
```

**Response (sucesso):**
```json
{
  "ok": true,
  "statusCode": 201,
  "message": "Usuário registrado com sucesso.",
  "data": {
    "userId": 1,
    "profile": "clinica",
    "identifier": "12345678000190"
  }
}
```

✅ Verificar no MySQL:
```sql
SELECT * FROM clinicas WHERE cnpj = '12345678000190';
-- Deve retornar todos os dados: razao_social, endereco, cidade, etc.
```

### 3. Login da Empresa
**Request:**
```bash
POST http://localhost:3000/auth/login/universal
Content-Type: application/json

{
  "identifier": "12345678000190",
  "password": "Empresa123!"
}
```

### 4. Registrar Profissional (Médico)
**Request:**
```bash
POST http://localhost:3000/auth/register/professional
Authorization: Bearer [TOKEN_DA_EMPRESA]
Content-Type: application/json

{
  "crm": "ABC1234",
  "name": "Dr. João Silva",
  "especialidade": "Cardiologia",
  "clinicaId": 1,
  "bio": "Especialista em doenças cardiovasculares"
}
```

**Response (sucesso):**
```json
{
  "ok": true,
  "statusCode": 201,
  "message": "Profissional registrado com sucesso.",
  "data": {
    "userId": 2,
    "crm": "ABC1234",
    "defaultPassword": "ABC1234@2026",
    "name": "Dr. João Silva"
  }
}
```

✅ Verificar no MySQL:
```sql
-- Médico criado
SELECT * FROM users WHERE profile = 'medico' AND crm = 'ABC1234';

-- Médico vinculado à clínica
SELECT m.*, c.razao_social 
FROM medicos m 
JOIN clinicas c ON m.clinica_id = c.id
WHERE m.crm = 'ABC1234';
```

### 5. Médico Faz Login
**Request:**
```bash
POST http://localhost:3000/auth/login/universal
Content-Type: application/json

{
  "identifier": "ABC1234",
  "password": "ABC1234@2026"
}
```

✅ Médico pode fazer login e acessar dashboard!

## 🛠️ Atualizar HTML do Dashboard da Empresa

Adicione ao `dashboard-empresa.html` na seção de cadastro de profissionais:

```html
<section class="tab-content" id="register">
    <h2>Cadastrar Profissionais</h2>
    
    <form id="registerProfessionalForm">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div class="input-group">
                <label for="professionalCRM">CRM *</label>
                <input type="text" id="professionalCRM" placeholder="ABC1234" maxlength="7" required>
            </div>
            <div class="input-group">
                <label for="professionalName">Nome do Médico *</label>
                <input type="text" id="professionalName" placeholder="Dr. João Silva" required>
            </div>
        </div>
        
        <div class="input-group">
            <label for="professionalEspecialidade">Especialidade *</label>
            <input type="text" id="professionalEspecialidade" placeholder="Ex: Cardiologia" required>
        </div>
        
        <div class="input-group">
            <label for="professionalBio">Biografia</label>
            <textarea id="professionalBio" placeholder="Conte sobre sua experiência..." rows="3"></textarea>
        </div>
        
        <button type="submit" class="btn-primary">Registrar Profissional</button>
    </form>
    
    <h3 style="margin-top: 30px;">Profissionais Cadastrados</h3>
    <div id="professionalsList"></div>
</section>
```

E adicione no `<head>` ou antes do `</body>`:
```html
<script src="../assets/js/utils.js"></script>
<script src="../assets/js/dashboard-empresa-profissionais.js"></script>
```

## 📝 Checklist de Implementação

- [ ] Código backend atualizado (auth.advanced.service.js)
- [ ] Rotas adicionadas (auth.advanced.routes.js)
- [ ] CORS configurado no app.js
- [ ] Banco de dados limpo (LIMPAR_DADOS_EXEMPLO.sql)
- [ ] api.js atualizado com registerProfessional()
- [ ] dashboard-empresa-profissionais.js criado
- [ ] HTML do dashboard atualizado com formulário
- [ ] Testes realizados com sucesso

## 🧪 Casos de Teste

### ✅ Teste 1: Dados da Empresa Salvos
```sql
SELECT cnpj, razao_social, endereco, cidade, estado, cep, telefone, responsavel
FROM clinicas
WHERE cnpj = '12345678000190';
```
Esperado: Todos os 8 campos com dados

### ✅ Teste 2: Profissional Vinculado
```sql
SELECT m.crm, m.especialidade, c.razao_social
FROM medicos m
JOIN clinicas c ON m.clinica_id = c.id
WHERE m.crm = 'ABC1234';
```
Esperado: CRM, especialidade e razão social da clínica

### ✅ Teste 3: Profissional Pode Fazer Login
```bash
POST /auth/login/universal
{"identifier": "ABC1234", "password": "ABC1234@2026"}
```
Esperado: Token JWT + dados do médico

### ✅ Teste 4: Sem Dados de Exemplo
```sql
SELECT COUNT(*) FROM users WHERE profile NOT IN ('paciente', 'medico', 'clinica');
```
Esperado: 0 (nenhum dado de exemplo)

## 🚀 Próximas Funcionalidades

- [ ] Editar dados de profissional
- [ ] Deletar profissional
- [ ] Resetar senha de profissional
- [ ] Histórico de cadastros
- [ ] Relatórios de profissionais
- [ ] Exportar lista de profissionais (CSV/PDF)

## 📞 Suporte

Se encontrar erros:

1. **Erro 400 "CRM já cadastrado"**
   - CRM já existe no banco
   - Limpe com: DELETE FROM medicos WHERE crm = 'ABC1234';

2. **Erro 404 "Clínica não encontrada"**
   - Verifique se clinicaId existe
   - SELECT * FROM clinicas;

3. **Dados não salvam na tabela clinicas**
   - Verifique estrutura da tabela: DESCRIBE clinicas;
   - Confirme que Banco de dados.sql foi executado

4. **Médico não consegue fazer login**
   - Verifique se usuario_id foi criado: SELECT * FROM users WHERE crm = 'ABC1234';
   - Confirme senha: Sempre CRM@2026 (exemplo: ABC1234@2026)
