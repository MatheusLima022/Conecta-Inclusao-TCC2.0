# API de Cadastro de Clínicas - Conecta Inclusão

## Endpoints

### 1. Registrar Nova Clínica
**POST** `/api/clinicas/register`

Registra uma nova clínica no sistema com todas as informações necessárias.

#### Request Headers
```
Content-Type: application/json
```

#### Request Body
```json
{
  "clinicName": "Clínica Saúde Integral",
  "cnpj": "12.345.678/0001-90",
  "clinicPhone": "(11) 98765-4321",
  "clinicEmail": "contato@clinica.com.br",
  "specialty": ["Cardiologia", "Pediatria", "Ortopedia"],
  "description": "Clínica especializada em atendimento integrado",
  
  "cep": "01310-100",
  "address": "Avenida Paulista",
  "number": "1000",
  "complement": "Sala 500",
  "neighborhood": "Bela Vista",
  "city": "São Paulo",
  "state": "SP",
  
  "responsibleName": "João Silva Santos",
  "cpf": "123.456.789-00",
  "crm": "123456/SP",
  "responsibleEmail": "joao@clinica.com.br",
  "responsiblePhone": "(11) 99876-5432",
  "password": "SenhaSegura123",
  "confirmPassword": "SenhaSegura123",
  "agreeTerms": true
}
```

#### Response Success (201)
```json
{
  "ok": true,
  "statusCode": 201,
  "message": "Clínica cadastrada com sucesso",
  "data": {
    "clinic": {
      "id": 1,
      "nome": "Clínica Saúde Integral",
      "email": "contato@clinica.com.br",
      "cnpj": "12345678000190",
      "especialidades": ["Cardiologia", "Pediatria", "Ortopedia"]
    },
    "user": {
      "id": 1,
      "nome": "João Silva Santos",
      "email": "joao@clinica.com.br",
      "role": "admin_clinica"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Response Errors

**400 - Dados Inválidos**
```json
{
  "ok": false,
  "message": "Dados inválidos",
  "errors": {
    "clinicName": "Nome da clínica deve ter no mínimo 3 caracteres",
    "cnpj": "CNPJ inválido"
  }
}
```

**409 - Recurso Já Existe**
```json
{
  "ok": false,
  "message": "CNPJ já cadastrado no sistema"
}
```

**500 - Erro Interno**
```json
{
  "ok": false,
  "message": "Erro interno do servidor ao criar clínica"
}
```

---

### 2. Listar Clínicas
**GET** `/api/clinicas?limit=10&offset=0`

Lista todas as clínicas cadastradas com paginação.

#### Query Parameters
- `limit` (opcional): Número máximo de resultados por página (padrão: 10, máximo: 100)
- `offset` (opcional): Número de registros a pular (padrão: 0)

#### Response Success (200)
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "nome": "Clínica Saúde Integral",
      "cnpj": "12345678000190",
      "email": "contato@clinica.com.br",
      "telefone": "(11) 98765-4321",
      "endereco": "Avenida Paulista",
      "numero": "1000",
      "bairro": "Bela Vista",
      "cidade": "São Paulo",
      "estado": "SP",
      "status": "ativo",
      "data_criacao": "2026-04-27T10:30:00.000Z"
    }
  ],
  "total": 5,
  "limit": 10,
  "offset": 0
}
```

---

### 3. Obter Clínica por ID
**GET** `/api/clinicas/:id`

Obtém os detalhes de uma clínica específica.

#### Path Parameters
- `id` (obrigatório): ID da clínica

