# Front-end TCC

Aplicação Angular 17 para acompanhamento de bem-estar corporativo (Employee Sentiment / Clima & Pulso). Integra-se a um backend NestJS (porta padrão 3000) e oferece recursos para admins e colaboradores.

## Principais Recursos
- Autenticação JWT (login, armazenamento seguro via localStorage)
- Dashboard administrativo com métricas (eNPS, respondentes, departamentos)
- Gestão de Pesquisas (criação, listagem, responder, relatório detalhado por pergunta, NPS e distribuição)
- Gestão de Perguntas base (CRUD de perguntas reutilizáveis por empresa)
- Resposta de Pesquisa (tela dedicada com validação de obrigatórias)
- Diário emocional (registro individual + consultas)
- Termômetro eNPS (cálculo de score de engajamento / sentimento a partir das respostas recentes de pulso)
- Gerenciamento de Empresa (dados e colaboradores)
- Departamentos (criação e segmentação de métricas)
- Gestão de Usuários (cadastrar colaborador, perfis admin/employee/support)
- Loading global com interceptor
- Guards de rota (auth, admin, bloqueios contextuais)
- SSR (Server-Side Rendering) configurado via `@angular/ssr` + `express` (arquivo `server.ts`)
- Fallback automático de API (uso de base local + fallback explícito se a primária falhar)

## Tecnologias
- Angular 17 + Standalone Components/Modules híbrido
- RxJS para fluxo reativo
- Chart.js + ng2-charts para gráficos
- Bootstrap 5 para layout responsivo
- Angular SSR (`@angular/ssr`) para renderização no servidor
- Express para servir a versão SSR (script `serve:ssr:app-teste`)

## Requisitos
1. Node.js 18+
2. Angular CLI instalado globalmente (opcional se usar npx):
   ```bash
   npm install -g @angular/cli
   ```
3. Backend NestJS ativo em: `https://tcc-main.up.railway.app`
4. Arquivo `.env` (se usado pelo `resolveApiBase()`) apontando para a API (opcional).

## Instalação
```bash
npm install
```

## Execução em Desenvolvimento (SPA)
```bash
ng serve
```
Acesso padrão: `http://localhost:4200`

## Execução com SSR (Server-Side Rendering)
1. Build SSR/browser:
   ```bash
   ng build && ng run app-teste:server
   ```
2. Servir:
   ```bash
   node dist/app-teste/server/server.mjs
   ```
Ou usar o script (ajuste se necessário):
```bash
npm run serve:ssr:app-teste
```

## Scripts
- `npm start` – desenvolvimento (ng serve)
- `npm run build` – build de produção SPA
- `npm run serve:ssr:app-teste` – executa versão SSR compilada

## Estrutura de Pastas (Resumo)
```
src/app/
  autenticacao/            # Guards, rotas e lógica de acesso
  dashboard/               # Dashboard administrativo (métricas, resolver)
  pesquisas/               # Listagem e relatórios de pesquisas
  responder-pesquisa/      # Tela para responder pesquisa ativa
  cadastro-pesquisa/       # Criação de pesquisa (pulso ou clima)
  perguntas/               # CRUD de perguntas base reutilizáveis
  ess-thermometer/         # Componente de exibição do ESS
  diario/                  # Diário emocional + consulta
  empresa/                 # Dados e usuários da empresa
  departamentos/           # Gestão de departamentos
  usuarios/                # Administração de colaboradores
  perfil/                  # (Se existente) edição de perfil do usuário
  services/                # Serviços HTTP (search, question, user, auth...)
  shared/                  # Componentes compartilhados (modais, loaders)
  menu/, login/, home/     # Navegação e telas básicas
```

## Serviços HTTP Principais
`services/api-base.ts` – Resolve dinamicamente a base da API (permite fallback local).
`services/search.service.ts` – CRUD + respostas + relatórios de pesquisas com fallback para `https://tcc-main.up.railway.app`.
`services/question.service.ts` – CRUD de perguntas registradas (banco centralizado por empresa).
`services/dashboard.service.ts` – Métricas agregadas.
`services/user.service.ts` – Operações de usuários.
`services/department.service.ts` – Departamentos.
`auth-token.interceptor.ts` – Injeta Authorization Bearer <token> e ativa loading global.

## Fluxo de Autenticação
1. Login via endpoint backend (`/auth/login`).
2. Token JWT é armazenado em `localStorage`.
3. Interceptor adiciona automaticamente o header `Authorization`.
4. Guards validam papel (ADMIN vs EMPLOYEE) nas rotas sensíveis.

## Pesquisas (Pulso vs Clima)
- Pulso: escala 0–10 (primeira pergunta utilizada para eNPS/NPS no dashboard).
- Clima: escala Likert 1–5.
- Relatório detalhado: médias por pergunta, distribuição de respostas, NPS (pulso) e contagem de respondentes.
- Validação de obrigatoriedade: front impede envio sem preencher perguntas marcadas.

## Loading & UX
- `loading.service.ts` coordena estado global.
- `loading-indicator.component.ts` mostra indicador enquanto requisições ativas.
- Fallback transparente para base remota caso a principal esteja inacessível.

## Guards & Segurança
- `auth.guard.ts` / `admin.guard.ts` – restringem acesso.
- Outros guards contextuais (ex: bloqueio de páginas específicas) podem existir em `autenticacao/`.

## Convenções de Código
- Serviços retornam observables; componentes fazem unsubscribe apenas quando necessário (caso de streams contínuas).
- Interfaces de resposta de API podem ser refinadas futuramente (atualmente uso de `any` em alguns pontos para agilidade).

## Variáveis de Ambiente (Opcional)
Se quiser configurar base da API sem editar código: crie `.env` e ajuste mecanismo de `resolveApiBase()` conforme necessidade.

## Deploy (Vercel / SSR Híbrido)
- Para deploy SPA simples: usar `ng build` e publicar conteúdo de `dist/app-teste/browser`.
- Para SSR: publicar o diretório completo de build (incluindo `server.mjs`) e iniciar com Node (porta 4000 por padrão ou `PORT`).

## Roadmap Futuro (Sugestões)
- Internacionalização (i18n) / tradução.
- Tipagem forte para modelos de pesquisa e respostas.
- Modo offline/cache de resultados recentes.
- Dark mode.

## Troubleshooting
| Problema | Causa Provável | Ação |
|----------|----------------|------|
| 401 em chamadas após login | Token não salvo ou expirado | Verificar localStorage / relogar |
| Erro CORS | Backend sem configuração `cors()` | Habilitar CORS no NestJS |
| Gráficos vazios | Sem respostas suficientes | Validar criação e resposta de uma pesquisa pulso |
| SSR não renderiza | Build server não gerado | Rodar `ng run app-teste:server` |

## Licença / Uso
Projeto acadêmico (TCC 2025). Uso interno / educacional.

---
Desenvolvido para TCC — 2025.
