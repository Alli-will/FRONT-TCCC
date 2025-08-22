# Front-end TCC

Este projeto é o front-end de um sistema de acompanhamento de bem-estar corporativo, desenvolvido em Angular 17. Ele se integra a um backend NestJS e oferece funcionalidades como:

- Login e autenticação JWT
- Dashboard administrativo com métricas de bem-estar
- Diário emocional para colaboradores
- Gráficos e insights automáticos
- Controle de acesso por perfil (admin/colaborador)

## Como rodar o projeto

1. **Pré-requisitos:**
   - Node.js 18+
   - Angular CLI (`npm install -g @angular/cli`)
   - Backend rodando em http://localhost:3000 (NestJS)

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   ng serve
   ```
   Acesse em [https://front-tccc.vercel.app/](https://front-tccc.vercel.app/)

## Estrutura de pastas
- `src/app/` — componentes, serviços e módulos principais
- `src/app/services/` — serviços de integração com o backend
- `src/app/shared/` — componentes compartilhados (ex: modal de alerta)
- `src/app/diario/` — diário emocional do colaborador
- `src/app/dashboard/` — dashboard administrativo

## Funcionalidades principais
- **Dashboard:** Visualização de métricas globais, colaboradores em risco, análise por departamento
- **Diário:** Registro diário de emoções, motivos e descrição
- **Gráficos:** Evolução emocional por semana, mês e ano
- **Controle de acesso:** Apenas admins acessam o dashboard, colaboradores acessam apenas seu diário

## Observações
- O front-end depende do backend NestJS para autenticação e dados.
- As métricas e cálculos sensíveis são feitos no backend, garantindo segurança.
- O token JWT é salvo no localStorage após login.
---

Projeto desenvolvido para TCC — 2025.
