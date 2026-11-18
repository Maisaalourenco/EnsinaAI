# ENSINA AÍ — Mapeamento de Pontos de Integração Futura (Front-end -> Back-end)

Este documento consolida os pontos de integração preparados na camada de serviços do front-end para futura substituição dos dados demonstrativos (`localStorage`) por APIs reais de back-end.

> **Escopo atual:** Todos os módulos do CRM operam em HTML5, CSS3 e JavaScript Vanilla (ES6+), com dados demonstrativos isolados em arquivos `*-service.js` e `js/lead-gateway.js`. A camada de interface (`js/crm/*.js` sem sufixo `-service`) consome apenas métodos públicos desses serviços, sem acoplamento direto ao formato de persistência.

---

## 1. Captação Pública (Landing Page)
- **Arquivo:** `js/lead-gateway.js` (`window.EnsinaAiLeadGateway`) e `js/supabase-config.js` (`window.ENSINA_AI_CONFIG`)
- **Fluxo:** Submissão do formulário `#enrollment-form` em `index.html` (`js/form.js`).
- **Método principal:** `submitLead(payload)`
- **Payload enviado:** `nome_responsavel`, `nome_aluno`, `etapa_codigo`, `turno_codigo`, `telefone`, `email`, `mensagem_inicial`, `consentimento_contato`, `versao_aviso_privacidade`, `website` (honeypot).

---

## 2. Cadastro de Leads e Atualização de Leads
- **Serviço:** `js/crm/leads-service.js` (`window.EnsinaAiLeadsService`)
- **Chave local demonstrativa:** `ensina_ai_crm_leads_demo_v1`
- **Pontos de integração futura:**
  - `listLeads(filters)` -> `GET /leads` (suporta pesquisa, status, etapa, origem, atendente, período e paginação)
  - `getStats()` -> `GET /leads/stats` (totais por status)
  - `getLeadById(id)` -> `GET /leads/:id`
  - `createLead(input, actorName)` -> `POST /leads`
  - `updateLead(id, updates, actorName)` -> `PATCH /leads/:id`
  - `updateLeadStatus(id, nextStatus, actorName)` -> `PATCH /leads/:id/status`
  - `addInteraction(id, noteText, channel, actorName)` -> `POST /leads/:id/interacoes`
  - `deleteLead(id)` -> `DELETE /leads/:id`

---

## 3. Histórico de Atendimentos
- **Serviço:** `js/crm/atendimentos-service.js` (`window.EnsinaAiAtendimentosService`)
- **Chave local demonstrativa:** `ensina_ai_crm_atendimentos_demo_v1`
- **Pontos de integração futura:**
  - `listAtendimentos(filters)` -> `GET /atendimentos` (filtros por status, canal, atendente, data e lead relacionado)
  - `getStats()` -> `GET /atendimentos/stats`
  - `getAtendimentoById(id)` -> `GET /atendimentos/:id`
  - `createAtendimento(input, actorName)` -> `POST /atendimentos`
  - `updateAtendimento(id, updates, actorName)` -> `PATCH /atendimentos/:id`
  - `updateAtendimentoStatus(id, status, actorName)` -> `PATCH /atendimentos/:id/status`
  - `addRegistroHistorico(id, text, channel, actorName)` -> `POST /atendimentos/:id/historico`

---

## 4. Cadastro de Tarefas
- **Serviço:** `js/crm/tarefas-service.js` (`window.EnsinaAiTarefasService`)
- **Chave local demonstrativa:** `ensina_ai_crm_tarefas_demo_v1`
- **Pontos de integração futura:**
  - `listTarefas(filters)` -> `GET /tarefas` (filtros por prioridade, status, responsável e título)
  - `getStats()` -> `GET /tarefas/stats` (inclui cálculo de atrasadas)
  - `createTarefa(input, actorName)` -> `POST /tarefas`
  - `updateTarefa(id, updates, actorName)` -> `PATCH /tarefas/:id`
  - `updateTarefaStatus(id, status, actorName)` -> `PATCH /tarefas/:id/status`
  - `updateTarefaOwner(id, owner, actorName)` -> `PATCH /tarefas/:id/responsavel`
  - `deleteTarefa(id)` -> `DELETE /tarefas/:id`

---

## 5. Agendamento de Visitas
- **Serviço:** `js/crm/visitas-service.js` (`window.EnsinaAiVisitasService`)
- **Chave local demonstrativa:** `ensina_ai_crm_visitas_demo_v1`
- **Pontos de integração futura:**
  - `listVisitas(filters)` -> `GET /visitas` (suporta filtros por status, responsável interno e data)
  - `getStats()` -> `GET /visitas/stats`
  - `createVisita(input, actorName)` -> `POST /visitas`
  - `updateVisita(id, updates, actorName)` -> `PATCH /visitas/:id`
  - `updateVisitaStatus(id, status, actorName)` -> `PATCH /visitas/:id/status`
  - `deleteVisita(id)` -> `DELETE /visitas/:id`

