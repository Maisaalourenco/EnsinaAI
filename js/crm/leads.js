/**
 * ENSINA AÍ — CRM Escolar
 * Módulo de Interface de Gestão de Leads (js/crm/leads.js)
 * JavaScript Vanilla ES6+ — Depende exclusivamente de EnsinaAiLeadsService
 */

(function initCrmLeadsView(globalScope) {
  'use strict';

  const DEFAULT_FILTERS = Object.freeze({
    search: '',
    status: 'todos',
    stage: 'todos',
    shift: 'todos',
    origin: 'todos',
    attendant: 'todos',
    period: 'todos',
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

  function formatDateTimeBr(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  function formatDateShortBr(isoString) {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  function getDefaultVisitInputValue() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(10, 0, 0, 0);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T10:00`;
  }

  function buildSelectOptions(items, selectedVal, includeAllLabel) {
    const allOption = includeAllLabel
      ? `<option value="todos"${selectedVal === 'todos' ? ' selected' : ''}>${escapeHtml(includeAllLabel)}</option>`
      : '';
    const options = items
      .map(
        (item) =>
          `<option value="${escapeHtml(item.codigo)}"${
            selectedVal === item.codigo ? ' selected' : ''
          }>${escapeHtml(item.label)}</option>`
      )
      .join('');
    return allOption + options;
  }

  function buildAttendantOptions(attendants, selectedVal, includeAllLabel) {
    const allOption = includeAllLabel
      ? `<option value="todos"${selectedVal === 'todos' ? ' selected' : ''}>${escapeHtml(includeAllLabel)}</option>`
      : '';
    const options = attendants
      .map(
        (name) =>
          `<option value="${escapeHtml(name)}"${
            selectedVal === name ? ' selected' : ''
          }>${escapeHtml(name)}</option>`
      )
      .join('');
    return allOption + options;
  }

  function renderLeadsModule(container, options = {}) {
    const service = globalScope.EnsinaAiLeadsService;
    const components = globalScope.EnsinaAiCrmComponents;
    if (!container || !service) return;

    const session = options.session || {
      role: 'gestor',
      name: 'Coordenação Demo',
      roleLabel: 'Gestor Escolar'
    };
    const isAtendente = session.role === 'atendente';
    const scopedOwner = isAtendente ? (session.name || 'Secretaria Demo') : 'todos';
    const actorName = `${session.name} (${session.roleLabel})`;
    const notify = typeof options.onToast === 'function' ? options.onToast : () => {};
    const onNavigateModule =
      typeof options.onNavigateModule === 'function' ? options.onNavigateModule : null;
    const onOpenAtendimentos =
      typeof options.onOpenAtendimentos === 'function'
        ? options.onOpenAtendimentos
        : onNavigateModule
          ? (ctx) => onNavigateModule('atendimentos', ctx)
          : null;

    const state = {
      filters: {
        ...DEFAULT_FILTERS,
        attendant: scopedOwner,
        unassignedOnly: !isAtendente && Boolean(options.initialUnassigned),
        withoutAttendance: !isAtendente && Boolean(options.initialWithoutAttendance),
        search: String(options.initialSearch || '').trim()
      },
      editingLeadId: null,
      detailLeadId: null,
      deletingLeadId: null
    };

    container.innerHTML = `
      <div class="crm-leads-module" id="crm-leads-module">
        <!-- Cabeçalho da Página de Leads -->
        <section class="crm-leads-header-bar">
          <div>
            <div class="crm-leads-title-row">
              <h2>${isAtendente ? 'Meus Leads' : 'Gestão de Leads'}</h2>
              <span class="crm-demo-pill">Dados demonstrativos locais</span>
            </div>
            <p class="crm-leads-subtitle">
              ${
                isAtendente
                  ? 'Acompanhe os leads da sua carteira, registre interações, agende visitas e atualize o avanço no funil.'
                  : 'Gerencie toda a base de leads da escola, distribua responsáveis, identifique pendências sem atendimento e acompanhe conversões.'
              }
            </p>
          </div>
          <div class="crm-leads-header-actions">
            <button type="button" class="btn btn-primary" id="btn-new-lead">
              Novo lead
            </button>
          </div>
        </section>

        ${
          isAtendente
            ? `<section class="crm-role-scope-banner" id="leads-role-scope-banner" aria-label="Escopo da carteira">
                <strong>Carteira operacional:</strong>
                <span>Exibindo apenas os leads atribuídos a ${escapeHtml(scopedOwner)}. Distribuição e redistribuição de equipe ficam disponíveis no perfil Gestor Escolar.</span>
              </section>`
            : `<section class="crm-distribution-panel" id="leads-distribution-panel" aria-label="Distribuição de leads"></section>`
        }

        <!-- Indicadores Rápidos -->
        <section class="crm-leads-kpi-row" id="leads-kpi-row" aria-label="Indicadores de leads">
          <!-- Renderizado dinamicamente -->
        </section>

        <!-- Barra de Pesquisa e Filtros -->
        <section class="crm-filters-card" aria-label="Pesquisa e filtros de leads">
          <div class="crm-filters-grid crm-leads-filters-grid">
            <div class="crm-filter-field crm-filter-search">
              <label for="leads-search-input">Pesquisar (responsável, aluno ou telefone)</label>
              <input
                type="search"
                id="leads-search-input"
                class="form-control crm-input-compact"
                placeholder="Ex.: Mariana, Sofia ou (11) 98765"
                value="${escapeHtml(state.filters.search)}"
              />
            </div>

            <div class="crm-filter-field">
              <label for="leads-filter-status">Status</label>
              <select id="leads-filter-status" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.statuses, state.filters.status, 'Todos os status')}
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="leads-filter-stage">Etapa escolar</label>
              <select id="leads-filter-stage" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.stages, state.filters.stage, 'Todas as etapas')}
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="leads-filter-origin">Origem</label>
              <select id="leads-filter-origin" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.origins, state.filters.origin, 'Todas as origens')}
              </select>
            </div>

            <div class="crm-filter-field" id="leads-filter-attendant-wrap"${isAtendente ? ' hidden' : ''}>
              <label for="leads-filter-attendant">Atendente</label>
              <select id="leads-filter-attendant" class="form-control crm-input-compact">
                ${buildAttendantOptions(service.CATALOGS.attendants, state.filters.attendant, 'Todos os atendentes')}
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="leads-filter-shift">Turno de interesse</label>
              <select id="leads-filter-shift" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.shifts, state.filters.shift, 'Todos os turnos')}
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="leads-filter-period">Período</label>
              <select id="leads-filter-period" class="form-control crm-input-compact">
                <option value="todos">Todo o período</option>
                <option value="hoje">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>
            </div>
          </div>

          <div class="crm-filters-footer">
            <span class="crm-results-counter" id="leads-results-counter"></span>
            <button type="button" class="btn btn-outline btn-sm" id="btn-clear-lead-filters">
              Limpar filtros
            </button>
          </div>
        </section>

        <!-- Tabela e Paginação -->
        <section class="crm-panel crm-leads-table-panel" aria-label="Listagem de leads">
          <div class="crm-table-scroll" id="leads-table-scroll">
            <table class="crm-table crm-leads-table">
              <thead>
                <tr>
                  <th>Nome do responsável</th>
                  <th>Nome do aluno</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Etapa escolar</th>
                  <th>Origem</th>
                  <th>Atendente responsável</th>
                  <th>Status</th>
                  <th>Data de cadastro</th>
                  <th class="crm-th-actions">Ações</th>
                </tr>
              </thead>
              <tbody id="leads-table-tbody"></tbody>
            </table>
          </div>

          <div class="crm-empty-state" id="leads-empty-state" hidden>
            <strong id="leads-empty-title">Nenhum lead encontrado</strong>
            <p id="leads-empty-desc">
              Nenhum registro corresponde aos filtros informados.
            </p>
            <div class="crm-empty-actions">
              <button type="button" class="btn btn-outline btn-sm" id="btn-empty-clear-filters">
                Limpar filtros
              </button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-empty-new-lead">
                + Cadastrar Lead
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="btn-empty-restore-demo" hidden>
                Restaurar dados demonstrativos
              </button>
            </div>
          </div>

          <div class="crm-pagination" id="leads-pagination" aria-label="Paginação da lista de leads"></div>
        </section>

        <!-- MODAL: CADASTRO / EDIÇÃO DE LEAD -->
        <div
          class="crm-modal-backdrop"
          id="lead-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-form-modal-title"
          hidden
        >
          <div class="crm-modal-dialog">
            <div class="crm-modal-header">
              <div>
                <h3 id="lead-form-modal-title">Novo lead</h3>
                <p id="lead-form-modal-subtitle">Preencha os dados de contato e interesse escolar.</p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-lead-form" aria-label="Fechar janela">&times;</button>
            </div>

            <form id="lead-crud-form" novalidate>
              <div class="crm-modal-body">
                <div class="crm-form-grid-2">
                  <div class="form-group">
                    <label for="lead-field-parent-name" class="form-label">
                      <span>Nome do responsável <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="text"
                      id="lead-field-parent-name"
                      class="form-control crm-input-compact"
                      maxlength="120"
                      placeholder="Ex.: Carolina Silva"
                      required
                      aria-describedby="error-lead-parent-name"
                    />
                    <span class="form-error-msg" id="error-lead-parent-name" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="lead-field-phone" class="form-label">
                      <span>Telefone / WhatsApp <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="tel"
                      id="lead-field-phone"
                      class="form-control crm-input-compact"
                      maxlength="20"
                      placeholder="(11) 98765-4321"
                      required
                      aria-describedby="error-lead-phone"
                    />
                    <span class="form-error-msg" id="error-lead-phone" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="lead-field-email" class="form-label">
                      <span>E-mail <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="email"
                      id="lead-field-email"
                      class="form-control crm-input-compact"
                      maxlength="160"
                      placeholder="responsavel@email.com"
                      required
                      aria-describedby="error-lead-email"
                    />
                    <span class="form-error-msg" id="error-lead-email" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="lead-field-student-name" class="form-label">
                      <span>Nome do aluno</span>
                    </label>
                    <input
                      type="text"
                      id="lead-field-student-name"
                      class="form-control crm-input-compact"
                      maxlength="120"
                      placeholder="Opcional"
                      aria-describedby="error-lead-student-name"
                    />
                    <span class="form-error-msg" id="error-lead-student-name" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="lead-field-student-age" class="form-label">
                      <span>Idade do aluno</span>
                    </label>
                    <input
                      type="number"
                      id="lead-field-student-age"
                      class="form-control crm-input-compact"
                      min="1"
                      max="30"
                      placeholder="Ex.: 8"
                      aria-describedby="error-lead-student-age"
                    />
                    <span class="form-error-msg" id="error-lead-student-age" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="lead-field-origin" class="form-label">
                      <span>Origem do contato <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="lead-field-origin" class="form-control crm-input-compact" required aria-describedby="error-lead-origin">
                      ${buildSelectOptions(service.CATALOGS.origins, 'site', '')}
                    </select>
                    <span class="form-error-msg" id="error-lead-origin" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="lead-field-stage" class="form-label">
                      <span>Etapa escolar <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="lead-field-stage" class="form-control crm-input-compact" required aria-describedby="error-lead-stage">
                      <option value="">Selecione a etapa...</option>
                      ${buildSelectOptions(service.CATALOGS.stages, '', '')}
                    </select>
                    <span class="form-error-msg" id="error-lead-stage" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="lead-field-shift" class="form-label">
                      <span>Turno de interesse <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="lead-field-shift" class="form-control crm-input-compact" required aria-describedby="error-lead-shift">
                      <option value="">Selecione o turno...</option>
                      ${buildSelectOptions(service.CATALOGS.shifts, '', '')}
                    </select>
                    <span class="form-error-msg" id="error-lead-shift" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="lead-field-attendant" class="form-label">
                      <span>Responsável pelo atendimento <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="lead-field-attendant" class="form-control crm-input-compact" required aria-describedby="error-lead-attendant">
                      ${isAtendente ? '' : '<option value="Aguardando atribuição">Aguardando atribuição</option>'}
                      ${buildAttendantOptions(service.CATALOGS.attendants, isAtendente ? scopedOwner : 'Secretaria Demo', '')}
                    </select>
                    <span class="form-error-msg" id="error-lead-attendant" role="alert"></span>
                  </div>

                  <div class="form-group" id="lead-field-status-group" hidden>
                    <label for="lead-field-status" class="form-label">
                      <span>Status do lead</span>
                    </label>
                    <select id="lead-field-status" class="form-control crm-input-compact">
                      ${buildSelectOptions(service.CATALOGS.statuses, 'novo', '')}
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label for="lead-field-message" class="form-label">
                    <span>Mensagem ou observação do contato</span>
                  </label>
                  <textarea
                    id="lead-field-message"
                    class="form-control form-textarea"
                    rows="2"
                    maxlength="500"
                    placeholder="Mensagem inicial ou observação registrada para o contato..."
                    aria-describedby="error-lead-message"
                  ></textarea>
                  <span class="form-error-msg" id="error-lead-message" role="alert"></span>
                </div>

                <div class="form-group">
                  <label for="lead-field-notes" class="form-label">
                    <span>Observações internas da equipe</span>
                  </label>
                  <textarea
                    id="lead-field-notes"
                    class="form-control form-textarea"
                    rows="2"
                    maxlength="500"
                    placeholder="Anotações da equipe de atendimento (horário de retorno, transporte, etc.)..."
                    aria-describedby="error-lead-notes"
                  ></textarea>
                  <span class="form-error-msg" id="error-lead-notes" role="alert"></span>
                </div>

                <div class="form-group">
                  <label for="lead-field-consent" class="crm-consent-label">
                    <input
                      type="checkbox"
                      id="lead-field-consent"
                      class="crm-consent-checkbox"
                      required
                      aria-describedby="error-lead-consent"
                    />
                    <span>
                      Confirmo que o responsável autorizou o contato da equipe escolar por telefone, WhatsApp ou e-mail.
                      <span class="required-star" aria-hidden="true">*</span>
                    </span>
                  </label>
                  <span class="form-error-msg" id="error-lead-consent" role="alert"></span>
                </div>
              </div>

              <div class="crm-modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-lead-form">Cancelar</button>
                <button type="submit" class="btn btn-primary" id="btn-save-lead">Salvar Lead</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL / PAINEL DE DETALHES DO LEAD -->
        <div
          class="crm-modal-backdrop"
          id="lead-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-detail-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="lead-detail-modal-title">Detalhes do Lead</h3>
                <p id="lead-detail-modal-subtitle"></p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-lead-detail" aria-label="Fechar detalhes">&times;</button>
            </div>

            <div class="crm-modal-body" id="lead-detail-body">
              <!-- Preenchido dinamicamente ao abrir um lead -->
            </div>

            <div class="crm-modal-footer crm-modal-footer-split">
              <button type="button" class="btn btn-outline crm-btn-danger-outline" id="btn-detail-delete-lead">
                Excluir Lead
              </button>
              <div class="crm-modal-footer-actions">
                <button type="button" class="btn btn-outline" id="btn-detail-edit-lead">Editar Lead</button>
                <button type="button" class="btn btn-secondary" id="btn-detail-close-footer">Fechar</button>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL DE CONFIRMAÇÃO DE EXCLUSÃO -->
        <div
          class="crm-modal-backdrop"
          id="lead-delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lead-delete-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-sm">
            <div class="crm-modal-header">
              <div>
                <h3 id="lead-delete-modal-title">Confirmar exclusão de lead</h3>
                <p>Esta ação remove o registro da base local demonstrativa.</p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-delete-lead" aria-label="Fechar confirmação">&times;</button>
            </div>

            <div class="crm-modal-body">
              <div class="crm-alert crm-alert-warning" role="alert">
                <div class="crm-alert-body">
                  <strong>Deseja realmente excluir este lead?</strong>
                  <p id="delete-lead-target-summary"></p>
                </div>
              </div>
            </div>

            <div class="crm-modal-footer">
              <button type="button" class="btn btn-outline" id="btn-cancel-delete-lead">Cancelar</button>
              <button type="button" class="btn btn-primary crm-btn-danger" id="btn-confirm-delete-lead">
                Confirmar exclusão
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Referências principais da tela
    const kpiRowEl = container.querySelector('#leads-kpi-row');
    const distributionPanelEl = container.querySelector('#leads-distribution-panel');
    const searchInput = container.querySelector('#leads-search-input');
    const statusSelect = container.querySelector('#leads-filter-status');
    const stageSelect = container.querySelector('#leads-filter-stage');
    const shiftSelect = container.querySelector('#leads-filter-shift');
    const originSelect = container.querySelector('#leads-filter-origin');
    const attendantSelect = container.querySelector('#leads-filter-attendant');
    const periodSelect = container.querySelector('#leads-filter-period');
    const clearFiltersBtn = container.querySelector('#btn-clear-lead-filters');
    const resultsCounterEl = container.querySelector('#leads-results-counter');
    const tableScrollEl = container.querySelector('#leads-table-scroll');
    const tbodyEl = container.querySelector('#leads-table-tbody');
    const emptyStateEl = container.querySelector('#leads-empty-state');
    const emptyTitleEl = container.querySelector('#leads-empty-title');
    const emptyDescEl = container.querySelector('#leads-empty-desc');
    const emptyClearBtn = container.querySelector('#btn-empty-clear-filters');
    const emptyNewBtn = container.querySelector('#btn-empty-new-lead');
    const emptyRestoreBtn = container.querySelector('#btn-empty-restore-demo');
    const paginationEl = container.querySelector('#leads-pagination');

    // Modal de Cadastro/Edição
    const formModal = container.querySelector('#lead-form-modal');
    const formTitle = container.querySelector('#lead-form-modal-title');
    const formSubtitle = container.querySelector('#lead-form-modal-subtitle');
    const crudForm = container.querySelector('#lead-crud-form');
    const saveLeadBtn = container.querySelector('#btn-save-lead');

    const statusGroupEl = container.querySelector('#lead-field-status-group');
    const formStatusSelect = container.querySelector('#lead-field-status');

    const formFields = {
      parentName: {
        input: container.querySelector('#lead-field-parent-name'),
        error: container.querySelector('#error-lead-parent-name'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return 'O nome do responsável é obrigatório.';
          if (t.length < 3) return 'Informe pelo menos 3 caracteres.';
          if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(t)) return 'Use apenas letras, espaços, hífen ou apóstrofo.';
          return '';
        }
      },
      phone: {
        input: container.querySelector('#lead-field-phone'),
        error: container.querySelector('#error-lead-phone'),
        validate: (v) => {
          const digits = service.normalizePhoneDigits(v);
          if (!digits) return 'O telefone/WhatsApp é obrigatório.';
          if (!service.isValidBrazilianPhone(digits)) {
            return 'Informe um WhatsApp brasileiro válido com DDD (10 ou 11 dígitos).';
          }
          return '';
        }
      },
      email: {
        input: container.querySelector('#lead-field-email'),
        error: container.querySelector('#error-lead-email'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return 'O e-mail é obrigatório.';
          if (!service.isValidEmail(t)) {
            return 'Informe um endereço de e-mail válido.';
          }
          return '';
        }
      },
      studentName: {
        input: container.querySelector('#lead-field-student-name'),
        error: container.querySelector('#error-lead-student-name'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return '';
          if (t.length < 2) return 'Informe ao menos 2 caracteres.';
          if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(t)) return 'Use apenas letras, espaços, hífen ou apóstrofo.';
          return '';
        }
      },
      studentAge: {
        input: container.querySelector('#lead-field-student-age'),
        error: container.querySelector('#error-lead-student-age'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return '';
          const n = Number(t);
          if (!Number.isInteger(n) || n < 1 || n > 30) {
            return 'A idade deve estar entre 1 e 30 anos.';
          }
          return '';
        }
      },
      stage: {
        input: container.querySelector('#lead-field-stage'),
        error: container.querySelector('#error-lead-stage'),
        validate: (v) => (!v ? 'Selecione a etapa escolar.' : '')
      },
      shift: {
        input: container.querySelector('#lead-field-shift'),
        error: container.querySelector('#error-lead-shift'),
        validate: (v) => (!v ? 'Selecione o turno de interesse.' : '')
      },
      origin: {
        input: container.querySelector('#lead-field-origin'),
        error: container.querySelector('#error-lead-origin'),
        validate: (v) => (!v ? 'Selecione a origem do contato.' : '')
      },
      attendant: {
        input: container.querySelector('#lead-field-attendant'),
        error: container.querySelector('#error-lead-attendant'),
        validate: (v) => (!v ? 'Selecione o responsável pelo atendimento.' : '')
      },
      message: {
        input: container.querySelector('#lead-field-message'),
        error: container.querySelector('#error-lead-message'),
        validate: (v) => (String(v || '').trim().length > 500 ? 'Máximo de 500 caracteres.' : '')
      },
      notes: {
        input: container.querySelector('#lead-field-notes'),
        error: container.querySelector('#error-lead-notes'),
        validate: (v) => (String(v || '').trim().length > 500 ? 'Máximo de 500 caracteres.' : '')
      },
      consent: {
        input: container.querySelector('#lead-field-consent'),
        error: container.querySelector('#error-lead-consent'),
        isCheckbox: true,
        validate: (checked) => (!checked ? 'Confirme o consentimento de contato para prosseguir.' : '')
      }
    };

    // Modal de Detalhes
    const detailModal = container.querySelector('#lead-detail-modal');
    const detailTitle = container.querySelector('#lead-detail-modal-title');
    const detailSubtitle = container.querySelector('#lead-detail-modal-subtitle');
    const detailBody = container.querySelector('#lead-detail-body');

    // Modal de Exclusão
    const deleteModal = container.querySelector('#lead-delete-modal');
    const deleteSummaryEl = container.querySelector('#delete-lead-target-summary');
    const confirmDeleteBtn = container.querySelector('#btn-confirm-delete-lead');
    const cancelDeleteBtn = container.querySelector('#btn-cancel-delete-lead');

    function validateField(fieldObj) {
      if (!fieldObj || !fieldObj.input) return true;
      const rawValue = fieldObj.isCheckbox ? Boolean(fieldObj.input.checked) : fieldObj.input.value;
      const msg = fieldObj.validate(rawValue);

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
      if (fieldObj.isCheckbox ? fieldObj.input.checked : String(fieldObj.input.value || '').trim()) {
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

    function renderKpis() {
      const stats = service.getStats(isAtendente ? { attendant: scopedOwner } : {});
      if (distributionPanelEl && !isAtendente) {
        const noAtendCount = service.listLeads({ withoutAttendance: true, pageSize: 500 }).total;
        distributionPanelEl.innerHTML = `
          <div class="crm-distribution-head">
            <div>
              <strong>Distribuição e triagem de leads</strong>
              <span>Filtre rapidamente leads pendentes de atribuição ou sem atendimento inicial registrado.</span>
            </div>
            <div class="crm-quick-chips" role="group" aria-label="Atalhos de triagem gerencial">
              <button type="button" class="crm-quick-chip${!state.filters.unassignedOnly && !state.filters.withoutAttendance ? ' is-active' : ''}" data-dist-filter="all">
                Todos (${stats.total})
              </button>
              <button type="button" class="crm-quick-chip${state.filters.unassignedOnly ? ' is-active' : ''}" data-dist-filter="unassigned">
                Sem responsável (${stats.semResponsavel})
              </button>
              <button type="button" class="crm-quick-chip${state.filters.withoutAttendance ? ' is-active' : ''}" data-dist-filter="no-attendance">
                Sem atendimento (${noAtendCount})
              </button>
            </div>
          </div>
        `;
      }
      if (components && typeof components.renderKpiCard === 'function') {
        kpiRowEl.innerHTML = [
          components.renderKpiCard({
            label: isAtendente ? 'Meus leads' : 'Total de leads',
            value: String(stats.total),
            valueId: 'leads-stat-total',
            foot: isAtendente ? `Carteira de ${scopedOwner}` : `${stats.semResponsavel} aguardando atribuição`,
            accent: 'navy'
          }),
          components.renderKpiCard({
            label: 'Leads novos',
            value: String(stats.novos),
            valueId: 'leads-stat-new',
            foot: 'Aguardando primeiro contato',
            accent: 'blue'
          }),
          components.renderKpiCard({
            label: 'Leads em atendimento',
            value: String(stats.emAtendimento),
            valueId: 'leads-stat-active',
            foot: 'Em contato, retorno e visitas',
            accent: 'sky'
          }),
          components.renderKpiCard({
            label: 'Leads matriculados',
            value: String(stats.concluidos),
            valueId: 'leads-stat-converted',
            foot: 'Matrículas confirmadas (demo)',
            footTone: 'is-positive',
            accent: 'green'
          }),
          components.renderKpiCard({
            label: 'Leads perdidos',
            value: String(stats.perdidos),
            valueId: 'leads-stat-lost',
            foot: 'Sem avanço no funil',
            footTone: 'is-warning',
            accent: 'red'
          })
        ].join('');
        return;
      }

      kpiRowEl.innerHTML = `
        <article class="crm-kpi-card accent-navy">
          <span class="crm-kpi-label">Total de leads</span>
          <strong class="crm-kpi-value" id="leads-stat-total">${stats.total}</strong>
          <span class="crm-kpi-foot">Base local demonstrativa</span>
        </article>
        <article class="crm-kpi-card accent-blue">
          <span class="crm-kpi-label">Leads novos</span>
          <strong class="crm-kpi-value" id="leads-stat-new">${stats.novos}</strong>
          <span class="crm-kpi-foot">Aguardando primeiro contato</span>
        </article>
        <article class="crm-kpi-card accent-sky">
          <span class="crm-kpi-label">Leads em atendimento</span>
          <strong class="crm-kpi-value" id="leads-stat-active">${stats.emAtendimento}</strong>
          <span class="crm-kpi-foot">Em contato, retorno e visitas</span>
        </article>
        <article class="crm-kpi-card accent-green">
          <span class="crm-kpi-label">Leads matriculados</span>
          <strong class="crm-kpi-value" id="leads-stat-converted">${stats.concluidos}</strong>
          <span class="crm-kpi-foot is-positive">Matrículas confirmadas (demo)</span>
        </article>
        <article class="crm-kpi-card accent-red">
          <span class="crm-kpi-label">Leads perdidos</span>
          <strong class="crm-kpi-value" id="leads-stat-lost">${stats.perdidos}</strong>
          <span class="crm-kpi-foot is-warning">Sem avanço no funil</span>
        </article>
      `;
    }

    function renderPagination(page, totalPages) {
      if (components && typeof components.renderPagination === 'function') {
        paginationEl.innerHTML = components.renderPagination({ page, totalPages });
        return;
      }

      if (totalPages <= 1) {
        paginationEl.innerHTML = '';
        return;
      }

      const pagesButtons = [];
      for (let p = 1; p <= totalPages; p++) {
        pagesButtons.push(`
          <button
            type="button"
            class="crm-page-btn${p === page ? ' is-active' : ''}"
            data-page="${p}"
            ${p === page ? 'aria-current="page"' : ''}
          >${p}</button>
        `);
      }

      paginationEl.innerHTML = `
        <button type="button" class="crm-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>
          Anterior
        </button>
        <div class="crm-page-numbers">${pagesButtons.join('')}</div>
        <button type="button" class="crm-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>
          Próxima
        </button>
      `;
    }

    function renderTableAndSummary() {
      const result = service.listLeads(state.filters);
      state.filters.page = result.page;
      renderKpis();

      if (result.total === 0) {
        tableScrollEl.hidden = true;
        paginationEl.innerHTML = '';
        emptyStateEl.hidden = false;

        const hasActiveFilters =
          Boolean(state.filters.search) ||
          state.filters.status !== 'todos' ||
          state.filters.stage !== 'todos' ||
          state.filters.shift !== 'todos' ||
          state.filters.origin !== 'todos' ||
          (!isAtendente && state.filters.attendant !== 'todos') ||
          Boolean(state.filters.unassignedOnly) ||
          Boolean(state.filters.withoutAttendance) ||
          state.filters.period !== 'todos';

        if (result.allStoredCount === 0) {
          emptyTitleEl.textContent = 'Nenhum lead cadastrado ainda';
          emptyDescEl.textContent =
            'Cadastre o primeiro lead pelo botão acima ou restaure os registros demonstrativos.';
          emptyClearBtn.hidden = true;
          emptyRestoreBtn.hidden = false;
        } else {
          emptyTitleEl.textContent = 'Nenhum lead encontrado';
          emptyDescEl.textContent =
            'Não há leads compatíveis com a combinação atual de pesquisa e filtros.';
          emptyClearBtn.hidden = !hasActiveFilters;
          emptyRestoreBtn.hidden = true;
        }

        resultsCounterEl.textContent = '0 leads exibidos';
        return;
      }

      tableScrollEl.hidden = false;
      emptyStateEl.hidden = true;

      const start = (result.page - 1) * result.pageSize + 1;
      const end = Math.min(result.page * result.pageSize, result.total);
      resultsCounterEl.textContent = `Mostrando ${start}–${end} de ${result.total} lead(s)`;

      tbodyEl.innerHTML = result.items
        .map((lead) => {
          const currentOwner = lead.atendente || 'Aguardando atribuição';
          const ownerCellHtml = isAtendente
            ? escapeHtml(currentOwner)
            : `<select
                  class="form-control crm-input-compact crm-inline-attendant-select${currentOwner === 'Aguardando atribuição' ? ' is-unassigned' : ''}"
                  data-action="inline-attendant"
                  data-id="${escapeHtml(lead.id)}"
                  aria-label="Atribuir responsável para ${escapeHtml(lead.nome_responsavel)}"
                >
                  <option value="Aguardando atribuição"${currentOwner === 'Aguardando atribuição' ? ' selected' : ''}>Aguardando atribuição</option>
                  ${buildAttendantOptions(service.CATALOGS.attendants, currentOwner, '')}
                </select>`;

          return `
            <tr data-lead-id="${escapeHtml(lead.id)}">
              <td>
                <div class="crm-lead-primary-cell">
                  <strong>${escapeHtml(lead.nome_responsavel)}</strong>
                  <small>${escapeHtml(lead.id)}</small>
                </div>
              </td>
              <td>${lead.nome_aluno ? escapeHtml(lead.nome_aluno) : '<span class="crm-muted-dash">—</span>'}</td>
              <td class="crm-nowrap">${escapeHtml(service.formatPhone(lead.telefone))}</td>
              <td>${escapeHtml(lead.email)}</td>
              <td>
                <div class="crm-lead-primary-cell">
                  <span>${escapeHtml(service.getStageLabel(lead.etapa_codigo))}</span>
                  <small>Turno: ${escapeHtml(service.getShiftLabel(lead.turno_codigo))}</small>
                </div>
              </td>
              <td>${escapeHtml(service.getOriginLabel(lead.origem))}</td>
              <td>${ownerCellHtml}</td>
              <td>
                <select
                  class="crm-status-badge crm-status-select status-${escapeHtml(lead.status)}"
                  data-action="inline-status"
                  data-id="${escapeHtml(lead.id)}"
                  aria-label="Alterar status de ${escapeHtml(lead.nome_responsavel)}"
                >
                  ${buildSelectOptions(service.CATALOGS.statuses, lead.status, '')}
                </select>
              </td>
              <td class="crm-nowrap">${escapeHtml(formatDateShortBr(lead.criado_em))}</td>
              <td class="crm-td-actions">
                <div class="crm-table-actions">
                  <button type="button" class="crm-table-btn" data-action="detail" data-id="${escapeHtml(lead.id)}">
                    Visualizar
                  </button>
                  <button type="button" class="crm-table-btn" data-action="edit" data-id="${escapeHtml(lead.id)}">
                    Editar
                  </button>
                  <button type="button" class="crm-table-btn crm-table-btn-danger" data-action="delete" data-id="${escapeHtml(lead.id)}">
                    Excluir
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');

      renderPagination(result.page, result.totalPages);
    }

    let lastTriggerEl = null;

    function openFormModal(leadToEdit = null) {
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      clearFormErrors();
      crudForm.reset();

      if (leadToEdit) {
        state.editingLeadId = leadToEdit.id;
        formTitle.textContent = `Editar lead (${leadToEdit.id})`;
        formSubtitle.textContent = 'Atualize as informações cadastrais, responsável e status.';
        saveLeadBtn.textContent = 'Salvar alterações';

        formFields.parentName.input.value = leadToEdit.nome_responsavel || '';
        formFields.phone.input.value = service.formatPhone(leadToEdit.telefone || '');
        formFields.email.input.value = leadToEdit.email || '';
        formFields.studentName.input.value = leadToEdit.nome_aluno || '';
        formFields.studentAge.input.value =
          leadToEdit.idade_aluno !== null && leadToEdit.idade_aluno !== undefined
            ? String(leadToEdit.idade_aluno)
            : '';
        formFields.stage.input.value = leadToEdit.etapa_codigo || '';
        formFields.shift.input.value = leadToEdit.turno_codigo || '';
        formFields.origin.input.value = leadToEdit.origem || 'site';
        if (formFields.attendant && formFields.attendant.input) {
          formFields.attendant.input.value = isAtendente
            ? scopedOwner
            : leadToEdit.atendente || 'Aguardando atribuição';
          formFields.attendant.input.disabled = isAtendente;
        }
        if (statusGroupEl && formStatusSelect) {
          statusGroupEl.hidden = false;
          formStatusSelect.value = leadToEdit.status || 'novo';
        }
        formFields.message.input.value = leadToEdit.mensagem || '';
        formFields.notes.input.value = leadToEdit.observacoes || '';
        formFields.consent.input.checked = leadToEdit.consentimento_contato !== false;
      } else {
        state.editingLeadId = null;
        formTitle.textContent = 'Novo lead';
        formSubtitle.textContent = 'Preencha os dados de contato e interesse escolar.';
        saveLeadBtn.textContent = 'Salvar lead';
        formFields.origin.input.value = 'site';
        if (formFields.attendant && formFields.attendant.input) {
          const preferred = isAtendente
            ? scopedOwner
            : service.CATALOGS.attendants.includes(session.name)
              ? session.name
              : 'Secretaria Demo';
          formFields.attendant.input.value = preferred;
          formFields.attendant.input.disabled = isAtendente;
        }
        if (statusGroupEl && formStatusSelect) {
          statusGroupEl.hidden = true;
          formStatusSelect.value = 'novo';
        }
        formFields.consent.input.checked = false;
      }

      formModal.hidden = false;
      formFields.parentName.input.focus();
    }

    function closeFormModal(restoreFocus = false) {
      formModal.hidden = true;
      state.editingLeadId = null;
      if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
        lastTriggerEl.focus();
      }
    }

    function openDeleteModal(leadId) {
      const lead = service.getLeadById(leadId);
      if (!lead) return;
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      state.deletingLeadId = lead.id;

      const studentLabel = lead.nome_aluno ? ` • Aluno(a): ${lead.nome_aluno}` : '';
      deleteSummaryEl.textContent = `Lead "${lead.nome_responsavel}" (${lead.id})${studentLabel}. Essa operação é permanente no armazenamento local.`;
      deleteModal.hidden = false;
      if (cancelDeleteBtn && typeof cancelDeleteBtn.focus === 'function') {
        cancelDeleteBtn.focus();
      }
    }

    function closeDeleteModal(restoreFocus = false) {
      deleteModal.hidden = true;
      state.deletingLeadId = null;
      if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
        lastTriggerEl.focus();
      }
    }

    function renderQuickContactActions(lead) {
      const phoneDigits = service.normalizePhoneDigits(lead.telefone);
      const validPhone = service.isValidBrazilianPhone(phoneDigits);
      const validEmail = service.isValidEmail(lead.email);

      const callAction = validPhone
        ? `<a href="tel:+55${escapeHtml(phoneDigits)}" id="btn-detail-call" class="crm-quick-action-btn">
            <span aria-hidden="true">Ligar</span>
          </a>`
        : `<span id="btn-detail-call" class="crm-quick-action-btn is-disabled" aria-disabled="true" title="Telefone inválido ou ausente">
            Ligar (indisponível)
          </span>`;

      const whatsappAction = validPhone
        ? `<a href="https://wa.me/55${escapeHtml(phoneDigits)}" target="_blank" rel="noopener noreferrer" id="btn-detail-whatsapp" class="crm-quick-action-btn is-whatsapp">
            <span>Abrir WhatsApp</span>
          </a>`
        : `<span id="btn-detail-whatsapp" class="crm-quick-action-btn is-disabled" aria-disabled="true" title="WhatsApp indisponível">
            WhatsApp (indisponível)
          </span>`;

      const emailAction = validEmail
        ? `<a href="mailto:${escapeHtml(lead.email)}" id="btn-detail-email" class="crm-quick-action-btn">
            <span>Enviar e-mail</span>
          </a>`
        : `<span id="btn-detail-email" class="crm-quick-action-btn is-disabled" aria-disabled="true" title="E-mail inválido ou ausente">
            E-mail (indisponível)
          </span>`;

      return `
        <div class="crm-detail-quick-actions" aria-label="Ações visuais de contato">
          ${callAction}
          ${whatsappAction}
          ${emailAction}
        </div>
      `;
    }

    function renderDetailModalContent(lead) {
      if (!lead) return;
      detailTitle.textContent = lead.nome_responsavel;
      detailSubtitle.textContent = `Protocolo ${lead.id} • Cadastrado em ${formatDateTimeBr(lead.criado_em)}`;

      const statusOptionsHtml = buildSelectOptions(service.CATALOGS.statuses, lead.status, '');
      const historyItemsHtml = (Array.isArray(lead.historico) ? lead.historico : [])
        .map(
          (entry) => `
            <li class="crm-history-item">
              <div class="crm-history-dot" aria-hidden="true"></div>
              <div class="crm-history-content">
                <p>${escapeHtml(entry.descricao)}</p>
                <small>${escapeHtml(entry.autor || 'Sistema')} • ${escapeHtml(formatDateTimeBr(entry.criado_em))}</small>
              </div>
            </li>
          `
        )
        .join('');

      const visitInfoRow = lead.visita_agendada_em
        ? `<div><dt>Visita agendada</dt><dd>${escapeHtml(formatDateTimeBr(lead.visita_agendada_em))}</dd></div>`
        : '';

      const consentLabel = lead.consentimento_contato !== false ? 'Confirmado' : 'Não confirmado';

      const atendService = globalScope.EnsinaAiAtendimentosService || null;
      const leadAtendCount = atendService && typeof atendService.listAtendimentos === 'function'
        ? atendService.listAtendimentos({ leadId: lead.id, pageSize: 500 }).total
        : 0;
      const tarefasService = globalScope.EnsinaAiTarefasService || null;
      const leadTarefasCount = tarefasService && typeof tarefasService.listTarefas === 'function'
        ? tarefasService.listTarefas({ leadId: lead.id, pageSize: 500 }).total
        : 0;
      const visitasService = globalScope.EnsinaAiVisitasService || null;
      const leadVisitasCount = visitasService && typeof visitasService.listVisitas === 'function'
        ? visitasService.listVisitas({ leadId: lead.id, pageSize: 500 }).total
        : 0;

      detailBody.innerHTML = `
        ${renderQuickContactActions(lead)}

        <div class="crm-detail-grid">
          <section class="crm-detail-card">
            <h4>Dados do Responsável</h4>
            <dl class="crm-detail-dl">
              <div><dt>Nome</dt><dd>${escapeHtml(lead.nome_responsavel)}</dd></div>
              <div><dt>Telefone / WhatsApp</dt><dd>${escapeHtml(service.formatPhone(lead.telefone))}</dd></div>
              <div><dt>E-mail</dt><dd>${escapeHtml(lead.email)}</dd></div>
              <div><dt>Origem</dt><dd>${escapeHtml(service.getOriginLabel(lead.origem))}</dd></div>
              <div><dt>Consentimento de contato</dt><dd>${escapeHtml(consentLabel)}</dd></div>
            </dl>
          </section>

          <section class="crm-detail-card">
            <h4>Aluno e Interesse Escolar</h4>
            <dl class="crm-detail-dl">
              <div><dt>Aluno(a)</dt><dd>${escapeHtml(lead.nome_aluno || 'Não informado')}</dd></div>
              <div><dt>Idade</dt><dd>${lead.idade_aluno ? `${escapeHtml(lead.idade_aluno)} ano(s)` : 'Não informada'}</dd></div>
              <div><dt>Etapa de ensino</dt><dd>${escapeHtml(service.getStageLabel(lead.etapa_codigo))}</dd></div>
              <div><dt>Turno desejado</dt><dd>${escapeHtml(service.getShiftLabel(lead.turno_codigo))}</dd></div>
            </dl>
            <div class="crm-detail-inline-action">
              <label>Mensagem inicial</label>
              <p class="crm-detail-notes-text" id="detail-message-preview">
                ${lead.mensagem ? escapeHtml(lead.mensagem) : 'Nenhuma mensagem registrada no cadastro.'}
              </p>
            </div>
          </section>

          <section class="crm-detail-card">
            <h4>Atendimento e Situação</h4>
            <dl class="crm-detail-dl">
              <div>
                <dt>Status atual</dt>
                <dd>
                  <span class="crm-status-badge status-${escapeHtml(lead.status)}" id="detail-current-status-badge">
                    ${escapeHtml(service.getStatusLabel(lead.status))}
                  </span>
                </dd>
              </div>
              <div><dt>Responsável pelo atendimento</dt><dd>${escapeHtml(lead.atendente || 'Aguardando atribuição')}</dd></div>
              <div><dt>Data de cadastro</dt><dd>${escapeHtml(formatDateTimeBr(lead.criado_em))}</dd></div>
              <div><dt>Última atualização</dt><dd>${escapeHtml(formatDateTimeBr(lead.atualizado_em || lead.criado_em))}</dd></div>
              ${visitInfoRow}
            </dl>

            ${
              onOpenAtendimentos || onNavigateModule
                ? `
              <div class="crm-detail-inline-action">
                <label>Módulos integrados</label>
                <div class="crm-detail-module-links">
                  ${
                    onOpenAtendimentos
                      ? `
                    <button type="button" class="btn btn-outline btn-sm" id="btn-detail-open-atendimentos">
                      Ver atendimentos (${leadAtendCount})
                    </button>
                    <button type="button" class="btn btn-primary btn-sm" id="btn-detail-new-atendimento">
                      + Novo atendimento
                    </button>
                  `
                      : ''
                  }
                  ${
                    onNavigateModule
                      ? `
                    <button type="button" class="btn btn-outline btn-sm" id="btn-detail-open-tarefas">
                      Ver tarefas (${leadTarefasCount})
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" id="btn-detail-new-tarefa">
                      + Nova tarefa
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" id="btn-detail-open-visitas">
                      Ver visitas (${leadVisitasCount})
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" id="btn-detail-new-visita">
                      + Agendar visita
                    </button>
                  `
                      : ''
                  }
                </div>
              </div>
            `
                : ''
            }

            <div class="crm-detail-inline-action">
              <label for="detail-status-select">Alterar status</label>
              <div class="crm-detail-inline-row">
                <select id="detail-status-select" class="form-control crm-input-compact">
                  ${statusOptionsHtml}
                </select>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-detail-apply-status">Aplicar</button>
              </div>
            </div>

            ${
              !isAtendente
                ? `<div class="crm-detail-inline-action">
                    <label for="detail-attendant-select">Atribuir / redistribuir responsável</label>
                    <div class="crm-detail-inline-row">
                      <select id="detail-attendant-select" class="form-control crm-input-compact">
                        <option value="Aguardando atribuição"${(lead.atendente || 'Aguardando atribuição') === 'Aguardando atribuição' ? ' selected' : ''}>Aguardando atribuição</option>
                        ${buildAttendantOptions(service.CATALOGS.attendants, lead.atendente || '', '')}
                      </select>
                      <button type="button" class="btn btn-outline btn-sm" id="btn-detail-apply-attendant">Atribuir</button>
                    </div>
                  </div>`
                : ''
            }

            <div class="crm-detail-inline-action">
              <label for="detail-visit-datetime">Agendar visita presencial</label>
              <div class="crm-detail-inline-row">
                <input
                  type="datetime-local"
                  id="detail-visit-datetime"
                  class="form-control crm-input-compact"
                  value="${escapeHtml(getDefaultVisitInputValue())}"
                  aria-describedby="error-detail-visit"
                />
                <button type="button" class="btn btn-outline btn-sm" id="btn-detail-schedule-visit">Agendar visita</button>
              </div>
              <input
                type="text"
                id="detail-visit-note"
                class="form-control crm-input-compact"
                maxlength="160"
                placeholder="Observação da visita (opcional)"
              />
              <span class="form-error-msg" id="error-detail-visit" role="alert"></span>
            </div>
          </section>

          <section class="crm-detail-card">
            <h4>Atendimento e Observações</h4>

            <div class="crm-detail-inline-action crm-detail-inline-top-clean">
              <label for="detail-interaction-channel">Registrar atendimento</label>
              <select id="detail-interaction-channel" class="form-control crm-input-compact">
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telefone">Telefone</option>
                <option value="E-mail">E-mail</option>
                <option value="Presencial">Presencial</option>
              </select>
              <textarea
                id="detail-interaction-summary"
                class="form-control form-textarea"
                rows="2"
                maxlength="400"
                placeholder="Resumo do contato realizado com o responsável..."
                aria-describedby="error-detail-interaction"
              ></textarea>
              <span class="form-error-msg" id="error-detail-interaction" role="alert"></span>
              <div class="crm-detail-obs-footer">
                <button type="button" class="btn btn-secondary btn-sm" id="btn-detail-register-interaction">
                  Registrar atendimento
                </button>
              </div>
            </div>

            <div class="crm-detail-inline-action">
              <label>Observações internas atuais</label>
              <p class="crm-detail-notes-text" id="detail-notes-preview">
                ${lead.observacoes ? escapeHtml(lead.observacoes) : 'Nenhuma observação registrada até o momento.'}
              </p>
              <label for="detail-new-observation">Registrar nova observação</label>
              <textarea
                id="detail-new-observation"
                class="form-control form-textarea"
                rows="2"
                maxlength="500"
                placeholder="Ex.: Responsável solicitou retorno após as 17h."
              ></textarea>
              <span class="form-error-msg" id="error-detail-observation" role="alert"></span>
              <div class="crm-detail-obs-footer">
                <button type="button" class="btn btn-primary btn-sm" id="btn-detail-save-observation">
                  Registrar observação
                </button>
              </div>
            </div>
          </section>
        </div>

        <section class="crm-detail-history-section" aria-label="Histórico de atividades do lead">
          <div class="crm-detail-history-head">
            <h4>Histórico de Atividades</h4>
            <span class="crm-dropdown-sub">${(lead.historico || []).length} registro(s)</span>
          </div>
          <ul class="crm-history-timeline" id="detail-history-list">
            ${historyItemsHtml}
          </ul>
        </section>
      `;

      const openAtendimentosBtn = detailBody.querySelector('#btn-detail-open-atendimentos');
      if (openAtendimentosBtn && onOpenAtendimentos) {
        openAtendimentosBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onOpenAtendimentos({ leadId: lead.id, autoOpenNewModal: false });
        });
      }

      const newAtendimentoBtn = detailBody.querySelector('#btn-detail-new-atendimento');
      if (newAtendimentoBtn && onOpenAtendimentos) {
        newAtendimentoBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onOpenAtendimentos({ leadId: lead.id, autoOpenNewModal: true });
        });
      }

      const openTarefasBtn = detailBody.querySelector('#btn-detail-open-tarefas');
      if (openTarefasBtn && onNavigateModule) {
        openTarefasBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('tarefas', { leadId: lead.id, autoOpenNewModal: false });
        });
      }

      const newTarefaBtn = detailBody.querySelector('#btn-detail-new-tarefa');
      if (newTarefaBtn && onNavigateModule) {
        newTarefaBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('tarefas', { leadId: lead.id, autoOpenNewModal: true });
        });
      }

      const openVisitasBtn = detailBody.querySelector('#btn-detail-open-visitas');
      if (openVisitasBtn && onNavigateModule) {
        openVisitasBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('visitas', { leadId: lead.id, autoOpenNewModal: false });
        });
      }

      const newVisitaBtn = detailBody.querySelector('#btn-detail-new-visita');
      if (newVisitaBtn && onNavigateModule) {
        newVisitaBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('visitas', { leadId: lead.id, autoOpenNewModal: true });
        });
      }

      const applyStatusBtn = detailBody.querySelector('#btn-detail-apply-status');
      const statusSel = detailBody.querySelector('#detail-status-select');
      if (applyStatusBtn && statusSel) {
        applyStatusBtn.addEventListener('click', () => {
          const updated = service.changeLeadStatus(lead.id, statusSel.value, actorName);
          if (updated) {
            renderDetailModalContent(updated);
            renderTableAndSummary();
            notify(`Status de "${updated.nome_responsavel}" atualizado para ${service.getStatusLabel(updated.status)}.`);
          }
        });
      }

      const applyAttendantBtn = detailBody.querySelector('#btn-detail-apply-attendant');
      const attendantModalSel = detailBody.querySelector('#detail-attendant-select');
      if (applyAttendantBtn && attendantModalSel && !isAtendente) {
        applyAttendantBtn.addEventListener('click', () => {
          const updated = service.reassignLead(lead.id, attendantModalSel.value, actorName);
          if (updated) {
            renderDetailModalContent(updated);
            renderTableAndSummary();
            notify(`Responsável de "${updated.nome_responsavel}" alterado para ${updated.atendente}.`);
          }
        });
      }

      const scheduleVisitBtn = detailBody.querySelector('#btn-detail-schedule-visit');
      const visitDtInput = detailBody.querySelector('#detail-visit-datetime');
      const visitNoteInput = detailBody.querySelector('#detail-visit-note');
      const visitErrorEl = detailBody.querySelector('#error-detail-visit');
      if (scheduleVisitBtn && visitDtInput) {
        scheduleVisitBtn.addEventListener('click', () => {
          const dtVal = visitDtInput.value.trim();
          const parsed = new Date(dtVal);
          if (!dtVal || Number.isNaN(parsed.getTime())) {
            if (visitErrorEl) {
              visitErrorEl.textContent = 'Informe uma data e horário válidos para a visita.';
              visitErrorEl.classList.add('show');
            }
            visitDtInput.classList.add('is-invalid');
            visitDtInput.focus();
            return;
          }
          const updated = service.scheduleVisit(
            lead.id,
            dtVal,
            visitNoteInput ? visitNoteInput.value.trim() : '',
            actorName
          );
          if (updated) {
            renderDetailModalContent(updated);
            renderTableAndSummary();
            notify(`Visita agendada para "${updated.nome_responsavel}" (${updated.id}).`);
          }
        });
      }

      const regInteractionBtn = detailBody.querySelector('#btn-detail-register-interaction');
      const channelSelect = detailBody.querySelector('#detail-interaction-channel');
      const interactionInput = detailBody.querySelector('#detail-interaction-summary');
      const interactionError = detailBody.querySelector('#error-detail-interaction');
      if (regInteractionBtn && interactionInput && channelSelect) {
        interactionInput.addEventListener('input', () => {
          if (interactionInput.value.trim()) {
            interactionInput.classList.remove('is-invalid');
            if (interactionError) {
              interactionError.textContent = '';
              interactionError.classList.remove('show');
            }
          }
        });

        regInteractionBtn.addEventListener('click', () => {
          const summary = interactionInput.value.trim();
          if (!summary) {
            if (interactionError) {
              interactionError.textContent = 'Descreva o atendimento realizado antes de registrar.';
              interactionError.classList.add('show');
            }
            interactionInput.classList.add('is-invalid');
            interactionInput.focus();
            return;
          }
          const updated = service.registerInteraction(lead.id, channelSelect.value, summary, actorName);
          if (updated) {
            renderDetailModalContent(updated);
            renderTableAndSummary();
            notify(`Atendimento via ${channelSelect.value} registrado para "${updated.nome_responsavel}".`);
          }
        });
      }

      const saveObsBtn = detailBody.querySelector('#btn-detail-save-observation');
      const obsInput = detailBody.querySelector('#detail-new-observation');
      const obsError = detailBody.querySelector('#error-detail-observation');
      if (saveObsBtn && obsInput) {
        obsInput.addEventListener('input', () => {
          if (obsInput.value.trim()) {
            obsInput.classList.remove('is-invalid');
            if (obsError) {
              obsError.textContent = '';
              obsError.classList.remove('show');
            }
          }
        });

        saveObsBtn.addEventListener('click', () => {
          const text = obsInput.value.trim();
          if (!text) {
            if (obsError) {
              obsError.textContent = 'Digite uma observação antes de registrar.';
              obsError.classList.add('show');
            }
            obsInput.classList.add('is-invalid');
            obsInput.focus();
            return;
          }
          const updated = service.addLeadObservation(lead.id, text, actorName);
          if (updated) {
            renderDetailModalContent(updated);
            renderTableAndSummary();
            notify(`Observação registrada no histórico de "${updated.nome_responsavel}".`);
          }
        });
      }
    }

    function openDetailModal(leadId) {
      const lead = service.getLeadById(leadId);
      if (!lead) return;
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      state.detailLeadId = lead.id;
      renderDetailModalContent(lead);
      detailModal.hidden = false;
      const closeDetailBtn = container.querySelector('#btn-close-lead-detail');
      if (closeDetailBtn && typeof closeDetailBtn.focus === 'function') {
        closeDetailBtn.focus();
      }
    }

    function closeDetailModal(restoreFocus = false) {
      detailModal.hidden = true;
      state.detailLeadId = null;
      if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
        lastTriggerEl.focus();
      }
    }

    function resetAllFilters() {
      state.filters = {
        ...DEFAULT_FILTERS,
        attendant: isAtendente ? scopedOwner : 'todos',
        unassignedOnly: false,
        withoutAttendance: false
      };
      searchInput.value = '';
      statusSelect.value = 'todos';
      stageSelect.value = 'todos';
      shiftSelect.value = 'todos';
      originSelect.value = 'todos';
      if (attendantSelect) attendantSelect.value = state.filters.attendant;
      periodSelect.value = 'todos';
      renderTableAndSummary();
    }

    if (distributionPanelEl && !isAtendente) {
      distributionPanelEl.addEventListener('click', (e) => {
        const chip = e.target.closest('button[data-dist-filter]');
        if (!chip) return;
        const mode = chip.getAttribute('data-dist-filter');
        state.filters.unassignedOnly = mode === 'unassigned';
        state.filters.withoutAttendance = mode === 'no-attendance';
        if (mode === 'unassigned') {
          state.filters.attendant = 'todos';
          if (attendantSelect) attendantSelect.value = 'todos';
        }
        state.filters.page = 1;
        renderTableAndSummary();
      });
    }

    // Eventos de Filtros e Pesquisa
    searchInput.addEventListener('input', () => {
      state.filters.search = searchInput.value.trim();
      state.filters.page = 1;
      renderTableAndSummary();
    });

    [
      [statusSelect, 'status'],
      [stageSelect, 'stage'],
      [shiftSelect, 'shift'],
      [originSelect, 'origin'],
      [attendantSelect, 'attendant'],
      [periodSelect, 'period']
    ].forEach(([el, key]) => {
      if (!el) return;
      el.addEventListener('change', () => {
        state.filters[key] = el.value;
        state.filters.page = 1;
        renderTableAndSummary();
      });
    });

    clearFiltersBtn.addEventListener('click', resetAllFilters);
    emptyClearBtn.addEventListener('click', resetAllFilters);

    emptyRestoreBtn.addEventListener('click', () => {
      service.restoreDemoLeads();
      resetAllFilters();
      notify('Dados demonstrativos restaurados no armazenamento local.');
    });

    container.querySelector('#btn-new-lead').addEventListener('click', () => openFormModal(null));
    emptyNewBtn.addEventListener('click', () => openFormModal(null));

    paginationEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      state.filters.page = Number(btn.getAttribute('data-page')) || 1;
      renderTableAndSummary();
    });

    tbodyEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action][data-id]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const leadId = btn.getAttribute('data-id');
      if (action === 'detail') {
        openDetailModal(leadId);
      } else if (action === 'edit') {
        const lead = service.getLeadById(leadId);
        if (lead) openFormModal(lead);
      } else if (action === 'delete') {
        openDeleteModal(leadId);
      }
    });

    tbodyEl.addEventListener('change', (e) => {
      const statusSel = e.target.closest('select[data-action="inline-status"][data-id]');
      if (statusSel) {
        const leadId = statusSel.getAttribute('data-id');
        const nextStatus = statusSel.value;
        const updated = service.changeLeadStatus(leadId, nextStatus, actorName);
        if (updated) {
          renderTableAndSummary();
          notify(`Status de "${updated.nome_responsavel}" alterado para ${service.getStatusLabel(updated.status)}.`);
        }
        return;
      }

      const ownerSel = e.target.closest('select[data-action="inline-attendant"][data-id]');
      if (ownerSel && !isAtendente) {
        const leadId = ownerSel.getAttribute('data-id');
        const nextOwner = ownerSel.value;
        const updated = service.reassignLead(leadId, nextOwner, actorName);
        if (updated) {
          renderTableAndSummary();
          notify(`Lead "${updated.nome_responsavel}" atribuído a ${updated.atendente}.`);
        }
      }
    });

    // Máscara e validação inline no Modal de Lead
    formFields.phone.input.addEventListener('input', () => {
      const digits = service.normalizePhoneDigits(formFields.phone.input.value);
      formFields.phone.input.value = service.formatPhone(digits);
    });

    Object.keys(formFields).forEach((key) => {
      const f = formFields[key];
      if (!f.input) return;
      f.input.addEventListener('blur', () => validateField(f));
      f.input.addEventListener('input', () => {
        if (f.input.classList.contains('is-invalid')) validateField(f);
      });
      if (f.input.tagName === 'SELECT' || f.isCheckbox) {
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
        nome_responsavel: formFields.parentName.input.value.trim(),
        telefone: service.normalizePhoneDigits(formFields.phone.input.value),
        email: formFields.email.input.value.trim().toLowerCase(),
        nome_aluno: formFields.studentName.input.value.trim(),
        idade_aluno: formFields.studentAge.input.value.trim(),
        etapa_codigo: formFields.stage.input.value,
        turno_codigo: formFields.shift.input.value,
        origem: formFields.origin.input.value,
        atendente: formFields.attendant ? formFields.attendant.input.value : actorName,
        mensagem: formFields.message.input.value.trim(),
        observacoes: formFields.notes.input.value.trim(),
        consentimento_contato: Boolean(formFields.consent.input.checked)
      };

      const editingId = state.editingLeadId;
      if (editingId) {
        if (formStatusSelect && statusGroupEl && !statusGroupEl.hidden) {
          payload.status = formStatusSelect.value;
        }
        const updated = service.updateLead(editingId, payload, actorName);
        closeFormModal();
        renderTableAndSummary();
        if (updated) {
          notify(`Alterações do lead "${updated.nome_responsavel}" (${updated.id}) salvas localmente.`);
        }
      } else {
        const created = service.createLead(payload, actorName);
        state.filters.page = 1;
        closeFormModal();
        renderTableAndSummary();
        notify(`Lead "${created.nome_responsavel}" (${created.id}) cadastrado com sucesso.`);
      }
    });

    // Controles dos Modais
    container.querySelector('#btn-close-lead-form').addEventListener('click', () => closeFormModal(true));
    container.querySelector('#btn-cancel-lead-form').addEventListener('click', () => closeFormModal(true));
    formModal.addEventListener('click', (e) => {
      if (e.target === formModal) closeFormModal(true);
    });

    container.querySelector('#btn-close-lead-detail').addEventListener('click', () => closeDetailModal(true));
    container.querySelector('#btn-detail-close-footer').addEventListener('click', () => closeDetailModal(true));
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal(true);
    });

    container.querySelector('#btn-detail-edit-lead').addEventListener('click', () => {
      const id = state.detailLeadId;
      closeDetailModal(false);
      const lead = id ? service.getLeadById(id) : null;
      if (lead) openFormModal(lead);
    });

    container.querySelector('#btn-detail-delete-lead').addEventListener('click', () => {
      const id = state.detailLeadId;
      closeDetailModal(false);
      if (id) openDeleteModal(id);
    });

    container.querySelector('#btn-close-delete-lead').addEventListener('click', () => closeDeleteModal(true));
    cancelDeleteBtn.addEventListener('click', () => closeDeleteModal(true));
    deleteModal.addEventListener('click', (e) => {
      if (e.target === deleteModal) closeDeleteModal(true);
    });

    confirmDeleteBtn.addEventListener('click', () => {
      const targetId = state.deletingLeadId;
      if (!targetId) return;
      const removed = service.deleteLead(targetId);
      closeDeleteModal(false);
      renderTableAndSummary();
      if (removed) {
        notify(`Lead "${removed.nome_responsavel}" (${removed.id}) excluído da base demonstrativa.`);
      }
    });

    if (globalScope.document && typeof globalScope.document.addEventListener === 'function') {
      if (container.__leadsEscapeHandler && typeof globalScope.document.removeEventListener === 'function') {
        globalScope.document.removeEventListener('keydown', container.__leadsEscapeHandler);
      }
      container.__leadsEscapeHandler = (e) => {
        if (e.key !== 'Escape') return;
        if (!deleteModal.hidden) {
          closeDeleteModal(true);
        } else if (!formModal.hidden) {
          closeFormModal(true);
        } else if (!detailModal.hidden) {
          closeDetailModal(true);
        }
      };
      globalScope.document.addEventListener('keydown', container.__leadsEscapeHandler);
    }

    renderTableAndSummary();
  }

  globalScope.EnsinaAiCrmLeads = Object.freeze({
    renderLeadsModule
  });
})(window);
