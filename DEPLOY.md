# Deploy na Vercel

## Projeto 1 — Frontend
- Importar o repositório normalmente
- Root Directory: ./
- Framework Preset: Vite
- Build Command: vite build
- Output Directory: dist
- Environment Variables:
  - VITE_API_URL = https://<url-do-backend-na-vercel>

## Projeto 2 — Backend
- Importar o mesmo repositório
- Root Directory: backend
- Framework Preset: Other
- Build Command: npm run build
- Output Directory: dist
- Environment Variables:
  - DATABASE_URL = <string de conexão do Neon>
  - JWT_SECRET = <sua chave secreta>