---

## 6. Indicadores do Dashboard Gerencial
- **Módulo:** `js/crm/dashboard.js` (`window.EnsinaAiCrmDashboard`)
- **Fonte atual:** Consolida em tempo real os serviços `EnsinaAiLeadsService`, `EnsinaAiAtendimentosService`, `EnsinaAiTarefasService`, `EnsinaAiVisitasService` e `EnsinaAiEquipeService`.
- **Ponto de integração futura:**
  - `buildDashboardSnapshot(monthsCount, selectedOwner)` -> substituir pela chamada agregada `GET /dashboard/summary?months=6&owner=...` retornando:
    - KPIs principais (total de leads, novos, em atendimento, matrículas, taxa de conversão, atendimentos realizados, visitas agendadas, tarefas pendentes);
    - Séries temporais (evolução de leads/atendimentos e matrículas por período);
    - Distribuições por origem, status e funil de 5 etapas;
    - Produtividade por atendente e listas de atividades recentes.

---

## 7. Relatórios e Exportação
- **Serviço:** `js/crm/relatorios-service.js` (`window.EnsinaAiRelatoriosService`)
- **Ponto de integração futura:**
  - `buildReportsSnapshot({ period, startDate, endDate })` -> `GET /relatorios?period=...&startDate=...&endDate=...`
  - `buildCsvContent(reportKey, filters)` / `downloadCsv(...)` -> pode continuar no cliente a partir dos dados recebidos ou apontar para endpoint de exportação `GET /relatorios/export.csv`.

---

## 8. Equipe, Base de Conhecimento e Configurações
- **Equipe (`js/crm/equipe-service.js` / `window.EnsinaAiEquipeService` — chave `ensina_ai_crm_equipe_demo_v1`):**
  - `listMembers(filters)` -> `GET /equipe`
  - `createMember(input)` -> `POST /equipe`
  - `updateMember(id, updates)` -> `PATCH /equipe/:id`
  - `updateMemberStatus(id, status)` -> `PATCH /equipe/:id/status`
  - *Nota:* Campos `cargo` são apenas visuais/demonstrativos no front-end; regras reais de RBAC e autenticação devem ser aplicadas no back-end.
- **Base de Conhecimento (`js/crm/conhecimento-service.js` / `window.EnsinaAiConhecimentoService` — chave `ensina_ai_crm_conhecimento_demo_v1`):**
  - `listArticles(filters)`, `createArticle`, `updateArticle`, `deleteArticle`.
- **Configurações (`js/crm/configuracoes-service.js` / `window.EnsinaAiConfiguracoesService` — chave `ensina_ai_crm_config_demo_v1`):**
  - `getSettings()`, `saveSettings(nextInput)`, `resetDefaultSettings()`.

---

## 9. Perfis de Acesso (Atendente vs Gestor Escolar) e RBAC Futuro
- **Estado atual (somente front-end):**
  - Os perfis `gestor` (`Coordenação Demo`) e `atendente` (`Secretaria Demo`) são simulados via `sessionStorage` (`ensina_ai_crm_demo_session`) para demonstrar fluxos operacionais e gerenciais dentro de um único CRM.
  - A navegação (`js/crm/navigation.js`), o roteamento (`js/crm/app.js`) e os módulos filtram indicadores, menus e ações na interface com base no perfil ativo (`session.role` e `session.name`).
  - O módulo `#equipe` exibe uma tela informativa de acesso gerencial quando acessado diretamente no perfil `atendente`, e a Base de Conhecimento opera em modo somente leitura para o Atendente.
- **Responsabilidades obrigatórias do Back-end na etapa definitiva:**
  - Implementar autenticação real (`POST /auth/login`, `POST /auth/logout`, `GET /auth/me`) retornando o usuário autenticado e seu papel real (`role`: `'atendente' | 'gestor'`).
  - Aplicar controle de acesso (RBAC) e escopo por carteira no servidor:
    - Endpoints de leitura e escrita para Atendente devem validar no back-end que `lead.atendente_id`, `atendimento.responsavel_id`, `tarefa.responsavel_id` e `visita.responsavel_id` pertencem ao usuário autenticado (ou à sua unidade autorizada).
    - Endpoints de gestão de equipe (`/equipe`), distribuição/reatribuição de leads (`/leads/:id/atribuir`), edição de artigos da Base de Conhecimento (`/conhecimento`) e configurações institucionais da escola (`/configuracoes/escola`) devem exigir permissão de `gestor` no servidor (retornando `403 Forbidden` para outros perfis).

