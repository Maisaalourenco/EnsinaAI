/**
 * ENSINA AÍ — CRM Escolar
 * Módulo de Interface de Gestão de Visitas (js/crm/visitas.js)
 * JavaScript Vanilla ES6+ — Depende exclusivamente de EnsinaAiVisitasService
 */

(function initCrmVisitasView(globalScope) {
  'use strict';

  const DEFAULT_FILTERS = Object.freeze({
    search: '',
    leadId: '',
    atendimentoId: '',
    date: '',
    period: 'todos',
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

  function renderVisitasModule(container, options = {}) {
    const service = globalScope.EnsinaAiVisitasService;
    const leadsService = globalScope.EnsinaAiLeadsService || null;
    const atendService = globalScope.EnsinaAiAtendimentosService || null;
    const tarefasService = globalScope.EnsinaAiTarefasService || null;
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
      filters: {
        ...DEFAULT_FILTERS,
        attendant: scopedOwner,
        search: String(options.initialSearch || '').trim(),
        leadId: String(options.initialLeadId || '').trim(),
        atendimentoId: String(options.initialAtendimentoId || '').trim()
      },
      editingId: null,
      detailId: null
    };

    container.innerHTML = `
      <div class="crm-visitas-module" id="crm-visitas-module">
        <!-- Cabeçalho da Página de Visitas -->
        <section class="crm-leads-header-bar">
          <div>
            <div class="crm-leads-title-row">
              <h2>${isAtendente ? 'Minhas Visitas' : 'Agenda de Visitas'}</h2>
              <span class="crm-demo-pill">Dados demonstrativos locais</span>
            </div>
            <p class="crm-leads-subtitle">
              ${
                isAtendente
                  ? 'Acompanhe as visitas sob sua responsabilidade, confirme horários com as famílias e registre comparecimentos.'
                  : 'Supervisione toda a agenda de visitas da escola, distribua acolhimentos e acompanhe comparecimentos no campus.'
              }
            </p>
          </div>
          <div class="crm-leads-header-actions">
            <button type="button" class="btn btn-primary" id="btn-new-visita">
              + Agendar visita
            </button>
          </div>
        </section>

        ${
          isAtendente
            ? `<section class="crm-role-scope-banner" id="visitas-role-scope-banner" aria-label="Escopo das visitas">
                <strong>Minha agenda:</strong>
                <span>Exibindo apenas as visitas atribuídas a ${escapeHtml(scopedOwner)}. A agenda completa da instituição fica visível no perfil Gestor Escolar.</span>
              </section>`
            : `<section class="crm-distribution-panel" id="visitas-agenda-chips" aria-label="Atalhos da agenda escolar"></section>`
        }

        <!-- Indicadores (5 KPIs) -->
        <section class="crm-leads-kpi-row" id="visitas-kpi-row" aria-label="Indicadores de visitas">
          <!-- Renderizado dinamicamente -->
        </section>

        <!-- Barra de Pesquisa e Filtros -->
        <section class="crm-filters-card" aria-label="Pesquisa e filtros de visitas">
          <div class="crm-filters-grid crm-visitas-filters-grid">
            <div class="crm-filter-field crm-filter-search">
              <label for="visitas-search-input">Pesquisar (responsável, aluno, lead ou observações)</label>
              <input
                type="search"
                id="visitas-search-input"
                class="form-control crm-input-compact"
                placeholder="Ex.: Patricia, Helena, LD-1003..."
                value="${escapeHtml(state.filters.search)}"
              />
            </div>

            <div class="crm-filter-field">
              <label for="visitas-filter-date">Data específica</label>
              <input
                type="date"
                id="visitas-filter-date"
                class="form-control crm-input-compact"
                value="${escapeHtml(state.filters.date)}"
              />
            </div>

            <div class="crm-filter-field">
              <label for="visitas-filter-period">Período</label>
              <select id="visitas-filter-period" class="form-control crm-input-compact">
                <option value="todos">Todas as datas</option>
                <option value="hoje">Hoje</option>
                <option value="futuras">Próximas visitas</option>
                <option value="7d">Janela de 7 dias</option>
                <option value="30d">Janela de 30 dias</option>
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="visitas-filter-status">Status</label>
              <select id="visitas-filter-status" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.statuses, state.filters.status, 'Todos os status')}
              </select>
            </div>

            <div class="crm-filter-field" id="visitas-filter-attendant-wrap"${isAtendente ? ' hidden' : ''}>
              <label for="visitas-filter-attendant">Responsável interno</label>
              <select id="visitas-filter-attendant" class="form-control crm-input-compact">
                ${buildAttendantOptions(service.CATALOGS.attendants, state.filters.attendant, 'Todos os responsáveis')}
              </select>
            </div>
          </div>

          <div class="crm-filters-footer">
            <div class="crm-filters-status-group">
              <span class="crm-results-counter" id="visitas-results-counter"></span>
              <div class="crm-active-lead-chip" id="visitas-context-filter-banner" hidden>
                <span id="visitas-context-filter-label"></span>
                <button type="button" class="crm-chip-clear-btn" id="btn-clear-visitas-context" aria-label="Limpar vínculo">
                  &times; Ver todas
                </button>
              </div>
            </div>
            <button type="button" class="btn btn-outline btn-sm" id="btn-clear-visitas-filters">
              Limpar filtros
            </button>
          </div>
        </section>

        <!-- Tabela e Paginação -->
        <section class="crm-panel crm-leads-table-panel" aria-label="Agenda de visitas">
          <div class="crm-table-scroll" id="visitas-table-scroll">
            <table class="crm-table crm-visitas-table">
              <thead>
                <tr>
                  <th>Responsável</th>
                  <th>Aluno</th>
                  <th>Vínculo (Lead / Atendimento)</th>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Responsável interno</th>
                  <th>Status</th>
                  <th class="crm-th-actions">Ações</th>
                </tr>
              </thead>
              <tbody id="visitas-table-tbody"></tbody>
            </table>
          </div>

          <div class="crm-empty-state" id="visitas-empty-state" hidden>
            <strong id="visitas-empty-title">Nenhuma visita encontrada</strong>
            <p id="visitas-empty-desc">
              Nenhum agendamento corresponde aos filtros aplicados.
            </p>
            <div class="crm-empty-actions">
              <button type="button" class="btn btn-outline btn-sm" id="btn-visitas-empty-clear">
                Limpar filtros
              </button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-visitas-empty-new">
                + Agendar visita
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="btn-visitas-empty-restore" hidden>
                Restaurar dados demonstrativos
              </button>
            </div>
          </div>

          <div class="crm-pagination" id="visitas-pagination" aria-label="Paginação de visitas"></div>
        </section>

        <!-- MODAL: AGENDAR / EDITAR VISITA -->
        <div
          class="crm-modal-backdrop"
          id="visita-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="visita-form-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="visita-form-modal-title">Agendar visita</h3>
                <p id="visita-form-modal-subtitle">Informe os dados da família, horário, responsável pelo acolhimento e vínculos.</p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-visita-form" aria-label="Fechar janela">&times;</button>
            </div>

            <form id="visita-crud-form" novalidate>
              <div class="crm-modal-body">
                <div class="crm-form-grid-2">
                  <div class="form-group">
                    <label for="visita-field-lead" class="form-label">
                      <span>Lead relacionado</span>
                    </label>
                    <select id="visita-field-lead" class="form-control crm-input-compact" aria-describedby="error-visita-lead"></select>
                    <span class="form-error-msg" id="error-visita-lead" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="visita-field-atendimento" class="form-label">
                      <span>Atendimento relacionado</span>
                    </label>
                    <select id="visita-field-atendimento" class="form-control crm-input-compact" aria-describedby="error-visita-atendimento"></select>
                    <span class="form-error-msg" id="error-visita-atendimento" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="visita-field-parent-name" class="form-label">
                      <span>Responsável <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="text"
                      id="visita-field-parent-name"
                      class="form-control crm-input-compact"
                      maxlength="120"
                      placeholder="Nome completo do responsável"
                      required
                      aria-describedby="error-visita-parent-name"
                    />
                    <span class="form-error-msg" id="error-visita-parent-name" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="visita-field-student-name" class="form-label">
                      <span>Aluno</span>
                    </label>
                    <input
                      type="text"
                      id="visita-field-student-name"
                      class="form-control crm-input-compact"
                      maxlength="120"
                      placeholder="Nome do(a) aluno(a)"
                      aria-describedby="error-visita-student-name"
                    />
                    <span class="form-error-msg" id="error-visita-student-name" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="visita-field-date" class="form-label">
                      <span>Data <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="date"
                      id="visita-field-date"
                      class="form-control crm-input-compact"
                      required
                      aria-describedby="error-visita-date"
                    />
                    <span class="form-error-msg" id="error-visita-date" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="visita-field-time" class="form-label">
                      <span>Horário <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="time"
                      id="visita-field-time"
                      class="form-control crm-input-compact"
                      required
                      aria-describedby="error-visita-time"
                    />
                    <span class="form-error-msg" id="error-visita-time" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="visita-field-attendant" class="form-label">
                      <span>Responsável interno <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="visita-field-attendant" class="form-control crm-input-compact" required aria-describedby="error-visita-attendant">
                      ${buildAttendantOptions(service.CATALOGS.attendants, actorName, '')}
                    </select>
                    <span class="form-error-msg" id="error-visita-attendant" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="visita-field-status" class="form-label">
                      <span>Status <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="visita-field-status" class="form-control crm-input-compact" required aria-describedby="error-visita-status">
                      ${buildSelectOptions(service.CATALOGS.statuses, 'agendada', '')}
                    </select>
                    <span class="form-error-msg" id="error-visita-status" role="alert"></span>
                  </div>
                </div>

                <div class="form-group crm-form-group-spaced">
                  <label for="visita-field-observations" class="form-label">
                    <span>Observações</span>
                  </label>
                  <textarea
                    id="visita-field-observations"
                    class="form-control form-textarea"
                    rows="3"
                    maxlength="500"
                    placeholder="Detalhes sobre espaços a apresentar, necessidades específicas ou observações..."
                    aria-describedby="error-visita-observations"
                  ></textarea>
                  <span class="form-error-msg" id="error-visita-observations" role="alert"></span>
                </div>
              </div>

              <div class="crm-modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-visita-form">Cancelar</button>
                <button type="submit" class="btn btn-primary" id="btn-save-visita">Salvar visita</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL: DETALHES DA VISITA -->
        <div
          class="crm-modal-backdrop"
          id="visita-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="visita-detail-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="visita-detail-modal-title">Detalhes da Visita</h3>
                <p id="visita-detail-modal-subtitle"></p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-visita-detail" aria-label="Fechar detalhes">&times;</button>
            </div>

            <div class="crm-modal-body" id="visita-detail-body">
              <!-- Preenchido dinamicamente -->
            </div>

            <div class="crm-modal-footer crm-modal-footer-split">
              <div class="crm-modal-footer-actions" id="visita-detail-quick-status-actions">
                <button type="button" class="btn btn-outline btn-sm" id="btn-detail-visita-confirm">Confirmar</button>
                <button type="button" class="btn btn-primary btn-sm" id="btn-detail-visita-realize">Registrar realização</button>
                <button type="button" class="btn btn-outline btn-sm" id="btn-detail-visita-cancel">Cancelar visita</button>
              </div>
              <div class="crm-modal-footer-actions">
                <button type="button" class="btn btn-outline" id="btn-detail-visita-edit">Editar</button>
                <button type="button" class="btn btn-secondary" id="btn-detail-visita-close">Fechar</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Referências
    const kpiRowEl = container.querySelector('#visitas-kpi-row');
    const agendaChipsEl = container.querySelector('#visitas-agenda-chips');
    const searchInput = container.querySelector('#visitas-search-input');
    const dateInput = container.querySelector('#visitas-filter-date');
    const periodSelect = container.querySelector('#visitas-filter-period');
    const statusSelect = container.querySelector('#visitas-filter-status');
    const attendantFilterSelect = container.querySelector('#visitas-filter-attendant');
    const clearFiltersBtn = container.querySelector('#btn-clear-visitas-filters');
    const resultsCounterEl = container.querySelector('#visitas-results-counter');
    const contextBanner = container.querySelector('#visitas-context-filter-banner');
    const contextLabel = container.querySelector('#visitas-context-filter-label');
    const clearContextBtn = container.querySelector('#btn-clear-visitas-context');

    const tableScrollEl = container.querySelector('#visitas-table-scroll');
    const tbodyEl = container.querySelector('#visitas-table-tbody');
    const emptyStateEl = container.querySelector('#visitas-empty-state');
    const emptyTitleEl = container.querySelector('#visitas-empty-title');
    const emptyDescEl = container.querySelector('#visitas-empty-desc');
    const emptyClearBtn = container.querySelector('#btn-visitas-empty-clear');
    const emptyNewBtn = container.querySelector('#btn-visitas-empty-new');
    const emptyRestoreBtn = container.querySelector('#btn-visitas-empty-restore');
    const paginationEl = container.querySelector('#visitas-pagination');

    // Modais
    const formModal = container.querySelector('#visita-form-modal');
    const formTitle = container.querySelector('#visita-form-modal-title');
    const formSubtitle = container.querySelector('#visita-form-modal-subtitle');
    const crudForm = container.querySelector('#visita-crud-form');
    const saveBtn = container.querySelector('#btn-save-visita');

    const detailModal = container.querySelector('#visita-detail-modal');
    const detailTitle = container.querySelector('#visita-detail-modal-title');
    const detailSubtitle = container.querySelector('#visita-detail-modal-subtitle');
    const detailBody = container.querySelector('#visita-detail-body');
    const detailConfirmBtn = container.querySelector('#btn-detail-visita-confirm');
    const detailRealizeBtn = container.querySelector('#btn-detail-visita-realize');
    const detailCancelBtn = container.querySelector('#btn-detail-visita-cancel');

    const formFields = {
      lead: {
        input: container.querySelector('#visita-field-lead'),
        error: container.querySelector('#error-visita-lead'),
        validate: () => ''
      },
      atendimento: {
        input: container.querySelector('#visita-field-atendimento'),
        error: container.querySelector('#error-visita-atendimento'),
        validate: () => ''
      },
      parentName: {
        input: container.querySelector('#visita-field-parent-name'),
        error: container.querySelector('#error-visita-parent-name'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return 'Informe o nome do responsável.';
          if (t.length < 3) return 'Informe pelo menos 3 caracteres.';
          return '';
        }
      },
      studentName: {
        input: container.querySelector('#visita-field-student-name'),
        error: container.querySelector('#error-visita-student-name'),
        validate: (v) => (String(v || '').trim().length > 120 ? 'Máximo de 120 caracteres.' : '')
      },
      date: {
        input: container.querySelector('#visita-field-date'),
        error: container.querySelector('#error-visita-date'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return 'Informe a data da visita.';
          if (Number.isNaN(new Date(`${t}T10:00`).getTime())) return 'Data inválida.';
          return '';
        }
      },
      time: {
        input: container.querySelector('#visita-field-time'),
        error: container.querySelector('#error-visita-time'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return 'Informe o horário da visita.';
          if (!/^\d{2}:\d{2}$/.test(t)) return 'Horário inválido.';
          return '';
        }
      },
      attendant: {
        input: container.querySelector('#visita-field-attendant'),
        error: container.querySelector('#error-visita-attendant'),
        validate: (v) => (!v ? 'Selecione o responsável interno.' : '')
      },
      status: {
        input: container.querySelector('#visita-field-status'),
        error: container.querySelector('#error-visita-status'),
        validate: (v) => (!v ? 'Selecione o status da visita.' : '')
      },
      observations: {
        input: container.querySelector('#visita-field-observations'),
        error: container.querySelector('#error-visita-observations'),
        validate: (v) => (String(v || '').trim().length > 500 ? 'Máximo de 500 caracteres.' : '')
      }
    };

    function syncContactFieldsFromLead(leadId) {
      if (!leadId || !leadsService) return;
      const liveLead = leadsService.getLeadById(leadId);
      if (liveLead) {
        formFields.parentName.input.value = liveLead.nome_responsavel || '';
        formFields.studentName.input.value = liveLead.nome_aluno || '';
        validateField(formFields.parentName);
      }
    }

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

    function renderKpis() {
      const stats = service.getStats(isAtendente ? { attendant: scopedOwner } : {});
      if (agendaChipsEl && !isAtendente) {
        agendaChipsEl.innerHTML = `
          <div class="crm-distribution-head">
            <div>
              <strong>Agenda geral de visitas da escola</strong>
              <span>Alterne rapidamente entre visitas de hoje, próximas datas ou comparecimentos concluídos.</span>
            </div>
            <div class="crm-quick-chips" role="group" aria-label="Atalhos da agenda">
              <button type="button" class="crm-quick-chip${state.filters.period === 'todos' && state.filters.status === 'todos' ? ' is-active' : ''}" data-agenda-mode="all">
                Todas (${stats.total})
              </button>
              <button type="button" class="crm-quick-chip${state.filters.period === 'hoje' ? ' is-active' : ''}" data-agenda-mode="hoje">
                Hoje (${stats.hoje})
              </button>
              <button type="button" class="crm-quick-chip${state.filters.period === 'futuras' ? ' is-active' : ''}" data-agenda-mode="futuras">
                Próximas (${stats.agendadas})
              </button>
              <button type="button" class="crm-quick-chip${state.filters.status === 'realizada' && state.filters.period === 'todos' ? ' is-active' : ''}" data-agenda-mode="realizadas">
                Realizadas (${stats.realizadas})
              </button>
            </div>
          </div>
        `;
      }
      if (components && typeof components.renderKpiCard === 'function') {
        kpiRowEl.innerHTML = [
          components.renderKpiCard({
            label: isAtendente ? 'Minhas visitas' : 'Total de visitas',
            value: String(stats.total),
            valueId: 'visitas-stat-total',
            foot: isAtendente ? `Acolhimento: ${scopedOwner}` : 'Base local demonstrativa',
            accent: 'navy'
          }),
          components.renderKpiCard({
            label: 'Agendadas',
            value: String(stats.agendadas),
            valueId: 'visitas-stat-scheduled',
            foot: 'Agendadas e confirmadas',
            accent: 'blue'
          }),
          components.renderKpiCard({
            label: 'Realizadas',
            value: String(stats.realizadas),
            valueId: 'visitas-stat-done',
            foot: 'Visitas concluídas',
            footTone: 'is-positive',
            accent: 'green'
          }),
          components.renderKpiCard({
            label: 'Canceladas',
            value: String(stats.canceladas),
            valueId: 'visitas-stat-cancelled',
            foot: 'Desmarcadas pela família/escola',
            accent: 'red'
          }),
          components.renderKpiCard({
            label: 'Visitas de hoje',
            value: String(stats.hoje),
            valueId: 'visitas-stat-today',
            foot: 'Agenda do dia atual',
            accent: 'amber'
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

    function renderPagination(page, totalPages) {
      if (components && typeof components.renderPagination === 'function') {
        paginationEl.innerHTML = components.renderPagination({ page, totalPages });
      }
    }

    function renderAll() {
      renderKpis();
      renderContextFilterBanner();

      const result = service.listVisitas(state.filters);
      state.filters.page = result.page;

      if (result.total === 0) {
        tableScrollEl.hidden = true;
        paginationEl.innerHTML = '';
        emptyStateEl.hidden = false;

        const hasActiveFilters =
          Boolean(state.filters.search) ||
          Boolean(state.filters.leadId) ||
          Boolean(state.filters.atendimentoId) ||
          Boolean(state.filters.date) ||
          state.filters.period !== 'todos' ||
          state.filters.status !== 'todos' ||
          (!isAtendente && state.filters.attendant !== 'todos');

        if (result.allStoredCount === 0) {
          emptyTitleEl.textContent = 'Nenhuma visita agendada';
          emptyDescEl.textContent = 'Agende a primeira visita ou restaure os dados demonstrativos.';
          emptyClearBtn.hidden = true;
          emptyRestoreBtn.hidden = false;
        } else {
          emptyTitleEl.textContent = 'Nenhuma visita encontrada';
          emptyDescEl.textContent = 'Nenhum agendamento corresponde aos filtros selecionados.';
          emptyClearBtn.hidden = !hasActiveFilters;
          emptyRestoreBtn.hidden = true;
        }

        resultsCounterEl.textContent = '0 visitas exibidas';
        return;
      }

      tableScrollEl.hidden = false;
      emptyStateEl.hidden = true;

      const start = (result.page - 1) * result.pageSize + 1;
      const end = Math.min(result.page * result.pageSize, result.total);
      resultsCounterEl.textContent = `Mostrando ${start}–${end} de ${result.total} visita(s)`;

      tbodyEl.innerHTML = result.items
        .map((visita) => {
          const isToday = service.isVisitToday(visita);
          const todayBadge = isToday ? '<span class="crm-today-tag">Hoje</span>' : '';
          const linkText = [
            visita.lead_id ? `Lead ${visita.lead_id}` : '',
            visita.atendimento_id ? `Atend. ${visita.atendimento_id}` : ''
          ]
            .filter(Boolean)
            .join(' • ');

          const confirmBtn =
            visita.status === 'agendada'
              ? `<button type="button" class="crm-table-btn" data-action="confirm" data-id="${escapeHtml(visita.id)}">Confirmar</button>`
              : '';
          const realizeBtn =
            visita.status === 'agendada' || visita.status === 'confirmada'
              ? `<button type="button" class="crm-table-btn crm-table-btn-success" data-action="realize" data-id="${escapeHtml(visita.id)}">Realizada</button>`
              : '';
          const cancelBtn =
            visita.status !== 'cancelada' && visita.status !== 'realizada'
              ? `<button type="button" class="crm-table-btn crm-table-btn-danger" data-action="cancel" data-id="${escapeHtml(visita.id)}">Cancelar</button>`
              : '';

          return `
            <tr data-visita-id="${escapeHtml(visita.id)}">
              <td>
                <div class="crm-lead-primary-cell">
                  <strong>${escapeHtml(visita.nome_responsavel)} ${todayBadge}</strong>
                  <small>${escapeHtml(visita.id)}</small>
                </div>
              </td>
              <td>${visita.nome_aluno ? escapeHtml(visita.nome_aluno) : '<span class="crm-muted-dash">—</span>'}</td>
              <td>
                ${
                  linkText
                    ? `<span class="crm-lead-ref-code">${escapeHtml(linkText)}</span>`
                    : '<span class="crm-muted-dash">Agendamento avulso</span>'
                }
              </td>
              <td class="crm-nowrap">${escapeHtml(formatDateBr(visita.data))}</td>
              <td class="crm-nowrap">${escapeHtml(visita.horario || '—')}</td>
              <td>${escapeHtml(visita.responsavel_interno)}</td>
              <td>
                <select
                  class="crm-status-badge crm-status-select crm-visita-status-${escapeHtml(visita.status)}"
                  data-action="inline-status"
                  data-id="${escapeHtml(visita.id)}"
                  aria-label="Alterar status da visita ${escapeHtml(visita.id)}"
                >
                  ${buildSelectOptions(service.CATALOGS.statuses, visita.status, '')}
                </select>
              </td>
              <td class="crm-td-actions">
                <div class="crm-table-actions">
                  ${confirmBtn}
                  ${realizeBtn}
                  <button type="button" class="crm-table-btn" data-action="detail" data-id="${escapeHtml(visita.id)}">
                    Visualizar
                  </button>
                  <button type="button" class="crm-table-btn" data-action="edit" data-id="${escapeHtml(visita.id)}">
                    Editar
                  </button>
                  ${cancelBtn}
                </div>
              </td>
            </tr>
          `;
        })
        .join('');

      renderPagination(result.page, result.totalPages);
    }

    let lastTriggerEl = null;

    function openFormModal(visitaToEdit = null, prefillContext = {}) {
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      clearFormErrors();
      crudForm.reset();

      if (visitaToEdit) {
        state.editingId = visitaToEdit.id;
        formTitle.textContent = `Editar visita (${visitaToEdit.id})`;
        formSubtitle.textContent = 'Atualize data, horário, status ou vínculos da visita agendada.';
        saveBtn.textContent = 'Salvar alterações';

        populateLeadAndAtendimentoSelects(visitaToEdit.lead_id || '', visitaToEdit.atendimento_id || '');
        formFields.parentName.input.value = visitaToEdit.nome_responsavel || '';
        formFields.studentName.input.value = visitaToEdit.nome_aluno || '';
        formFields.date.input.value = visitaToEdit.data || getTodayDateInput();
        formFields.time.input.value = visitaToEdit.horario || '10:00';
        formFields.attendant.input.value = isAtendente
          ? scopedOwner
          : visitaToEdit.responsavel_interno || actorName;
        formFields.attendant.input.disabled = isAtendente;
        formFields.status.input.value = visitaToEdit.status || 'agendada';
        formFields.observations.input.value = visitaToEdit.observacoes || '';
      } else {
        state.editingId = null;
        formTitle.textContent = 'Agendar visita';
        formSubtitle.textContent = 'Informe os dados da família, horário, responsável pelo acolhimento e vínculos.';
        saveBtn.textContent = 'Agendar visita';

        const preLead = prefillContext.leadId || state.filters.leadId || '';
        const preAtend = prefillContext.atendimentoId || state.filters.atendimentoId || '';
        populateLeadAndAtendimentoSelects(preLead, preAtend);
        if (preLead) {
          syncContactFieldsFromLead(preLead);
        }
        formFields.date.input.value = getTodayDateInput();
        formFields.time.input.value = '10:00';
        formFields.attendant.input.value = isAtendente
          ? scopedOwner
          : service.CATALOGS.attendants.includes(actorName)
            ? actorName
            : service.CATALOGS.attendants[0];
        formFields.attendant.input.disabled = isAtendente;
        formFields.status.input.value = 'agendada';
      }

      formModal.hidden = false;
      formFields.parentName.input.focus();
    }

    function closeFormModal(restoreFocus = false) {
      formModal.hidden = true;
      state.editingId = null;
      if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
        lastTriggerEl.focus();
      }
    }

    function renderDetailModalContent(visita) {
      if (!visita) return;
      detailTitle.textContent = `${visita.id} • ${visita.nome_responsavel}`;
      detailSubtitle.textContent = `${formatDateBr(visita.data)} às ${visita.horario} • Acolhimento: ${visita.responsavel_interno}`;

      if (detailConfirmBtn) detailConfirmBtn.hidden = visita.status !== 'agendada';
      if (detailRealizeBtn) detailRealizeBtn.hidden = visita.status === 'realizada' || visita.status === 'cancelada';
      if (detailCancelBtn) detailCancelBtn.hidden = visita.status === 'cancelada' || visita.status === 'realizada';

      const liveLead =
        visita.lead_id && leadsService && typeof leadsService.getLeadById === 'function'
          ? leadsService.getLeadById(visita.lead_id)
          : null;
      const liveAtend =
        visita.atendimento_id && atendService && typeof atendService.getAtendimentoById === 'function'
          ? atendService.getAtendimentoById(visita.atendimento_id)
          : null;
      const relatedTarefas =
        visita.lead_id && tarefasService && typeof tarefasService.listTarefas === 'function'
          ? tarefasService.listTarefas({ leadId: visita.lead_id, pageSize: 50 }).items
          : [];

      const statusOptionsHtml = buildSelectOptions(service.CATALOGS.statuses, visita.status, '');

      const historyHtml = (Array.isArray(visita.historico) ? visita.historico : [])
        .map(
          (entry) => `
            <li class="crm-history-item">
              <div class="crm-history-dot" aria-hidden="true"></div>
              <div class="crm-history-content">
                <div class="crm-timeline-head">
                  <span class="crm-channel-badge channel-registro">${escapeHtml(entry.titulo || 'Evento')}</span>
                  <time>${escapeHtml(formatDateTimeBr(entry.criado_em))}</time>
                </div>
                <p>${escapeHtml(entry.descricao)}</p>
                <small>Registrado por ${escapeHtml(entry.autor || visita.responsavel_interno)}</small>
              </div>
            </li>
          `
        )
        .join('');

      detailBody.innerHTML = `
        <div class="crm-detail-grid">
          <section class="crm-detail-card">
            <h4>Dados da Visita</h4>
            <dl class="crm-detail-dl">
              <div><dt>Responsável</dt><dd>${escapeHtml(visita.nome_responsavel)}</dd></div>
              <div><dt>Aluno(a)</dt><dd>${escapeHtml(visita.nome_aluno || 'Não informado')}</dd></div>
              <div><dt>Data e horário</dt><dd>${escapeHtml(formatDateBr(visita.data))} às ${escapeHtml(visita.horario)}</dd></div>
              <div><dt>Responsável interno</dt><dd>${escapeHtml(visita.responsavel_interno)}</dd></div>
              <div>
                <dt>Status atual</dt>
                <dd>
                  <span class="crm-status-badge crm-visita-status-${escapeHtml(visita.status)}">
                    ${escapeHtml(service.getStatusLabel(visita.status))}
                  </span>
                </dd>
              </div>
            </dl>
            <div class="crm-detail-inline-action">
              <label>Observações da visita</label>
              <p class="crm-detail-notes-text" id="detail-visita-observations-preview">
                ${visita.observacoes ? escapeHtml(visita.observacoes) : 'Nenhuma observação registrada.'}
              </p>
            </div>
          </section>

          <section class="crm-detail-card">
            <h4>Registros Relacionados</h4>
            <dl class="crm-detail-dl">
              <div>
                <dt>Lead relacionado</dt>
                <dd>${liveLead ? `${escapeHtml(liveLead.id)} — ${escapeHtml(leadsService.getStageLabel(liveLead.etapa_codigo))}` : visita.lead_id ? escapeHtml(visita.lead_id) : 'Não vinculado'}</dd>
              </div>
              <div>
                <dt>Telefone / E-mail</dt>
                <dd>${liveLead ? `${escapeHtml(leadsService.formatPhone(liveLead.telefone))} • ${escapeHtml(liveLead.email)}` : '—'}</dd>
              </div>
              <div>
                <dt>Atendimento relacionado</dt>
                <dd>${liveAtend ? `${escapeHtml(liveAtend.id)} — ${escapeHtml(atendService.getStatusLabel(liveAtend.status))}` : visita.atendimento_id ? escapeHtml(visita.atendimento_id) : 'Não vinculado'}</dd>
              </div>
              <div>
                <dt>Tarefas do lead</dt>
                <dd>${relatedTarefas.length} tarefa(s) vinculada(s)</dd>
              </div>
            </dl>

            <div class="crm-detail-inline-action">
              <label>Navegação entre módulos</label>
              <div class="crm-detail-module-links">
                ${
                  visita.lead_id && onNavigateModule
                    ? `<button type="button" class="btn btn-outline btn-sm" id="btn-detail-visita-open-lead">Ver lead (${escapeHtml(visita.lead_id)})</button>`
                    : ''
                }
                ${
                  visita.atendimento_id && onNavigateModule
                    ? `<button type="button" class="btn btn-outline btn-sm" id="btn-detail-visita-open-atendimento">Ver atendimento (${escapeHtml(visita.atendimento_id)})</button>`
                    : ''
                }
                ${
                  visita.lead_id && onNavigateModule
                    ? `<button type="button" class="btn btn-outline btn-sm" id="btn-detail-visita-open-tarefas">Ver tarefas (${relatedTarefas.length})</button>`
                    : ''
                }
              </div>
            </div>

            <div class="crm-detail-inline-action">
              <label for="detail-visita-status-select">Alterar situação</label>
              <div class="crm-detail-inline-row">
                <select id="detail-visita-status-select" class="form-control crm-input-compact">
                  ${statusOptionsHtml}
                </select>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-detail-visita-apply-status">Aplicar</button>
              </div>
            </div>
          </section>
        </div>

        <section class="crm-detail-history-section" aria-label="Histórico da visita">
          <div class="crm-detail-history-head">
            <h4>Histórico da Visita</h4>
            <span class="crm-dropdown-sub">${(visita.historico || []).length} registro(s)</span>
          </div>
          <ul class="crm-history-timeline">
            ${historyHtml}
          </ul>
        </section>
      `;

      const applyStatusBtn = detailBody.querySelector('#btn-detail-visita-apply-status');
      const statusSel = detailBody.querySelector('#detail-visita-status-select');
      if (applyStatusBtn && statusSel) {
        applyStatusBtn.addEventListener('click', () => {
          const updated = service.changeVisitaStatus(visita.id, statusSel.value, actorName);
          if (updated) {
            renderDetailModalContent(updated);
            renderAll();
            notify(`Status da visita ${updated.id} alterado para ${service.getStatusLabel(updated.status)}.`);
          }
        });
      }

      const openLeadBtn = detailBody.querySelector('#btn-detail-visita-open-lead');
      if (openLeadBtn && onNavigateModule) {
        openLeadBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('leads', { search: visita.lead_id });
        });
      }

      const openAtendBtn = detailBody.querySelector('#btn-detail-visita-open-atendimento');
      if (openAtendBtn && onNavigateModule) {
        openAtendBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('atendimentos', { leadId: visita.lead_id || '', search: visita.atendimento_id });
        });
      }

      const openTarefasBtn = detailBody.querySelector('#btn-detail-visita-open-tarefas');
      if (openTarefasBtn && onNavigateModule) {
        openTarefasBtn.addEventListener('click', () => {
          closeDetailModal(false);
          onNavigateModule('tarefas', { leadId: visita.lead_id });
        });
      }
    }

    function openDetailModal(id) {
      const visita = service.getVisitaById(id);
      if (!visita) return;
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      state.detailId = visita.id;
      renderDetailModalContent(visita);
      detailModal.hidden = false;
      const closeBtn = container.querySelector('#btn-close-visita-detail');
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
      dateInput.value = '';
      periodSelect.value = 'todos';
      statusSelect.value = 'todos';
      attendantFilterSelect.value = state.filters.attendant;
      renderAll();
    }

    if (agendaChipsEl && !isAtendente) {
      agendaChipsEl.addEventListener('click', (e) => {
        const chip = e.target.closest('button[data-agenda-mode]');
        if (!chip) return;
        const mode = chip.getAttribute('data-agenda-mode');
        state.filters.date = '';
        dateInput.value = '';
        if (mode === 'all') {
          state.filters.period = 'todos';
          state.filters.status = 'todos';
        } else if (mode === 'hoje') {
          state.filters.period = 'hoje';
          state.filters.status = 'todos';
        } else if (mode === 'futuras') {
          state.filters.period = 'futuras';
          state.filters.status = 'todos';
        } else if (mode === 'realizadas') {
          state.filters.period = 'todos';
          state.filters.status = 'realizada';
        }
        periodSelect.value = state.filters.period;
        statusSelect.value = state.filters.status;
        state.filters.page = 1;
        renderAll();
      });
    }

    // Eventos de Pesquisa e Filtros
    searchInput.addEventListener('input', () => {
      state.filters.search = searchInput.value.trim();
      state.filters.page = 1;
      renderAll();
    });

    dateInput.addEventListener('change', () => {
      state.filters.date = dateInput.value;
      state.filters.page = 1;
      renderAll();
    });

    [
      [periodSelect, 'period'],
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
      service.restoreDemoVisitas();
      resetAllFilters();
      notify('Visitas demonstrativas restauradas no armazenamento local.');
    });

    container.querySelector('#btn-new-visita').addEventListener('click', () => openFormModal(null));
    emptyNewBtn.addEventListener('click', () => openFormModal(null));

    paginationEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-page]');
      if (!btn || btn.disabled) return;
      state.filters.page = Number(btn.getAttribute('data-page')) || 1;
      renderAll();
    });

    tbodyEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action][data-id]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'detail') {
        openDetailModal(id);
      } else if (action === 'edit') {
        const visita = service.getVisitaById(id);
        if (visita) openFormModal(visita);
      } else if (action === 'confirm') {
        const updated = service.changeVisitaStatus(id, 'confirmada', actorName);
        if (updated) {
          renderAll();
          notify(`Visita ${updated.id} confirmada.`);
        }
      } else if (action === 'realize') {
        const updated = service.changeVisitaStatus(id, 'realizada', actorName);
        if (updated) {
          renderAll();
          notify(`Visita ${updated.id} registrada como realizada.`);
        }
      } else if (action === 'cancel') {
        const updated = service.changeVisitaStatus(id, 'cancelada', actorName);
        if (updated) {
          renderAll();
          notify(`Visita ${updated.id} cancelada.`);
        }
      }
    });

    tbodyEl.addEventListener('change', (e) => {
      const sel = e.target.closest('select[data-action="inline-status"][data-id]');
      if (!sel) return;
      const id = sel.getAttribute('data-id');
      const updated = service.changeVisitaStatus(id, sel.value, actorName);
      if (updated) {
        renderAll();
        notify(`Status da visita ${updated.id} alterado para ${service.getStatusLabel(updated.status)}.`);
      }
    });

    // Sincronizar Lead -> Contato e Atendimento
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
      if (!state.editingId && chosenLead) {
        syncContactFieldsFromLead(chosenLead);
      }
    });

    formFields.atendimento.input.addEventListener('change', () => {
      const chosenAtend = formFields.atendimento.input.value;
      if (!chosenAtend || !atendService) return;
      const atendObj = atendService.getAtendimentoById(chosenAtend);
      if (atendObj) {
        if (atendObj.lead_id && !formFields.lead.input.value) {
          formFields.lead.input.value = atendObj.lead_id;
        }
        if (!formFields.parentName.input.value.trim()) {
          formFields.parentName.input.value = atendObj.nome_responsavel || '';
          formFields.studentName.input.value = atendObj.nome_aluno || '';
          validateField(formFields.parentName);
        }
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
        lead_id: formFields.lead.input.value,
        atendimento_id: formFields.atendimento.input.value,
        nome_responsavel: formFields.parentName.input.value.trim(),
        nome_aluno: formFields.studentName.input.value.trim(),
        data: formFields.date.input.value,
        horario: formFields.time.input.value,
        responsavel_interno: formFields.attendant.input.value,
        status: formFields.status.input.value,
        observacoes: formFields.observations.input.value.trim()
      };

      const editingId = state.editingId;
      if (editingId) {
        const updated = service.updateVisita(editingId, payload, actorName);
        closeFormModal();
        renderAll();
        if (updated) {
          notify(`Visita ${updated.id} atualizada.`);
        }
      } else {
        const created = service.createVisita(payload, actorName);
        state.filters.page = 1;
        closeFormModal();
        renderAll();
        notify(`Visita ${created.id} agendada para ${created.nome_responsavel}.`);
      }
    });

    // Controles dos Modais
    container.querySelector('#btn-close-visita-form').addEventListener('click', () => closeFormModal(true));
    container.querySelector('#btn-cancel-visita-form').addEventListener('click', () => closeFormModal(true));
    formModal.addEventListener('click', (e) => {
      if (e.target === formModal) closeFormModal(true);
    });

    container.querySelector('#btn-close-visita-detail').addEventListener('click', () => closeDetailModal(true));
    container.querySelector('#btn-detail-visita-close').addEventListener('click', () => closeDetailModal(true));
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal(true);
    });

    container.querySelector('#btn-detail-visita-edit').addEventListener('click', () => {
      const id = state.detailId;
      closeDetailModal(false);
      const visita = id ? service.getVisitaById(id) : null;
      if (visita) openFormModal(visita);
    });

    function handleDetailQuickStatus(nextStatus, toastMsg) {
      const id = state.detailId;
      if (!id) return;
      const updated = service.changeVisitaStatus(id, nextStatus, actorName);
      if (updated) {
        renderDetailModalContent(updated);
        renderAll();
        notify(toastMsg(updated));
      }
    }

    if (detailConfirmBtn) {
      detailConfirmBtn.addEventListener('click', () =>
        handleDetailQuickStatus('confirmada', (u) => `Visita ${u.id} confirmada.`)
      );
    }
    if (detailRealizeBtn) {
      detailRealizeBtn.addEventListener('click', () =>
        handleDetailQuickStatus('realizada', (u) => `Visita ${u.id} registrada como realizada.`)
      );
    }
    if (detailCancelBtn) {
      detailCancelBtn.addEventListener('click', () =>
        handleDetailQuickStatus('cancelada', (u) => `Visita ${u.id} cancelada.`)
      );
    }

    if (globalScope.document && typeof globalScope.document.addEventListener === 'function') {
      if (container.__visitasEscapeHandler && typeof globalScope.document.removeEventListener === 'function') {
        globalScope.document.removeEventListener('keydown', container.__visitasEscapeHandler);
      }
      container.__visitasEscapeHandler = (e) => {
        if (e.key !== 'Escape') return;
        if (!formModal.hidden) closeFormModal(true);
        else if (!detailModal.hidden) closeDetailModal(true);
      };
      globalScope.document.addEventListener('keydown', container.__visitasEscapeHandler);
    }

    renderAll();

    if (options.autoOpenNewModal) {
      openFormModal(null, {
        leadId: state.filters.leadId,
        atendimentoId: state.filters.atendimentoId
      });
    }
  }

  globalScope.EnsinaAiCrmVisitas = Object.freeze({
    renderVisitasModule
  });
})(window);