#### Response Success (200)
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "nome": "Clínica Saúde Integral",
    "cnpj": "12345678000190",
    "email": "contato@clinica.com.br",
    "telefone": "(11) 98765-4321",
    "descricao": "Clínica especializada em atendimento integrado",
    "endereco": "Avenida Paulista",
    "numero": "1000",
    "complemento": "Sala 500",
    "bairro": "Bela Vista",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310100",
    "status": "ativo",
    "especialidades": ["Cardiologia", "Pediatria", "Ortopedia"],
    "data_criacao": "2026-04-27T10:30:00.000Z"
  }
}
```

#### Response Error (404)
```json
{
  "ok": false,
  "message": "Clínica não encontrada"
}
```

---

### 4. Atualizar Clínica
**PUT** `/api/clinicas/:id`

Atualiza informações de uma clínica.

#### Path Parameters
- `id` (obrigatório): ID da clínica

#### Request Body (todos os campos opcionais)
```json
{
  "clinicName": "Clínica Saúde Integral - Unidade 2",
  "clinicPhone": "(11) 98765-4322",
  "description": "Clínica atualizada"
}
```

#### Response Success (200)
```json
{
  "ok": true,
  "message": "Clínica atualizada com sucesso"
}
```

---

## Validações

### CNPJ
- Formato: `XX.XXX.XXX/XXXX-XX`
- Validação: Algoritmo completo do CNPJ
- Obrigatório: Sim
- Único: Sim

### CPF
- Formato: `XXX.XXX.XXX-XX`
- Validação: Algoritmo completo do CPF
- Obrigatório: Sim (responsável)
- Único: Sim

### Email
- Formato: `usuario@dominio.com.br`
- Validação: RFC 5322
- Obrigatório: Sim
- Único: Sim

### Telefone
- Formato: `(XX) XXXXX-XXXX` ou `(XX) XXXX-XXXX`
- Obrigatório: Sim

### CEP
- Formato: `XXXXX-XXX`
- Obrigatório: Sim

### Senha
- Mínimo: 8 caracteres
- Deve conter: Letras e números
- Obrigatório: Sim

### Especialidades
- Mínimo: 1
- Exemplos: `Cardiologia`, `Pediatria`, `Ortopedia`, `Dermatologia`, `Neurologia`, `Psiquiatria`

---

## Códigos de Status HTTP

| Status | Descrição |
|--------|-----------|
| 200 | OK - Requisição bem-sucedida |
| 201 | Created - Recurso criado com sucesso |
| 400 | Bad Request - Dados inválidos |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Recurso já existe (CNPJ/Email duplicado) |
| 500 | Internal Server Error - Erro do servidor |

---

## Segurança

- **Rate Limiting**: Máximo 5 cadastros por hora por IP
- **Criptografia**: Senhas são hash com bcrypt (10 rounds)
- **Transações**: Operações de banco de dados são atômicas
- **Validação**: Todos os dados são validados com Zod
- **Headers de Segurança**: Helmet adiciona headers de segurança HTTP
- **CORS**: Configurado para aceitar requisições de qualquer origem
- **JWT**: Token de autenticação com expiração de 7 dias

---

## Exemplo de Uso com cURL

```bash
# Registrar nova clínica
curl -X POST http://localhost:3000/api/clinicas/register \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Clínica Saúde Integral",
    "cnpj": "12.345.678/0001-90",
    "clinicPhone": "(11) 98765-4321",
    "clinicEmail": "contato@clinica.com.br",
    "specialty": ["Cardiologia", "Pediatria"],
    "description": "Clínica especializada",
    "cep": "01310-100",
    "address": "Avenida Paulista",
    "number": "1000",
    "neighborhood": "Bela Vista",
    "city": "São Paulo",
    "state": "SP",
    "responsibleName": "João Silva",
    "cpf": "123.456.789-00",
    "responsibleEmail": "joao@clinica.com.br",
    "responsiblePhone": "(11) 99876-5432",
    "password": "SenhaSegura123",
    "confirmPassword": "SenhaSegura123",
    "agreeTerms": true
  }'

# Listar clínicas
curl -X GET http://localhost:3000/api/clinicas

# Obter clínica específica
curl -X GET http://localhost:3000/api/clinicas/1

# Atualizar clínica
curl -X PUT http://localhost:3000/api/clinicas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "clinicName": "Clínica Saúde Integral - Nova"
  }'
```

---

## Banco de Dados

Execute o script `SCHEMA_CLINICAS.sql` para criar as tabelas necessárias:

```bash
mysql -u seu_usuario -p seu_banco < SCHEMA_CLINICAS.sql
```

As tabelas criadas são:
- `clinicas` - Informações da clínica
- `clinica_especialidades` - Especialidades da clínica
- `usuarios` - Usuários do sistema
- `agendamentos` - Agendamentos (opcional)
- `logs_acesso` - Logs de acesso (opcional)
