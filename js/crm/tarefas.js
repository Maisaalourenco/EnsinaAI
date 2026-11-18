/**
 * ENSINA AÍ — CRM Escolar
 * Módulo de Interface de Gestão de Tarefas (js/crm/tarefas.js)
 * JavaScript Vanilla ES6+ — Visualização em Lista e Quadro Kanban
 */

(function initCrmTarefasView(globalScope) {
  'use strict';

  const DEFAULT_FILTERS = Object.freeze({
    search: '',
    leadId: '',
    atendimentoId: '',
    priority: 'todos',
    status: 'todos',
    attendant: 'todos',
    page: 1,
    pageSize: 6
  });

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateBr(dateStr) {
    if (!dateStr) return '—';
    const parts = String(dateStr).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  function formatDateTimeBr(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  function getTodayDateInput() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function buildSelectOptions(items, selectedVal, includeAllLabel) {
    const allOpt = includeAllLabel
      ? `<option value="todos"${selectedVal === 'todos' ? ' selected' : ''}>${escapeHtml(includeAllLabel)}</option>`
      : '';
    const opts = items
      .map(
        (item) =>
          `<option value="${escapeHtml(item.codigo)}"${
            selectedVal === item.codigo ? ' selected' : ''
          }>${escapeHtml(item.label)}</option>`
      )
      .join('');
    return allOpt + opts;
  }

  function buildAttendantOptions(attendants, selectedVal, includeAllLabel) {
    const allOpt = includeAllLabel
      ? `<option value="todos"${selectedVal === 'todos' ? ' selected' : ''}>${escapeHtml(includeAllLabel)}</option>`
      : '';
    const opts = attendants
      .map(
        (name) =>
          `<option value="${escapeHtml(name)}"${
            selectedVal === name ? ' selected' : ''
          }>${escapeHtml(name)}</option>`
      )
      .join('');
    return allOpt + opts;
  }

  function renderTarefasModule(container, options = {}) {
    const service = globalScope.EnsinaAiTarefasService;
    const leadsService = globalScope.EnsinaAiLeadsService || null;
    const atendService = globalScope.EnsinaAiAtendimentosService || null;
    const visitasService = globalScope.EnsinaAiVisitasService || null;
    const components = globalScope.EnsinaAiCrmComponents || null;
    if (!container || !service) return;

    const session = options.session || {
      role: 'gestor',
      roleLabel: 'Gestor Escolar',
      name: 'Coordenação Demo'
    };
    const isAtendente = session.role === 'atendente';
    const scopedOwner = isAtendente ? (session.name || 'Secretaria Demo') : 'todos';
    const actorName = session.name || 'Secretaria Demo';
    const notify = typeof options.onToast === 'function' ? options.onToast : () => {};
    const onNavigateModule =
      typeof options.onNavigateModule === 'function' ? options.onNavigateModule : null;

    const state = {
      viewMode: options.initialViewMode === 'kanban' ? 'kanban' : 'list',
      filters: {
        ...DEFAULT_FILTERS,
        attendant: scopedOwner,
        search: String(options.initialSearch || '').trim(),
        leadId: String(options.initialLeadId || '').trim(),
        atendimentoId: String(options.initialAtendimentoId || '').trim()
      },
      editingId: null,
      detailId: null,
      deletingId: null,
      draggedId: null
    };

    const statusFilterItems = [
      ...service.CATALOGS.statuses,
      { codigo: 'atrasadas', label: 'Atrasadas' }
    ];

    container.innerHTML = `
      <div class="crm-tarefas-module" id="crm-tarefas-module">
        <!-- Cabeçalho da Página de Tarefas -->
        <section class="crm-leads-header-bar">
          <div>
            <div class="crm-leads-title-row">
              <h2>${isAtendente ? 'Minhas Tarefas' : 'Gestão de Tarefas'}</h2>
              <span class="crm-demo-pill">Dados demonstrativos locais</span>
            </div>
            <p class="crm-leads-subtitle">
              ${
                isAtendente
                  ? 'Acompanhe seus follow-ups, prazos atrasados e atividades diárias em lista ou quadro Kanban.'
                  : 'Supervisione a carga de trabalho da equipe, redistribua tarefas entre responsáveis e acompanhe pendências em atraso.'
              }
            </p>
          </div>
          <div class="crm-leads-header-actions">
            <div class="crm-view-switcher" role="group" aria-label="Modo de visualização de tarefas">
              <button type="button" class="crm-view-switch-btn is-active" id="btn-tarefas-view-list" aria-pressed="true">
                Lista
              </button>
              <button type="button" class="crm-view-switch-btn" id="btn-tarefas-view-kanban" aria-pressed="false">
                Kanban
              </button>
            </div>
            <button type="button" class="btn btn-primary" id="btn-new-tarefa">
              + Nova tarefa
            </button>
          </div>
        </section>

        ${
          isAtendente
            ? `<section class="crm-role-scope-banner" id="tarefas-role-scope-banner" aria-label="Escopo das tarefas">
                <strong>Minhas pendências:</strong>
                <span>Exibindo apenas tarefas atribuídas a ${escapeHtml(scopedOwner)}. A redistribuição entre colegas é realizada pelo Gestor Escolar.</span>
              </section>`
            : `<section class="crm-workload-strip" id="tarefas-workload-strip" aria-label="Carga de tarefas por responsável"></section>`
        }

        <!-- Indicadores (5 KPIs) -->
        <section class="crm-leads-kpi-row" id="tarefas-kpi-row" aria-label="Indicadores de tarefas">
          <!-- Renderizado dinamicamente -->
        </section>

        <!-- Pesquisa e Filtros -->
        <section class="crm-filters-card" aria-label="Pesquisa e filtros de tarefas">
          <div class="crm-filters-grid crm-tarefas-filters-grid">
            <div class="crm-filter-field crm-filter-search">
              <label for="tarefas-search-input">Pesquisar por título, responsável ou protocolo</label>
              <input
                type="search"
                id="tarefas-search-input"
                class="form-control crm-input-compact"
                placeholder="Ex.: Retorno, proposta, LD-1001..."
                value="${escapeHtml(state.filters.search)}"
              />
            </div>

            <div class="crm-filter-field">
              <label for="tarefas-filter-priority">Prioridade</label>
              <select id="tarefas-filter-priority" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.priorities, state.filters.priority, 'Todas as prioridades')}
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="tarefas-filter-status">Status</label>
              <select id="tarefas-filter-status" class="form-control crm-input-compact">
                ${buildSelectOptions(statusFilterItems, state.filters.status, 'Todos os status')}
              </select>
            </div>

            <div class="crm-filter-field" id="tarefas-filter-attendant-wrap"${isAtendente ? ' hidden' : ''}>
              <label for="tarefas-filter-attendant">Responsável</label>
              <select id="tarefas-filter-attendant" class="form-control crm-input-compact">
                ${buildAttendantOptions(service.CATALOGS.attendants, state.filters.attendant, 'Todos os responsáveis')}
              </select>
            </div>
          </div>

          <div class="crm-filters-footer">
            <div class="crm-filters-status-group">
              <span class="crm-results-counter" id="tarefas-results-counter"></span>
              <div class="crm-active-lead-chip" id="tarefas-context-filter-banner" hidden>
                <span id="tarefas-context-filter-label"></span>
                <button type="button" class="crm-chip-clear-btn" id="btn-clear-tarefas-context" aria-label="Limpar vínculo">
                  &times; Ver todas
                </button>
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-sm" id="btn-clear-tarefas-filters">
              Limpar filtros
            </button>
          </div>
        </section>

        <!-- Conteúdo Principal: Lista ou Kanban -->
        <section class="crm-panel crm-leads-table-panel" id="tarefas-content-panel" aria-label="Listagem e quadro de tarefas">
          <div class="crm-table-scroll" id="tarefas-table-scroll">
            <table class="crm-table crm-tarefas-table">
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Vínculo (Lead / Atendimento)</th>
                  <th>Responsável</th>
                  <th>Vencimento</th>
                  <th>Prioridade</th>
                  <th>Status</th>
                  <th class="crm-th-actions">Ações</th>
                </tr>
              </thead>
              <tbody id="tarefas-table-tbody"></tbody>
            </table>
          </div>

          <div class="crm-kanban-board" id="tarefas-kanban-board" hidden aria-label="Quadro Kanban de tarefas">
            <!-- Colunas renderizadas dinamicamente -->
          </div>

          <div class="crm-empty-state" id="tarefas-empty-state" hidden>
            <strong id="tarefas-empty-title">Nenhuma tarefa encontrada</strong>
            <p id="tarefas-empty-desc">
              Nenhuma tarefa corresponde aos filtros aplicados.
            </p>
            <div class="crm-empty-actions">
              <button type="button" class="btn btn-outline btn-sm" id="btn-tarefas-empty-clear">
                Limpar filtros
              </button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-tarefas-empty-new">
                + Nova tarefa
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="btn-tarefas-empty-restore" hidden>
                Restaurar dados demonstrativos
              </button>
            </div>
          </div>

          <div class="crm-pagination" id="tarefas-pagination" aria-label="Paginação de tarefas"></div>
        </section>

        <!-- MODAL: NOVA / EDITAR TAREFA -->
        <div
          class="crm-modal-backdrop"
          id="tarefa-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tarefa-form-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="tarefa-form-modal-title">Nova tarefa</h3>
                <p id="tarefa-form-modal-subtitle">Defina título, prazo, prioridade e vínculos com Lead ou Atendimento.</p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-tarefa-form" aria-label="Fechar janela">&times;</button>
            </div>

            <form id="tarefa-crud-form" novalidate>
              <div class="crm-modal-body">
                <div class="form-group">
                  <label for="tarefa-field-title" class="form-label">
                    <span>Título <span class="required-star" aria-hidden="true">*</span></span>
                  </label>
                  <input
                    type="text"
                    id="tarefa-field-title"
                    class="form-control crm-input-compact"
                    maxlength="140"
                    placeholder="Ex.: Retorno telefônico para confirmar visita"
                    required
                    aria-describedby="error-tarefa-title"
                  />
                  <span class="form-error-msg" id="error-tarefa-title" role="alert"></span>
                </div>

                <div class="form-group crm-form-group-spaced">
                  <label for="tarefa-field-description" class="form-label">
                    <span>Descrição</span>
                  </label>
                  <textarea
                    id="tarefa-field-description"
                    class="form-control form-textarea"
                    rows="3"
                    maxlength="500"
                    placeholder="Detalhes da ação a ser executada pela equipe..."
                    aria-describedby="error-tarefa-description"
                  ></textarea>
                  <span class="form-error-msg" id="error-tarefa-description" role="alert"></span>
                </div>

                <div class="crm-form-grid-2 crm-form-grid-spaced">
                  <div class="form-group">
                    <label for="tarefa-field-lead" class="form-label">
                      <span>Lead relacionado</span>
                    </label>
                    <select id="tarefa-field-lead" class="form-control crm-input-compact" aria-describedby="error-tarefa-lead"></select>
                    <span class="form-error-msg" id="error-tarefa-lead" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="tarefa-field-atendimento" class="form-label">
                      <span>Atendimento relacionado</span>
                    </label>
                    <select id="tarefa-field-atendimento" class="form-control crm-input-compact" aria-describedby="error-tarefa-atendimento"></select>
                    <span class="form-error-msg" id="error-tarefa-atendimento" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="tarefa-field-attendant" class="form-label">
                      <span>Responsável <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="tarefa-field-attendant" class="form-control crm-input-compact" required aria-describedby="error-tarefa-attendant">
                      ${buildAttendantOptions(service.CATALOGS.attendants, actorName, '')}
                    </select>
                    <span class="form-error-msg" id="error-tarefa-attendant" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="tarefa-field-priority" class="form-label">
                      <span>Prioridade <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="tarefa-field-priority" class="form-control crm-input-compact" required aria-describedby="error-tarefa-priority">
                      ${buildSelectOptions(service.CATALOGS.priorities, 'media', '')}
                    </select>
                    <span class="form-error-msg" id="error-tarefa-priority" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="tarefa-field-due-date" class="form-label">
                      <span>Data de vencimento <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="date"
                      id="tarefa-field-due-date"
                      class="form-control crm-input-compact"
                      required
                      aria-describedby="error-tarefa-due-date"
                    />
                    <span class="form-error-msg" id="error-tarefa-due-date" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="tarefa-field-due-time" class="form-label">
                      <span>Horário <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="time"
                      id="tarefa-field-due-time"
                      class="form-control crm-input-compact"
                      required
                      aria-describedby="error-tarefa-due-time"
                    />
                    <span class="form-error-msg" id="error-tarefa-due-time" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="tarefa-field-status" class="form-label">
                      <span>Status <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="tarefa-field-status" class="form-control crm-input-compact" required aria-describedby="error-tarefa-status">
                      ${buildSelectOptions(service.CATALOGS.statuses, 'pendente', '')}
                    </select>
                    <span class="form-error-msg" id="error-tarefa-status" role="alert"></span>
                  </div>
                </div>
              </div>

              <div class="crm-modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-tarefa-form">Cancelar</button>
                <button type="submit" class="btn btn-primary" id="btn-save-tarefa">Salvar tarefa</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL: DETALHES DA TAREFA -->
        <div
          class="crm-modal-backdrop"
          id="tarefa-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tarefa-detail-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="tarefa-detail-modal-title">Detalhes da Tarefa</h3>
                <p id="tarefa-detail-modal-subtitle"></p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-tarefa-detail" aria-label="Fechar detalhes">&times;</button>
            </div>

            <div class="crm-modal-body" id="tarefa-detail-body">
              <!-- Renderizado dinamicamente -->
            </div>

            <div class="crm-modal-footer crm-modal-footer-split">
              <div class="crm-modal-footer-actions">
                <button type="button" class="btn btn-outline btn-sm" id="btn-detail-tarefa-delete">Excluir</button>
                <button type="button" class="btn btn-primary btn-sm" id="btn-detail-tarefa-complete">Concluir tarefa</button>
              </div>
              <div class="crm-modal-footer-actions">
                <button type="button" class="btn btn-outline" id="btn-detail-tarefa-edit">Editar</button>
                <button type="button" class="btn btn-secondary" id="btn-detail-tarefa-close">Fechar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL: CONFIRMAÇÃO DE EXCLUSÃO -->
        <div
          class="crm-modal-backdrop"
          id="tarefa-delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tarefa-delete-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-sm">
            <div class="crm-modal-header">
              <div>
                <h3 id="tarefa-delete-modal-title">Excluir tarefa</h3>
                <p>Confirmação de remoção no armazenamento local.</p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-delete-tarefa" aria-label="Fechar confirmação">&times;</button>
            </div>
            <div class="crm-modal-body">
              <p id="delete-tarefa-summary" class="crm-detail-notes-text"></p>
            </div>
            <div class="crm-modal-footer">
              <button type="button" class="btn btn-outline" id="btn-cancel-delete-tarefa">Cancelar</button>
              <button type="button" class="btn btn-primary crm-btn-danger" id="btn-confirm-delete-tarefa">Excluir tarefa</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Referências
    const kpiRowEl = container.querySelector('#tarefas-kpi-row');
    const workloadStripEl = container.querySelector('#tarefas-workload-strip');
    const viewListBtn = container.querySelector('#btn-tarefas-view-list');
    const viewKanbanBtn = container.querySelector('#btn-tarefas-view-kanban');

    const searchInput = container.querySelector('#tarefas-search-input');
    const prioritySelect = container.querySelector('#tarefas-filter-priority');
    const statusSelect = container.querySelector('#tarefas-filter-status');
    const attendantFilterSelect = container.querySelector('#tarefas-filter-attendant');
    const clearFiltersBtn = container.querySelector('#btn-clear-tarefas-filters');
    const resultsCounterEl = container.querySelector('#tarefas-results-counter');
    const contextBanner = container.querySelector('#tarefas-context-filter-banner');
    const contextLabel = container.querySelector('#tarefas-context-filter-label');
    const clearContextBtn = container.querySelector('#btn-clear-tarefas-context');

    const tableScrollEl = container.querySelector('#tarefas-table-scroll');
    const tbodyEl = container.querySelector('#tarefas-table-tbody');
    const kanbanBoardEl = container.querySelector('#tarefas-kanban-board');
    const emptyStateEl = container.querySelector('#tarefas-empty-state');
    const emptyTitleEl = container.querySelector('#tarefas-empty-title');
    const emptyDescEl = container.querySelector('#tarefas-empty-desc');
    const emptyClearBtn = container.querySelector('#btn-tarefas-empty-clear');
    const emptyNewBtn = container.querySelector('#btn-tarefas-empty-new');
    const emptyRestoreBtn = container.querySelector('#btn-tarefas-empty-restore');
    const paginationEl = container.querySelector('#tarefas-pagination');

    // Modais
    const formModal = container.querySelector('#tarefa-form-modal');
    const formTitle = container.querySelector('#tarefa-form-modal-title');
    const formSubtitle = container.querySelector('#tarefa-form-modal-subtitle');
    const crudForm = container.querySelector('#tarefa-crud-form');
    const saveBtn = container.querySelector('#btn-save-tarefa');

    const detailModal = container.querySelector('#tarefa-detail-modal');
    const detailTitle = container.querySelector('#tarefa-detail-modal-title');
    const detailSubtitle = container.querySelector('#tarefa-detail-modal-subtitle');
    const detailBody = container.querySelector('#tarefa-detail-body');
    const detailCompleteBtn = container.querySelector('#btn-detail-tarefa-complete');

    const deleteModal = container.querySelector('#tarefa-delete-modal');
    const deleteSummaryEl = container.querySelector('#delete-tarefa-summary');
    const confirmDeleteBtn = container.querySelector('#btn-confirm-delete-tarefa');
    const cancelDeleteBtn = container.querySelector('#btn-cancel-delete-tarefa');

    const formFields = {
      title: {
        input: container.querySelector('#tarefa-field-title'),
        error: container.querySelector('#error-tarefa-title'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return 'Informe o título da tarefa.';
          if (t.length < 3) return 'O título deve ter pelo menos 3 caracteres.';
          return '';
        }
      },
      description: {
        input: container.querySelector('#tarefa-field-description'),
        error: container.querySelector('#error-tarefa-description'),
        validate: (v) => (String(v || '').trim().length > 500 ? 'Máximo de 500 caracteres.' : '')
      },
      lead: {
        input: container.querySelector('#tarefa-field-lead'),
        error: container.querySelector('#error-tarefa-lead'),
        validate: () => ''
      },
      atendimento: {
        input: container.querySelector('#tarefa-field-atendimento'),
        error: container.querySelector('#error-tarefa-atendimento'),
        validate: () => ''
      },
      attendant: {
        input: container.querySelector('#tarefa-field-attendant'),
        error: container.querySelector('#error-tarefa-attendant'),
        validate: (v) => (!v ? 'Selecione o responsável pela tarefa.' : '')
      },
      priority: {
        input: container.querySelector('#tarefa-field-priority'),
        error: container.querySelector('#error-tarefa-priority'),
        validate: (v) => (!v ? 'Selecione a prioridade.' : '')
      },
      dueDate: {
        input: container.querySelector('#tarefa-field-due-date'),
        error: container.querySelector('#error-tarefa-due-date'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return 'Informe a data de vencimento.';
          if (Number.isNaN(new Date(`${t}T10:00`).getTime())) return 'Data inválida.';
          return '';
        }
      },
      dueTime: {
        input: container.querySelector('#tarefa-field-due-time'),
        error: container.querySelector('#error-tarefa-due-time'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return 'Informe o horário.';
          if (!/^\d{2}:\d{2}$/.test(t)) return 'Horário inválido.';
          return '';
        }
      },
      status: {
        input: container.querySelector('#tarefa-field-status'),
        error: container.querySelector('#error-tarefa-status'),
        validate: (v) => (!v ? 'Selecione o status.' : '')
      }
    };

    function populateLeadAndAtendimentoSelects(selectedLeadId = '', selectedAtendId = '') {
      const leadOpts = service.getLeadOptions();
      formFields.lead.input.innerHTML = [
        '<option value="">Sem vínculo com lead</option>',
        ...leadOpts.map(
          (l) =>
            `<option value="${escapeHtml(l.id)}"${
              l.id === selectedLeadId ? ' selected' : ''
            }>${escapeHtml(l.label)}</option>`
        )
      ].join('');
      formFields.lead.input.value = selectedLeadId || '';

      const atendOpts = service.getAtendimentoOptions(selectedLeadId);
      const fallbackAllAtends = atendOpts.length ? atendOpts : service.getAtendimentoOptions('');
      formFields.atendimento.input.innerHTML = [
        '<option value="">Sem vínculo com atendimento</option>',
        ...fallbackAllAtends.map(
          (a) =>
            `<option value="${escapeHtml(a.id)}" data-lead-id="${escapeHtml(a.lead_id)}"${
              a.id === selectedAtendId ? ' selected' : ''
            }>${escapeHtml(a.label)}</option>`
        )
      ].join('');
      formFields.atendimento.input.value = selectedAtendId || '';
    }

    function validateField(fieldObj) {
      if (!fieldObj || !fieldObj.input) return true;
      const msg = fieldObj.validate(fieldObj.input.value);
      if (msg) {
        fieldObj.input.classList.add('is-invalid');
        fieldObj.input.classList.remove('is-valid');
        fieldObj.input.setAttribute('aria-invalid', 'true');
        if (fieldObj.error) {
          fieldObj.error.textContent = msg;
          fieldObj.error.classList.add('show');
        }
        return false;
      }
      fieldObj.input.classList.remove('is-invalid');
      if (String(fieldObj.input.value || '').trim()) {
        fieldObj.input.classList.add('is-valid');
      } else {
        fieldObj.input.classList.remove('is-valid');
      }
      fieldObj.input.removeAttribute('aria-invalid');
      if (fieldObj.error) {
        fieldObj.error.textContent = '';
        fieldObj.error.classList.remove('show');
      }
      return true;
    }

    function clearFormErrors() {
      Object.keys(formFields).forEach((key) => {
        const f = formFields[key];
        if (!f.input) return;
        f.input.classList.remove('is-invalid', 'is-valid');
        f.input.removeAttribute('aria-invalid');
        if (f.error) {
          f.error.textContent = '';
          f.error.classList.remove('show');
        }
      });
    }

    function renderWorkloadStrip() {
      if (!workloadStripEl || isAtendente) return;
      const allOpen = service.listTarefas({ page: 1, pageSize: 500 }).items || [];
      const cards = service.CATALOGS.attendants.map((name) => {
        const subset = allOpen.filter((t) => t.responsavel_tarefa === name);
        const openCount = subset.filter((t) => t.status === 'pendente' || t.status === 'em_andamento').length;
        const overdueCount = subset.filter((t) => service.isTaskOverdue(t)).length;
        const isActive = state.filters.attendant === name;
        return `
          <button type="button" class="crm-workload-chip${isActive ? ' is-active' : ''}" data-workload-owner="${escapeHtml(name)}">
            <strong>${escapeHtml(name)}</strong>
            <span>${openCount} em aberto${overdueCount > 0 ? ` • <em class="crm-overdue-date-text">${overdueCount} atrasada(s)</em>` : ''}</span>
          </button>
        `;
      });
      workloadStripEl.innerHTML = `
        <div class="crm-workload-head">
          <strong>Carga de tarefas por responsável</strong>
          <span>Clique para filtrar rapidamente ou redistribua na lista/Kanban.</span>
        </div>
        <div class="crm-workload-chips">
          <button type="button" class="crm-workload-chip${state.filters.attendant === 'todos' ? ' is-active' : ''}" data-workload-owner="todos">
            <strong>Toda a equipe</strong>
            <span>${allOpen.filter((t) => t.status === 'pendente' || t.status === 'em_andamento').length} em aberto</span>
          </button>
          ${cards.join('')}
        </div>
      `;
    }

    function renderKpis() {
      const stats = service.getStats(isAtendente ? { attendant: scopedOwner } : {});
      renderWorkloadStrip();
      if (components && typeof components.renderKpiCard === 'function') {
        kpiRowEl.innerHTML = [
          components.renderKpiCard({
            label: isAtendente ? 'Minhas tarefas' : 'Total de tarefas',
            value: String(stats.total),
            valueId: 'tarefas-stat-total',
            foot: isAtendente ? `Atribuídas a ${scopedOwner}` : 'Base local demonstrativa',
            accent: 'navy'
          }),
          components.renderKpiCard({
            label: 'Pendentes',
            value: String(stats.pendentes),
            valueId: 'tarefas-stat-pending',
            foot: 'Aguardando início',
            accent: 'amber'
          }),
          components.renderKpiCard({
            label: 'Em andamento',
            value: String(stats.emAndamento),
            valueId: 'tarefas-stat-active',
            foot: 'Em execução pela equipe',
            accent: 'blue'
          }),
          components.renderKpiCard({
            label: 'Concluídas',
            value: String(stats.concluidas),
            valueId: 'tarefas-stat-done',
            foot: 'Finalizadas (demo)',
            footTone: 'is-positive',
            accent: 'green'
          }),
          components.renderKpiCard({
            label: 'Atrasadas',
            value: String(stats.atrasadas),
            valueId: 'tarefas-stat-overdue',
            foot: 'Prazo vencido em aberto',
            footTone: stats.atrasadas > 0 ? 'is-warning' : '',
            accent: 'red'
          })
        ].join('');
      }
    }

    function renderContextFilterBanner() {
      if (!contextBanner || !contextLabel) return;
      const parts = [];
      if (state.filters.leadId) parts.push(`Lead ${state.filters.leadId}`);
      if (state.filters.atendimentoId) parts.push(`Atendimento ${state.filters.atendimentoId}`);
      if (!parts.length) {
        contextBanner.hidden = true;
        return;
      }
      contextLabel.textContent = `Vínculo: ${parts.join(' • ')}`;
      contextBanner.hidden = false;
    }

    function syncViewModeButtons() {
      const isKanban = state.viewMode === 'kanban';
      viewListBtn.classList.toggle('is-active', !isKanban);
      viewListBtn.setAttribute('aria-pressed', !isKanban ? 'true' : 'false');
      viewKanbanBtn.classList.toggle('is-active', isKanban);
      viewKanbanBtn.setAttribute('aria-pressed', isKanban ? 'true' : 'false');
    }

    function renderPagination(page, totalPages) {
      if (state.viewMode === 'kanban') {
        paginationEl.innerHTML = '';
        return;
      }
      if (components && typeof components.renderPagination === 'function') {
        paginationEl.innerHTML = components.renderPagination({ page, totalPages });
      }
    }

    function renderListView(items) {
      tableScrollEl.hidden = false;
      kanbanBoardEl.hidden = true;

      tbodyEl.innerHTML = items
        .map((task) => {
          const overdue = service.isTaskOverdue(task);
          const overdueBadge = overdue
            ? '<span class="crm-overdue-tag">Atrasada</span>'
            : '';
          const linkSummary = [
            task.lead_id ? `Lead ${task.lead_id}` : '',
            task.atendimento_id ? `Atend. ${task.atendimento_id}` : ''
          ]
            .filter(Boolean)
            .join(' • ');

          return `
            <tr data-tarefa-id="${escapeHtml(task.id)}" class="${overdue ? 'is-overdue-row' : ''}">
              <td>
                <div class="crm-lead-primary-cell">
                  <strong>${escapeHtml(task.titulo)} ${overdueBadge}</strong>
                  <small>${escapeHtml(task.id)}${task.nome_responsavel ? ` • ${escapeHtml(task.nome_responsavel)}` : ''}</small>
                </div>
              </td>
              <td>
                ${
                  linkSummary
                    ? `<span class="crm-lead-ref-code">${escapeHtml(linkSummary)}</span>`
                    : '<span class="crm-muted-dash">Interna</span>'
                }
              </td>
              <td>
                ${
                  isAtendente
                    ? `<span class="crm-owner-pill">${escapeHtml(task.responsavel_tarefa)}</span>`
                    : `<select
                        class="form-control crm-input-compact crm-inline-table-select"
                        data-action="inline-owner"
                        data-id="${escapeHtml(task.id)}"
                        aria-label="Alterar responsável de ${escapeHtml(task.titulo)}"
                      >
                        ${buildAttendantOptions(service.CATALOGS.attendants, task.responsavel_tarefa, '')}
                      </select>`
                }
              </td>
              <td class="crm-nowrap">
                <div class="crm-lead-primary-cell">
                  <span class="${overdue ? 'crm-overdue-date-text' : ''}">${escapeHtml(formatDateBr(task.data_vencimento))}</span>
                  <small>${escapeHtml(task.horario || '—')}</small>
                </div>
              </td>
              <td>
                <span class="crm-priority-badge priority-${escapeHtml(task.prioridade)}">
                  ${escapeHtml(service.getPriorityLabel(task.prioridade))}
                </span>
              </td>
              <td>
                <select
                  class="crm-status-badge crm-status-select crm-tarefa-status-${escapeHtml(task.status)}"
                  data-action="inline-status"
                  data-id="${escapeHtml(task.id)}"
                  aria-label="Alterar status de ${escapeHtml(task.titulo)}"
                >
                  ${buildSelectOptions(service.CATALOGS.statuses, task.status, '')}
                </select>
              </td>
              <td class="crm-td-actions">
                <div class="crm-table-actions">
                  ${
                    task.status !== 'concluida'
                      ? `<button type="button" class="crm-table-btn crm-table-btn-success" data-action="complete" data-id="${escapeHtml(task.id)}">Concluir</button>`
                      : ''
                  }
                  <button type="button" class="crm-table-btn" data-action="detail" data-id="${escapeHtml(task.id)}">
                    Visualizar
                  </button>
                  <button type="button" class="crm-table-btn" data-action="edit" data-id="${escapeHtml(task.id)}">
                    Editar
                  </button>
                  <button type="button" class="crm-table-btn crm-table-btn-danger" data-action="delete" data-id="${escapeHtml(task.id)}">
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    }

    function renderKanbanView(items) {
      tableScrollEl.hidden = true;
      kanbanBoardEl.hidden = false;

      kanbanBoardEl.innerHTML = service.CATALOGS.statuses
        .map((colStatus) => {
          const colTasks = items.filter((t) => t.status === colStatus.codigo);
          const cardsHtml = colTasks.length
            ? colTasks
                .map((task) => {
                  const overdue = service.isTaskOverdue(task);
                  const linkText = [
                    task.lead_id ? task.lead_id : '',
                    task.atendimento_id ? task.atendimento_id : ''
                  ]
                    .filter(Boolean)
                    .join(' • ');

                  return `
                    <article
                      class="crm-kanban-card${overdue ? ' is-overdue-card' : ''}"
                      draggable="true"
                      data-tarefa-id="${escapeHtml(task.id)}"
                    >
                      <div class="crm-kanban-card-top">
                        <span class="crm-priority-badge priority-${escapeHtml(task.prioridade)}">
                          ${escapeHtml(service.getPriorityLabel(task.prioridade))}
                        </span>
                        ${overdue ? '<span class="crm-overdue-tag">Atrasada</span>' : `<small class="crm-kanban-id">${escapeHtml(task.id)}</small>`}
                      </div>

                      <h4 class="crm-kanban-card-title">${escapeHtml(task.titulo)}</h4>
                      ${
                        task.nome_responsavel || linkText
                          ? `<p class="crm-kanban-card-meta">${escapeHtml(task.nome_responsavel || 'Interna')}${linkText ? ` • ${escapeHtml(linkText)}` : ''}</p>`
                          : ''
                      }

                      <div class="crm-kanban-card-due ${overdue ? 'crm-overdue-date-text' : ''}">
                        Vence: ${escapeHtml(formatDateBr(task.data_vencimento))} às ${escapeHtml(task.horario || '—')}
                      </div>

                      <div class="crm-kanban-card-controls">
                        ${
                          isAtendente
                            ? `<span class="crm-owner-pill">${escapeHtml(task.responsavel_tarefa)}</span>`
                            : `<select
                                class="form-control crm-input-compact"
                                data-action="inline-owner"
                                data-id="${escapeHtml(task.id)}"
                                aria-label="Responsável de ${escapeHtml(task.titulo)}"
                              >
                                ${buildAttendantOptions(service.CATALOGS.attendants, task.responsavel_tarefa, '')}
                              </select>`
                        }
                        <select
                          class="crm-status-badge crm-status-select crm-tarefa-status-${escapeHtml(task.status)}"
                          data-action="inline-status"
                          data-id="${escapeHtml(task.id)}"
                          aria-label="Status de ${escapeHtml(task.titulo)}"
                        >
                          ${buildSelectOptions(service.CATALOGS.statuses, task.status, '')}
                        </select>
                      </div>

                      <div class="crm-kanban-card-actions">
                        ${
                          task.status !== 'concluida'
                            ? `<button type="button" class="crm-table-btn crm-table-btn-success" data-action="complete" data-id="${escapeHtml(task.id)}">Concluir</button>`
                            : ''
                        }
                        <button type="button" class="crm-table-btn" data-action="detail" data-id="${escapeHtml(task.id)}">
                          Detalhes
                        </button>
                        <button type="button" class="crm-table-btn" data-action="edit" data-id="${escapeHtml(task.id)}">
                          Editar
                        </button>
                        <button type="button" class="crm-table-btn crm-table-btn-danger" data-action="delete" data-id="${escapeHtml(task.id)}">
                          Excluir
                        </button>
                      </div>
                    </article>
                  `;
                })
                .join('')
            : '<div class="crm-kanban-empty">Nenhuma tarefa nesta etapa</div>';

          return `
            <div class="crm-kanban-column" data-kanban-status="${escapeHtml(colStatus.codigo)}">
              <div class="crm-kanban-column-head">
                <span class="crm-status-badge crm-tarefa-status-${escapeHtml(colStatus.codigo)}">
                  ${escapeHtml(colStatus.label)}
                </span>
                <span class="crm-kanban-count">${colTasks.length}</span>
              </div>
              <div class="crm-kanban-column-body">
                ${cardsHtml}
              </div>
            </div>
          `;
        })
        .join('');
    }

    function renderAll() {
      syncViewModeButtons();
      renderKpis();
      renderContextFilterBanner();

      const queryFilters = {
        ...state.filters,
        pageSize: state.viewMode === 'kanban' ? 500 : state.filters.pageSize
      };
      const result = service.listTarefas(queryFilters);
      state.filters.page = result.page;

      if (result.total === 0) {
        tableScrollEl.hidden = true;
        kanbanBoardEl.hidden = true;
        paginationEl.innerHTML = '';
        emptyStateEl.hidden = false;

        const hasActiveFilters =
          Boolean(state.filters.search) ||
          Boolean(state.filters.leadId) ||
          Boolean(state.filters.atendimentoId) ||
          state.filters.priority !== 'todos' ||
          state.filters.status !== 'todos' ||
          (!isAtendente && state.filters.attendant !== 'todos');

        if (result.allStoredCount === 0) {
          emptyTitleEl.textContent = 'Nenhuma tarefa cadastrada';
          emptyDescEl.textContent = 'Crie a primeira tarefa operacional ou restaure os dados demonstrativos.';
          emptyClearBtn.hidden = true;
          emptyRestoreBtn.hidden = false;
        } else {
          emptyTitleEl.textContent = 'Nenhuma tarefa encontrada';
          emptyDescEl.textContent = 'Nenhuma tarefa corresponde aos filtros aplicados.';
          emptyClearBtn.hidden = !hasActiveFilters;
          emptyRestoreBtn.hidden = true;
        }

        resultsCounterEl.textContent = '0 tarefas exibidas';
        return;
      }

      emptyStateEl.hidden = true;
      if (state.viewMode === 'kanban') {
        resultsCounterEl.textContent = `${result.total} tarefa(s) no quadro Kanban`;
        renderKanbanView(result.items);
      } else {
        const start = (result.page - 1) * result.pageSize + 1;
        const end = Math.min(result.page * result.pageSize, result.total);
        resultsCounterEl.textContent = `Mostrando ${start}–${end} de ${result.total} tarefa(s)`;
        renderListView(result.items);
      }

      renderPagination(result.page, result.totalPages);
    }

    let lastTriggerEl = null;

    function openFormModal(taskToEdit = null, prefillContext = {}) {
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      clearFormErrors();
      crudForm.reset();

      if (taskToEdit) {
        state.editingId = taskToEdit.id;
        formTitle.textContent = `Editar tarefa (${taskToEdit.id})`;
        formSubtitle.textContent = 'Atualize título, prazo, prioridade, responsável ou vínculos.';
        saveBtn.textContent = 'Salvar alterações';

        populateLeadAndAtendimentoSelects(taskToEdit.lead_id || '', taskToEdit.atendimento_id || '');
        formFields.title.input.value = taskToEdit.titulo || '';
        formFields.description.input.value = taskToEdit.descricao || '';
        formFields.attendant.input.value = isAtendente
          ? scopedOwner
          : taskToEdit.responsavel_tarefa || actorName;
        formFields.attendant.input.disabled = isAtendente;
        formFields.dueDate.input.value = taskToEdit.data_vencimento || getTodayDateInput();
        formFields.dueTime.input.value = taskToEdit.horario || '10:00';
        formFields.priority.input.value = taskToEdit.prioridade || 'media';
        formFields.status.input.value = taskToEdit.status || 'pendente';
      } else {
        state.editingId = null;
        formTitle.textContent = 'Nova tarefa';
        formSubtitle.textContent = 'Defina título, prazo, prioridade e vínculos com Lead ou Atendimento.';
        saveBtn.textContent = 'Cadastrar tarefa';

        const preLead = prefillContext.leadId || state.filters.leadId || '';
        const preAtend = prefillContext.atendimentoId || state.filters.atendimentoId || '';
        populateLeadAndAtendimentoSelects(preLead, preAtend);
        formFields.attendant.input.value = isAtendente
          ? scopedOwner
          : service.CATALOGS.attendants.includes(actorName)
            ? actorName
            : service.CATALOGS.attendants[0];
        formFields.attendant.input.disabled = isAtendente;
        formFields.dueDate.input.value = getTodayDateInput();
        formFields.dueTime.input.value = '15:00';
        formFields.priority.input.value = 'media';
        formFields.status.input.value = 'pendente';
      }

      formModal.hidden = false;
      formFields.title.input.focus();
    }

    function closeFormModal(restoreFocus = false) {
      formModal.hidden = true;
      state.editingId = null;
      if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
        lastTriggerEl.focus();
      }
    }

    function openDeleteModal(id) {
      const task = service.getTarefaById(id);
      if (!task) return;
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      state.deletingId = task.id;
      deleteSummaryEl.textContent = `Confirma a exclusão da tarefa "${task.titulo}" (${task.id}) do armazenamento local demonstrativo?`;
      deleteModal.hidden = false;
      if (cancelDeleteBtn && typeof cancelDeleteBtn.focus === 'function') {
        cancelDeleteBtn.focus();
      }
    }

    function closeDeleteModal(restoreFocus = false) {
      deleteModal.hidden = true;
      state.deletingId = null;
      if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
        lastTriggerEl.focus();
      }
    }

    function renderDetailModalContent(task) {
      if (!task) return;
      const overdue = service.isTaskOverdue(task);
      detailTitle.textContent = `${task.id} • ${task.titulo}`;
      detailSubtitle.textContent = `Vencimento: ${formatDateBr(task.data_vencimento)} às ${task.horario} • Responsável: ${task.responsavel_tarefa}`;
      if (detailCompleteBtn) {
        detailCompleteBtn.hidden = task.status === 'concluida';
      }

      const liveLead =
        task.lead_id && leadsService && typeof leadsService.getLeadById === 'function'
          ? leadsService.getLeadById(task.lead_id)
          : null;
      const liveAtend =
        task.atendimento_id && atendService && typeof atendService.getAtendimentoById === 'function'
          ? atendService.getAtendimentoById(task.atendimento_id)
          : null;
      const relatedVisitas =
        task.lead_id && visitasService && typeof visitasService.listVisitas === 'function'
          ? visitasService.listVisitas({ leadId: task.lead_id, pageSize: 50 }).items
          : [];

      const historyHtml = (Array.isArray(task.historico) ? task.historico : [])
        .map(
          (entry) => `
            <li class="crm-history-item">
              <div class="crm-history-dot" aria-hidden="true"></div>
              <div class="crm-history-content">
                <div class="crm-timeline-head">
                  <span class="crm-channel-badge channel-registro">${escapeHtml(entry.titulo || 'Atualização')}</span>
                  <time>${escapeHtml(formatDateTimeBr(entry.criado_em))}</time>
                </div>
                <p>${escapeHtml(entry.descricao)}</p>
                <small>Registrado por ${escapeHtml(entry.autor || 'Equipe CRM')}</small>
              </div>
            </li>
          `
        )
        .join('');

      detailBody.innerHTML = `
        <div class="crm-detail-grid">
          <section class="crm-detail-card">
            <h4>Dados da Tarefa</h4>
            <dl class="crm-detail-dl">
              <div><dt>Título</dt><dd>${escapeHtml(task.titulo)}</dd></div>
              <div>
                <dt>Prioridade</dt>
                <dd>
                  <span class="crm-priority-badge priority-${escapeHtml(task.prioridade)}">
                    ${escapeHtml(service.getPriorityLabel(task.prioridade))}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span class="crm-status-badge crm-tarefa-status-${escapeHtml(task.status)}">
                    ${escapeHtml(service.getStatusLabel(task.status))}
                  </span>
                  ${overdue ? ' <span class="crm-overdue-tag">Atrasada</span>' : ''}
                </dd>
              </div>
              <div><dt>Prazo</dt><dd>${escapeHtml(formatDateBr(task.data_vencimento))} às ${escapeHtml(task.horario)}</dd></div>
              <div><dt>Responsável</dt><dd>${escapeHtml(task.responsavel_tarefa)}</dd></div>
            </dl>
            <div class="crm-detail-inline-action">
              <label>Descrição</label>
              <p class="crm-detail-notes-text" id="detail-tarefa-description-preview">
                ${task.descricao ? escapeHtml(task.descricao) : 'Sem descrição detalhada.'}
              </p>
            </div>
          </section>

          <section class="crm-detail-card">
            <h4>Registros Relacionados</h4>
            <dl class="crm-detail-dl">
              <div>
                <dt>Lead relacionado</dt>
                <dd>${liveLead ? `${escapeHtml(liveLead.id)} — ${escapeHtml(liveLead.nome_responsavel)}` : task.lead_id ? escapeHtml(task.lead_id) : 'Não vinculado'}</dd>
              </div>
              <div>
                <dt>Aluno(a)</dt>
                <dd>${escapeHtml((liveLead && liveLead.nome_aluno) || task.nome_aluno || 'Não informado')}</dd>
              </div>
              <div>
                <dt>Atendimento relacionado</dt>
                <dd>${liveAtend ? `${escapeHtml(liveAtend.id)} — ${escapeHtml(atendService.getChannelLabel(liveAtend.canal))}` : task.atendimento_id ? escapeHtml(task.atendimento_id) : 'Não vinculado'}</dd>
              </div>
              <div>
                <dt>Visitas do lead</dt>
                <dd>${relatedVisitas.length} visita(s) registrada(s)</dd>
              </div>
            </dl>

            <div class="crm-detail-inline-action">
              <label>Navegação entre módulos</label>
              <div class="crm-detail-module-links">
                ${
                  task.lead_id && onNavigateModule
                    ? `<button type="button" class="btn btn-outline btn-sm" id="btn-detail-tarefa-open-lead">Ver lead (${escapeHtml(task.lead_id)})</button>`
                    : ''
                }
                ${
                  task.atendimento_id && onNavigateModule
                    ? `<button type="button" class="btn btn-outline btn-sm" id="btn-detail-tarefa-open-atendimento">Ver atendimento (${escapeHtml(task.atendimento_id)})</button>`
                    : ''
                }
                ${
                  task.lead_id && onNavigateModule
                    ? `<button type="button" class="btn btn-outline btn-sm" id="btn-detail-tarefa-open-visitas">Ver visitas (${relatedVisitas.length})</button>`
                    : ''
                }
              </div>
            </div>

            ${
              !isAtendente
                ? `<div class="crm-detail-inline-action">
                    <label for="detail-tarefa-owner-select">Alterar responsável</label>
                    <div class="crm-detail-inline-row">
                      <select id="detail-tarefa-owner-select" class="form-control crm-input-compact">
                        ${buildAttendantOptions(service.CATALOGS.attendants, task.responsavel_tarefa, '')}
                      </select>
                      <button type="button" class="btn btn-secondary btn-sm" id="btn-detail-tarefa-apply-owner">Aplicar</button>
                    </div>
                  </div>`
                : ''
            }
          </section>
        </div>

        <section class="crm-detail-history-section" aria-label="Histórico da tarefa">
          <div class="crm-detail-history-head">
            <h4>Histórico da Tarefa</h4>
            <span class="crm-dropdown-sub">${(task.historico || []).length} evento(s)</span>
          </div>
          <ul class="crm-history-timeline">
            ${historyHtml}
          </ul>
        </section>
      `;

      const applyOwnerBtn = detailBody.querySelector('#btn-detail-tarefa-apply-owner');
      const ownerSel = detailBody.querySelector('#detail-tarefa-owner-select');
      if (applyOwnerBtn && ownerSel) {
        applyOwnerBtn.addEventListener('click', () => {
          const updated = service.changeTarefaOwner(task.id, ownerSel.value, actorName);
          if (updated) {
            renderDetailModalContent(updated);
            renderAll();
            notify(`Responsável da tarefa ${updated.id} alterado para ${updated.responsavel_tarefa}.`);
          }
        });
      }

      const openLeadBtn = detailBody.querySelector('#btn-detail-tarefa-open-lead');
      if (openLeadBtn && onNavigateModule) {
        openLeadBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('leads', { search: task.lead_id });
        });
      }

      const openAtendBtn = detailBody.querySelector('#btn-detail-tarefa-open-atendimento');
      if (openAtendBtn && onNavigateModule) {
        openAtendBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('atendimentos', { leadId: task.lead_id || '', search: task.atendimento_id });
        });
      }

      const openVisitasBtn = detailBody.querySelector('#btn-detail-tarefa-open-visitas');
      if (openVisitasBtn && onNavigateModule) {
        openVisitasBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('visitas', { leadId: task.lead_id });
        });
      }
    }

    function openDetailModal(id) {
      const task = service.getTarefaById(id);
      if (!task) return;
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      state.detailId = task.id;
      renderDetailModalContent(task);
      detailModal.hidden = false;
      const closeBtn = container.querySelector('#btn-close-tarefa-detail');
      if (closeBtn && typeof closeBtn.focus === 'function') closeBtn.focus();
    }

    function closeDetailModal(restoreFocus = false) {
      detailModal.hidden = true;
      state.detailId = null;
      if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
        lastTriggerEl.focus();
      }
    }

    function resetAllFilters() {
      state.filters = {
        ...DEFAULT_FILTERS,
        attendant: isAtendente ? scopedOwner : 'todos'
      };
      searchInput.value = '';
      prioritySelect.value = 'todos';
      statusSelect.value = 'todos';
      attendantFilterSelect.value = state.filters.attendant;
      renderAll();
    }

    if (workloadStripEl && !isAtendente) {
      workloadStripEl.addEventListener('click', (e) => {
        const chip = e.target.closest('button[data-workload-owner]');
        if (!chip) return;
        const nextOwner = chip.getAttribute('data-workload-owner') || 'todos';
        state.filters.attendant = nextOwner;
        state.filters.page = 1;
        attendantFilterSelect.value = nextOwner;
        renderAll();
      });
    }

    // Eventos de alternância Lista / Kanban
    viewListBtn.addEventListener('click', () => {
      state.viewMode = 'list';
      renderAll();
    });

    viewKanbanBtn.addEventListener('click', () => {
      state.viewMode = 'kanban';
      renderAll();
    });

    // Eventos de filtros
    searchInput.addEventListener('input', () => {
      state.filters.search = searchInput.value.trim();
      state.filters.page = 1;
      renderAll();
    });

    [
      [prioritySelect, 'priority'],
      [statusSelect, 'status'],
      [attendantFilterSelect, 'attendant']
    ].forEach(([el, key]) => {
      el.addEventListener('change', () => {
        state.filters[key] = el.value;
        state.filters.page = 1;
        renderAll();
      });
    });

    if (clearContextBtn) {
      clearContextBtn.addEventListener('click', () => {
        state.filters.leadId = '';
        state.filters.atendimentoId = '';
        state.filters.page = 1;
        renderAll();
      });
    }

    clearFiltersBtn.addEventListener('click', resetAllFilters);
    emptyClearBtn.addEventListener('click', resetAllFilters);

    emptyRestoreBtn.addEventListener('click', () => {
      service.restoreDemoTarefas();
      resetAllFilters();
      notify('Tarefas demonstrativas restauradas no armazenamento local.');
    });

    container.querySelector('#btn-new-tarefa').addEventListener('click', () => openFormModal(null));
    emptyNewBtn.addEventListener('click', () => openFormModal(null));

    paginationEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      state.filters.page = Number(btn.getAttribute('data-page')) || 1;
      renderAll();
    });

    // Delegação única para Lista e Kanban (cliques, selects e drag-and-drop)
    function handleActionClick(e) {
      const btn = e.target.closest('button[data-action][data-id]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'complete') {
        const updated = service.completeTarefa(id, actorName);
        if (updated) {
          renderAll();
          notify(`Tarefa "${updated.titulo}" marcada como concluída.`);
        }
      } else if (action === 'detail') {
        openDetailModal(id);
      } else if (action === 'edit') {
        const task = service.getTarefaById(id);
        if (task) openFormModal(task);
      } else if (action === 'delete') {
        openDeleteModal(id);
      }
    }

    function handleInlineChange(e) {
      const sel = e.target.closest('select[data-action][data-id]');
      if (!sel) return;
      const action = sel.getAttribute('data-action');
      const id = sel.getAttribute('data-id');
      if (action === 'inline-status') {
        const updated = service.changeTarefaStatus(id, sel.value, actorName);
        if (updated) {
          renderAll();
          notify(`Status da tarefa ${updated.id} alterado para ${service.getStatusLabel(updated.status)}.`);
        }
      } else if (action === 'inline-owner') {
        const updated = service.changeTarefaOwner(id, sel.value, actorName);
        if (updated) {
          renderAll();
          notify(`Responsável da tarefa ${updated.id} alterado para ${updated.responsavel_tarefa}.`);
        }
      }
    }

    tbodyEl.addEventListener('click', handleActionClick);
    tbodyEl.addEventListener('change', handleInlineChange);
    kanbanBoardEl.addEventListener('click', handleActionClick);
    kanbanBoardEl.addEventListener('change', handleInlineChange);

    // Drag and Drop no quadro Kanban
    kanbanBoardEl.addEventListener('dragstart', (e) => {
      const card = e.target.closest('[data-tarefa-id]');
      if (!card) return;
      state.draggedId = card.getAttribute('data-tarefa-id');
      card.classList.add('is-dragging');
    });

    kanbanBoardEl.addEventListener('dragend', () => {
      state.draggedId = null;
      kanbanBoardEl.querySelectorAll('.is-dragging, .is-drag-over').forEach((el) => {
        el.classList.remove('is-dragging', 'is-drag-over');
      });
    });

    kanbanBoardEl.addEventListener('dragover', (e) => {
      const col = e.target.closest('.crm-kanban-column');
      if (!col || !state.draggedId) return;
      e.preventDefault();
      col.classList.add('is-drag-over');
    });

    kanbanBoardEl.addEventListener('dragleave', (e) => {
      const col = e.target.closest('.crm-kanban-column');
      if (col) col.classList.remove('is-drag-over');
    });

    kanbanBoardEl.addEventListener('drop', (e) => {
      const col = e.target.closest('.crm-kanban-column');
      if (!col || !state.draggedId) return;
      e.preventDefault();
      col.classList.remove('is-drag-over');
      const nextStatus = col.getAttribute('data-kanban-status');
      const updated = service.changeTarefaStatus(state.draggedId, nextStatus, actorName);
      state.draggedId = null;
      if (updated) {
        renderAll();
        notify(`Tarefa ${updated.id} movida para ${service.getStatusLabel(updated.status)}.`);
      }
    });

    // Sincronização entre Lead e Atendimento no formulário
    formFields.lead.input.addEventListener('change', () => {
      const chosenLead = formFields.lead.input.value;
      const currentAtend = formFields.atendimento.input.value;
      populateLeadAndAtendimentoSelects(chosenLead, '');
      if (currentAtend) {
        const optExists = Array.from(formFields.atendimento.input.querySelectorAll('option')).some(
          (o) => o.value === currentAtend
        );
        if (optExists) formFields.atendimento.input.value = currentAtend;
      }
    });

    formFields.atendimento.input.addEventListener('change', () => {
      const chosenAtend = formFields.atendimento.input.value;
      if (!chosenAtend || !atendService) return;
      const atendObj = atendService.getAtendimentoById(chosenAtend);
      if (atendObj && atendObj.lead_id && !formFields.lead.input.value) {
        formFields.lead.input.value = atendObj.lead_id;
      }
    });

    Object.keys(formFields).forEach((key) => {
      const f = formFields[key];
      if (!f.input) return;
      f.input.addEventListener('blur', () => validateField(f));
      f.input.addEventListener('input', () => {
        if (f.input.classList.contains('is-invalid')) validateField(f);
      });
      if (f.input.tagName === 'SELECT') {
        f.input.addEventListener('change', () => validateField(f));
      }
    });

    crudForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;
      let firstInvalid = null;

      Object.keys(formFields).forEach((key) => {
        const f = formFields[key];
        if (!validateField(f)) {
          valid = false;
          if (!firstInvalid) firstInvalid = f.input;
        }
      });

      if (!valid) {
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const payload = {
        titulo: formFields.title.input.value.trim(),
        descricao: formFields.description.input.value.trim(),
        lead_id: formFields.lead.input.value,
        atendimento_id: formFields.atendimento.input.value,
        responsavel_tarefa: formFields.attendant.input.value,
        data_vencimento: formFields.dueDate.input.value,
        horario: formFields.dueTime.input.value,
        prioridade: formFields.priority.input.value,
        status: formFields.status.input.value
      };

      const editingId = state.editingId;
      if (editingId) {
        const updated = service.updateTarefa(editingId, payload, actorName);
        closeFormModal();
        renderAll();
        if (updated) {
          notify(`Tarefa "${updated.titulo}" (${updated.id}) atualizada.`);
        }
      } else {
        const created = service.createTarefa(payload, actorName);
        state.filters.page = 1;
        closeFormModal();
        renderAll();
        notify(`Tarefa "${created.titulo}" (${created.id}) cadastrada.`);
      }
    });

    // Controles dos Modais
    container.querySelector('#btn-close-tarefa-form').addEventListener('click', () => closeFormModal(true));
    container.querySelector('#btn-cancel-tarefa-form').addEventListener('click', () => closeFormModal(true));
    formModal.addEventListener('click', (e) => {
      if (e.target === formModal) closeFormModal(true);
    });

    container.querySelector('#btn-close-tarefa-detail').addEventListener('click', () => closeDetailModal(true));
    container.querySelector('#btn-detail-tarefa-close').addEventListener('click', () => closeDetailModal(true));
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal(true);
    });

    container.querySelector('#btn-detail-tarefa-edit').addEventListener('click', () => {
      const id = state.detailId;
      closeDetailModal(false);
      const task = id ? service.getTarefaById(id) : null;
      if (task) openFormModal(task);
    });

    if (detailCompleteBtn) {
      detailCompleteBtn.addEventListener('click', () => {
        const id = state.detailId;
        if (!id) return;
        const updated = service.completeTarefa(id, actorName);
        if (updated) {
          renderDetailModalContent(updated);
          renderAll();
          notify(`Tarefa "${updated.titulo}" marcada como concluída.`);
        }
      });
    }

    container.querySelector('#btn-detail-tarefa-delete').addEventListener('click', () => {
      const id = state.detailId;
      closeDetailModal(false);
      if (id) openDeleteModal(id);
    });

    container.querySelector('#btn-close-delete-tarefa').addEventListener('click', () => closeDeleteModal(true));
    cancelDeleteBtn.addEventListener('click', () => closeDeleteModal(true));
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModal(true);
    });

    confirmDeleteBtn.addEventListener('click', () => {
      const id = state.deletingId;
      if (!id) return;
      const removed = service.deleteTarefa(id);
      closeDeleteModal(false);
      renderAll();
      if (removed) {
        notify(`Tarefa "${removed.titulo}" (${removed.id}) excluída.`);
      }
    });

    if (globalScope.document && typeof globalScope.document.addEventListener === 'function') {
      if (container.__tarefasEscapeHandler && typeof globalScope.document.removeEventListener === 'function') {
        globalScope.document.removeEventListener('keydown', container.__tarefasEscapeHandler);
      }
      container.__tarefasEscapeHandler = (e) => {
        if (e.key !== 'Escape') return;
        if (!deleteModal.hidden) closeDeleteModal(true);
        else if (!formModal.hidden) closeFormModal(true);
        else if (!detailModal.hidden) closeDetailModal(true);
      };
      globalScope.document.addEventListener('keydown', container.__tarefasEscapeHandler);
    }

    renderAll();

    if (options.autoOpenNewModal) {
      openFormModal(null, {
        leadId: state.filters.leadId,
        atendimentoId: state.filters.atendimentoId
      });
    }
  }

  globalScope.EnsinaAiCrmTarefas = Object.freeze({
    renderTarefasModule
  });
})(window);
