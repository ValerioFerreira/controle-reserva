# Backend CBMPE - Sistema de Reserva Remunerada

Backend profissional em NestJS + Prisma + PostgreSQL (Neon), com autenticação JWT, sincronização CSV pública do Google Sheets e regras de cálculo de reserva.

## Stack
- Node.js + NestJS + TypeScript
- PostgreSQL (Neon) + Prisma
- JWT + Passport
- axios + csv-parse
- class-validator + class-transformer
- Jest
- Vercel Serverless (`@vercel/node`)

## Execução local
1. Copie `.env.example` para `.env`.
2. Instale dependências:
   - `npm install`
3. Gere Prisma Client:
   - `npm run prisma:generate`
4. Rode migrações:
   - `npm run prisma:migrate`
5. Suba API:
   - `npm run start:dev`

## Environment Variables (Vercel)
- Obrigatória:
  - `DATABASE_URL`
- Recomendadas:
  - `JWT_SECRET` (se não definir, usa fallback `dev-secret`)
  - `JWT_EXPIRES_IN` (default `8h`)
  - `CSV_PUBLIC_URL` (já possui default da planilha pública oficial)

## Contrato REST (camelCase)

Base URL: `/api/v1`

### Auth
- `POST /auth/login`
  - Request:
    ```json
    {
      "username": "adm",
      "password": "adm"
    }
    ```
  - Response:
    ```json
    {
      "accessToken": "jwt",
      "user": {
        "nome": "Administrador",
        "perfil": "admin"
      }
    }
    ```

### Militares
- `GET /militares`
  - Query: `matricula`, `nome`, `postoGrad`, `dataInicio`, `dataFim`, `alerta`, `page`, `pageSize`
- `GET /militares/:matricula`
- `GET /militares/dashboard`
  - Response:
    ```json
    {
      "totalMilitares": 0,
      "alertaVermelho": 0,
      "alertaAmarelo": 0
    }
    ```

### Averbações
- `GET /militares/:matricula/averbacoes`
- `POST /militares/:matricula/averbacoes`
- `PUT /militares/:matricula/averbacoes/:id`
- `DELETE /militares/:matricula/averbacoes/:id`

Request body (`POST`/`PUT`):
```json
{
  "tipo": "INSS",
  "dias": 120,
  "processoSeiMilitar": "12345",
  "processoSeiInss": "67890",
  "obs": "Texto opcional"
}
```

Tipos válidos de `tipo`:
- `INSS`
- `FFAA`
- `PMPE`
- `PM DE OUTROS ESTADOS`
- `BM DE OUTROS ESTADOS`

### Afastamentos
- `GET /militares/:matricula/afastamentos`
- `POST /militares/:matricula/afastamentos`
- `PUT /militares/:matricula/afastamentos/:id`
- `DELETE /militares/:matricula/afastamentos/:id`

Request body (`POST`/`PUT`):
```json
{
  "tipo": "LTIP",
  "dias": 30,
  "processoSeiMilitar": "12345",
  "obs": "Texto opcional"
}
```

Tipos válidos de `tipo`:
- `FÉRIAS NÃO GOZADAS`
- `LTIP`

### Sincronização CSV
- `POST /sheets/sync`
  - Response:
    ```json
    {
      "inserted": 0,
      "updated": 0,
      "errors": []
    }
    ```

## Migração do frontend Base44 -> REST
- Substituir `base44.entities.*` por chamadas HTTP (axios/fetch) para os endpoints acima.
- Manter payloads em camelCase.
- Remover dependência de cálculos client-side e usar apenas dados retornados por `Militar`.
- Fluxo recomendado:
  1. Implementar client auth JWT.
  2. Migrar listagem e dashboard.
  3. Migrar CRUD de averbações/afastamentos.
  4. Integrar botão/ação de sync CSV.
