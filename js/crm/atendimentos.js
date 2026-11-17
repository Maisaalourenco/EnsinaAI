/**
 * ENSINA AÍ — CRM Escolar
 * Módulo de Interface de Gestão de Atendimentos (js/crm/atendimentos.js)
 * JavaScript Vanilla ES6+ — Depende exclusivamente de EnsinaAiAtendimentosService
 */

(function initCrmAtendimentosView(globalScope) {
  'use strict';

  const DEFAULT_FILTERS = Object.freeze({
    search: '',
    period: 'todos',
    attendant: 'todos',
    channel: 'todos',
    status: 'todos',
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
    if (!isoString) return '—';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return '—';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yyyy = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  function toDatetimeLocalValue(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function getNowDatetimeLocal() {
    return toDatetimeLocalValue(new Date().toISOString());
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

  function renderAtendimentosModule(container, options = {}) {
    const service = globalScope.EnsinaAiAtendimentosService;
    const leadsService = globalScope.EnsinaAiLeadsService || null;
    const components = globalScope.EnsinaAiCrmComponents || null;
    if (!container || !service) return;

    const session = options.session || {
      role: 'gestor',
      roleLabel: 'Gestor Escolar',
      name: 'Coordenação Demo'
    };
    const actorName = session.name || 'Secretaria Demo';
    const notify = typeof options.onToast === 'function' ? options.onToast : () => {};

    const defaultPanelAttendant =
      session.role === 'atendente' ? session.name : 'Secretaria Demo';

    const state = {
      filters: {
        ...DEFAULT_FILTERS
      },
      selectedAttendantPanel: defaultPanelAttendant,
      editingId: null,
      detailId: null
    };

    container.innerHTML = `
      <div class="crm-atendimentos-module" id="crm-atendimentos-module">
        <!-- Cabeçalho da Página de Atendimentos -->
        <section class="crm-leads-header-bar">
          <div>
            <div class="crm-leads-title-row">
              <h2>Atendimentos</h2>
              <span class="crm-demo-pill">Persistência local demonstrativa</span>
            </div>
            <p class="crm-leads-subtitle">
              Acompanhe todas as interações com famílias, registre atendimentos e notas internas, defina próximas ações e monitore a produtividade da equipe.
            </p>
          </div>
          <div class="crm-leads-header-actions">
            <button type="button" class="btn btn-primary" id="btn-new-atendimento">
              + Novo atendimento
            </button>
          </div>
        </section>

        <!-- Indicadores Gerais de Atendimentos -->
        <section class="crm-leads-kpi-row" id="atendimentos-kpi-row" aria-label="Indicadores de atendimentos">
          <!-- Renderizado dinamicamente -->
        </section>

        <!-- Painel de Produtividade do Atendente -->
        <section class="crm-panel crm-attendant-panel" id="crm-attendant-panel" aria-label="Painel do atendente">
          <div class="crm-panel-header">
            <div>
              <div class="crm-attendant-heading-row">
                <h3 class="crm-panel-title">Painel do atendente</h3>
                <span class="crm-badge-chip visita" id="attendant-role-context-badge">
                  ${escapeHtml(session.roleLabel)} (Demo)
                </span>
              </div>
              <p class="crm-panel-subtitle" id="attendant-panel-subtitle">
                Visão de produtividade preparada para permissões reais via back-end.
              </p>
            </div>

            <div class="crm-attendant-controls">
              <label for="attendant-panel-select" class="sr-only">Selecionar atendente</label>
              <select
                id="attendant-panel-select"
                class="form-control crm-input-compact"
                ${session.role === 'atendente' ? 'disabled title="No perfil Atendente, exibe apenas a própria carteira (simulação de permissão)"' : ''}
              >
                ${buildAttendantOptions(service.CATALOGS.attendants, state.selectedAttendantPanel, '')}
              </select>
              <button type="button" class="btn btn-outline btn-sm" id="btn-attendant-filter-table">
                Filtrar meus atendimentos
              </button>
            </div>
          </div>

          <div class="crm-attendant-grid" id="attendant-panel-metrics">
            <!-- Métricas e últimas atividades do atendente -->
          </div>
        </section>

        <!-- Barra de Pesquisa e Filtros -->
        <section class="crm-filters-card" aria-label="Pesquisa e filtros de atendimentos">
          <div class="crm-filters-grid crm-atend-filters-grid">
            <div class="crm-filter-field crm-filter-search">
              <label for="atend-search-input">Pesquisar (lead, responsável, aluno ou descrição)</label>
              <input
                type="search"
                id="atend-search-input"
                class="form-control crm-input-compact"
                placeholder="Ex.: LD-1001, Mariana, Sofia, visita..."
                value="${escapeHtml(state.filters.search)}"
              />
            </div>

            <div class="crm-filter-field">
              <label for="atend-filter-period">Período</label>
              <select id="atend-filter-period" class="form-control crm-input-compact">
                <option value="todos">Todo o período</option>
                <option value="hoje">Hoje</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="atend-filter-attendant">Responsável</label>
              <select id="atend-filter-attendant" class="form-control crm-input-compact">
                ${buildAttendantOptions(service.CATALOGS.attendants, state.filters.attendant, 'Todos os responsáveis')}
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="atend-filter-channel">Canal</label>
              <select id="atend-filter-channel" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.channels, state.filters.channel, 'Todos os canais')}
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="atend-filter-status">Status</label>
              <select id="atend-filter-status" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.statuses, state.filters.status, 'Todos os status')}
              </select>
            </div>
          </div>

          <div class="crm-filters-footer">
            <span class="crm-results-counter" id="atend-results-counter"></span>
            <button type="button" class="btn btn-outline btn-sm" id="btn-clear-atend-filters">
              Limpar filtros
            </button>
          </div>
        </section>

        <!-- Tabela e Paginação -->
        <section class="crm-panel crm-leads-table-panel" aria-label="Listagem de atendimentos">
          <div class="crm-table-scroll" id="atend-table-scroll">
            <table class="crm-table crm-atendimentos-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Responsável</th>
                  <th>Aluno(a)</th>
                  <th>Responsável pelo atendimento</th>
                  <th>Canal</th>
                  <th>Data e horário</th>
                  <th>Status</th>
                  <th>Última atualização</th>
                  <th class="crm-th-actions">Ações</th>
                </tr>
              </thead>
              <tbody id="atend-table-tbody"></tbody>
            </table>
          </div>

          <div class="crm-empty-state" id="atend-empty-state" hidden>
            <strong id="atend-empty-title">Nenhum atendimento encontrado</strong>
            <p id="atend-empty-desc">
              Nenhum registro corresponde aos filtros aplicados.
            </p>
            <div class="crm-empty-actions">
              <button type="button" class="btn btn-outline btn-sm" id="btn-atend-empty-clear">
                Limpar filtros
              </button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-atend-empty-new">
                + Novo atendimento
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="btn-atend-empty-restore" hidden>
                Restaurar dados demonstrativos
              </button>
            </div>
          </div>

          <div class="crm-pagination" id="atend-pagination" aria-label="Paginação de atendimentos"></div>
        </section>

        <!-- MODAL: NOVO / EDITAR ATENDIMENTO -->
        <div
          class="crm-modal-backdrop"
          id="atend-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="atend-form-modal-title"
          hidden
        >
          <div class="crm-modal-dialog">
            <div class="crm-modal-header">
              <div>
                <h3 id="atend-form-modal-title">Novo atendimento</h3>
                <p id="atend-form-modal-subtitle">Registre uma interação, resultado e próxima ação com a família.</p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-atend-form" aria-label="Fechar janela">&times;</button>
            </div>

            <form id="atend-crud-form" novalidate>
              <div class="crm-modal-body">
                <div class="crm-form-grid-2">
                  <div class="form-group">
                    <label for="atend-field-lead" class="form-label">
                      <span>Lead relacionado <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="atend-field-lead" class="form-control crm-input-compact" required aria-describedby="error-atend-lead"></select>
                    <span class="form-error-msg" id="error-atend-lead" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="atend-field-channel" class="form-label">
                      <span>Tipo de atendimento <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="atend-field-channel" class="form-control crm-input-compact" required aria-describedby="error-atend-channel">
                      ${buildSelectOptions(service.CATALOGS.channels, 'whatsapp', '')}
                    </select>
                    <span class="form-error-msg" id="error-atend-channel" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="atend-field-attendant" class="form-label">
                      <span>Responsável <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="atend-field-attendant" class="form-control crm-input-compact" required aria-describedby="error-atend-attendant">
                      ${buildAttendantOptions(service.CATALOGS.attendants, actorName, '')}
                    </select>
                    <span class="form-error-msg" id="error-atend-attendant" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="atend-field-datetime" class="form-label">
                      <span>Data e horário <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <input
                      type="datetime-local"
                      id="atend-field-datetime"
                      class="form-control crm-input-compact"
                      required
                      aria-describedby="error-atend-datetime"
                    />
                    <span class="form-error-msg" id="error-atend-datetime" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="atend-field-status" class="form-label">
                      <span>Status <span class="required-star" aria-hidden="true">*</span></span>
                    </label>
                    <select id="atend-field-status" class="form-control crm-input-compact" required aria-describedby="error-atend-status">
                      ${buildSelectOptions(service.CATALOGS.statuses, 'em_andamento', '')}
                    </select>
                    <span class="form-error-msg" id="error-atend-status" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="atend-field-return-date" class="form-label">
                      <span>Data de retorno</span>
                    </label>
                    <input
                      type="datetime-local"
                      id="atend-field-return-date"
                      class="form-control crm-input-compact"
                      aria-describedby="error-atend-return-date"
                    />
                    <span class="form-error-msg" id="error-atend-return-date" role="alert"></span>
                  </div>
                </div>

                <div class="form-group">
                  <label for="atend-field-description" class="form-label">
                    <span>Descrição do atendimento <span class="required-star" aria-hidden="true">*</span></span>
                  </label>
                  <textarea
                    id="atend-field-description"
                    class="form-control form-textarea"
                    rows="3"
                    maxlength="600"
                    placeholder="Descreva os principais pontos tratados com o responsável..."
                    required
                    aria-describedby="error-atend-description"
                  ></textarea>
                  <span class="form-error-msg" id="error-atend-description" role="alert"></span>
                </div>

                <div class="crm-form-grid-2" style="margin-top: 0.9rem;">
                  <div class="form-group">
                    <label for="atend-field-result" class="form-label">
                      <span>Resultado</span>
                    </label>
                    <input
                      type="text"
                      id="atend-field-result"
                      class="form-control crm-input-compact"
                      maxlength="200"
                      placeholder="Ex.: Visita solicitada / Aguardando análise"
                      aria-describedby="error-atend-result"
                    />
                    <span class="form-error-msg" id="error-atend-result" role="alert"></span>
                  </div>

                  <div class="form-group">
                    <label for="atend-field-next-action" class="form-label">
                      <span>Próxima ação</span>
                    </label>
                    <input
                      type="text"
                      id="atend-field-next-action"
                      class="form-control crm-input-compact"
                      maxlength="200"
                      placeholder="Ex.: Confirmar horário da visita por WhatsApp"
                      aria-describedby="error-atend-next-action"
                    />
                    <span class="form-error-msg" id="error-atend-next-action" role="alert"></span>
                  </div>
                </div>
              </div>

              <div class="crm-modal-footer">
                <button type="button" class="btn btn-outline" id="btn-cancel-atend-form">Cancelar</button>
                <button type="submit" class="btn btn-primary" id="btn-save-atend">Salvar atendimento</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL: DETALHES DO ATENDIMENTO E LINHA DO TEMPO -->
        <div
          class="crm-modal-backdrop"
          id="atend-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="atend-detail-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="atend-detail-modal-title">Detalhes do Atendimento</h3>
                <p id="atend-detail-modal-subtitle"></p>
              </div>
              <button type="button" class="crm-modal-close" id="btn-close-atend-detail" aria-label="Fechar detalhes">&times;</button>
            </div>

            <div class="crm-modal-body" id="atend-detail-body">
              <!-- Preenchido dinamicamente -->
            </div>

            <div class="crm-modal-footer">
              <button type="button" class="btn btn-outline" id="btn-detail-atend-edit">Editar atendimento</button>
              <button type="button" class="btn btn-secondary" id="btn-detail-atend-close">Fechar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Referências da página
    const kpiRowEl = container.querySelector('#atendimentos-kpi-row');
    const attendantSelectEl = container.querySelector('#attendant-panel-select');
    const attendantFilterBtn = container.querySelector('#btn-attendant-filter-table');
    const attendantMetricsEl = container.querySelector('#attendant-panel-metrics');
    const attendantSubtitleEl = container.querySelector('#attendant-panel-subtitle');

    const searchInput = container.querySelector('#atend-search-input');
    const periodSelect = container.querySelector('#atend-filter-period');
    const attendantFilterSelect = container.querySelector('#atend-filter-attendant');
    const channelSelect = container.querySelector('#atend-filter-channel');
    const statusSelect = container.querySelector('#atend-filter-status');
    const clearFiltersBtn = container.querySelector('#btn-clear-atend-filters');
    const resultsCounterEl = container.querySelector('#atend-results-counter');

    const tableScrollEl = container.querySelector('#atend-table-scroll');
    const tbodyEl = container.querySelector('#atend-table-tbody');
    const emptyStateEl = container.querySelector('#atend-empty-state');
    const emptyTitleEl = container.querySelector('#atend-empty-title');
    const emptyDescEl = container.querySelector('#atend-empty-desc');
    const emptyClearBtn = container.querySelector('#btn-atend-empty-clear');
    const emptyNewBtn = container.querySelector('#btn-atend-empty-new');
    const emptyRestoreBtn = container.querySelector('#btn-atend-empty-restore');
    const paginationEl = container.querySelector('#atend-pagination');

    // Modal Form
    const formModal = container.querySelector('#atend-form-modal');
    const formTitle = container.querySelector('#atend-form-modal-title');
    const formSubtitle = container.querySelector('#atend-form-modal-subtitle');
    const crudForm = container.querySelector('#atend-crud-form');
    const saveAtendBtn = container.querySelector('#btn-save-atend');

    const formFields = {
      lead: {
        input: container.querySelector('#atend-field-lead'),
        error: container.querySelector('#error-atend-lead'),
        validate: (v) => (!v ? 'Selecione o lead relacionado.' : '')
      },
      channel: {
        input: container.querySelector('#atend-field-channel'),
        error: container.querySelector('#error-atend-channel'),
        validate: (v) => (!v ? 'Selecione o tipo de atendimento.' : '')
      },
      attendant: {
        input: container.querySelector('#atend-field-attendant'),
        error: container.querySelector('#error-atend-attendant'),
        validate: (v) => (!v ? 'Selecione o responsável pelo atendimento.' : '')
      },
      datetime: {
        input: container.querySelector('#atend-field-datetime'),
        error: container.querySelector('#error-atend-datetime'),
        validate: (v) => {
          const val = String(v || '').trim();
          if (!val) return 'Informe a data e o horário do atendimento.';
          if (Number.isNaN(new Date(val).getTime())) return 'Informe uma data e horário válidos.';
          return '';
        }
      },
      status: {
        input: container.querySelector('#atend-field-status'),
        error: container.querySelector('#error-atend-status'),
        validate: (v) => (!v ? 'Selecione o status do atendimento.' : '')
      },
      returnDate: {
        input: container.querySelector('#atend-field-return-date'),
        error: container.querySelector('#error-atend-return-date'),
        validate: (v) => {
          const val = String(v || '').trim();
          if (!val) return '';
          if (Number.isNaN(new Date(val).getTime())) return 'Data de retorno inválida.';
          return '';
        }
      },
      description: {
        input: container.querySelector('#atend-field-description'),
        error: container.querySelector('#error-atend-description'),
        validate: (v) => {
          const t = String(v || '').trim();
          if (!t) return 'Informe a descrição do atendimento.';
          if (t.length < 5) return 'Descreva com pelo menos 5 caracteres.';
          return '';
        }
      },
      result: {
        input: container.querySelector('#atend-field-result'),
        error: container.querySelector('#error-atend-result'),
        validate: (v) => (String(v || '').trim().length > 200 ? 'Máximo de 200 caracteres.' : '')
      },
      nextAction: {
        input: container.querySelector('#atend-field-next-action'),
        error: container.querySelector('#error-atend-next-action'),
        validate: (v) => (String(v || '').trim().length > 200 ? 'Máximo de 200 caracteres.' : '')
      }
    };

    // Modal Detalhes
    const detailModal = container.querySelector('#atend-detail-modal');
    const detailTitle = container.querySelector('#atend-detail-modal-title');
    const detailSubtitle = container.querySelector('#atend-detail-modal-subtitle');
    const detailBody = container.querySelector('#atend-detail-body');

    function populateLeadSelect(selectedLeadId = '') {
      const leadOpts = service.getLeadOptions();
      const optsHtml = [
        '<option value="">Selecione o lead...</option>',
        ...leadOpts.map(
          (l) =>
            `<option value="${escapeHtml(l.id)}"${
              l.id === selectedLeadId ? ' selected' : ''
            }>${escapeHtml(l.label)}</option>`
        )
      ].join('');
      formFields.lead.input.innerHTML = optsHtml;
      if (selectedLeadId) {
        formFields.lead.input.value = selectedLeadId;
      }
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
      const stats = service.getStats();
      if (components && typeof components.renderKpiCard === 'function') {
        kpiRowEl.innerHTML = [
          components.renderKpiCard({
            label: 'Total de atendimentos',
            value: String(stats.total),
            valueId: 'atend-stat-total',
            foot: 'Registros demonstrativos',
            accent: 'navy'
          }),
          components.renderKpiCard({
            label: 'Em andamento',
            value: String(stats.emAndamento),
            valueId: 'atend-stat-active',
            foot: 'Conversas ativas com famílias',
            accent: 'blue'
          }),
          components.renderKpiCard({
            label: 'Aguardando retorno',
            value: String(stats.aguardandoRetorno),
            valueId: 'atend-stat-waiting',
            foot: 'Follow-ups programados',
            accent: 'amber'
          }),
          components.renderKpiCard({
            label: 'Concluídos',
            value: String(stats.concluidos),
            valueId: 'atend-stat-done',
            foot: 'Finalizados (demo)',
            footTone: 'is-positive',
            accent: 'green'
          })
        ].join('');
        return;
      }

      kpiRowEl.innerHTML = `
        <article class="crm-kpi-card accent-navy">
          <span class="crm-kpi-label">Total de atendimentos</span>
          <strong class="crm-kpi-value" id="atend-stat-total">${stats.total}</strong>
        </article>
        <article class="crm-kpi-card accent-blue">
          <span class="crm-kpi-label">Em andamento</span>
          <strong class="crm-kpi-value" id="atend-stat-active">${stats.emAndamento}</strong>
        </article>
        <article class="crm-kpi-card accent-amber">
          <span class="crm-kpi-label">Aguardando retorno</span>
          <strong class="crm-kpi-value" id="atend-stat-waiting">${stats.aguardandoRetorno}</strong>
        </article>
        <article class="crm-kpi-card accent-green">
          <span class="crm-kpi-label">Concluídos</span>
          <strong class="crm-kpi-value" id="atend-stat-done">${stats.concluidos}</strong>
        </article>
      `;
    }

    function renderAttendantPanel() {
      const summary = service.getAttendantSummary(state.selectedAttendantPanel, session);

      if (attendantSubtitleEl) {
        attendantSubtitleEl.textContent = summary.permissionContext.canSelectOtherAttendants
          ? `Produtividade demonstrativa de ${summary.attendantName} • Visão gerencial preparada para RBAC futuro.`
          : `Carteira vinculada ao perfil ativo (${summary.attendantName}) • Visão individual preparada para permissões reais.`;
      }

      const recentHtml = summary.ultimasAtividades.length
        ? summary.ultimasAtividades
            .map(
              (act) => `
                <li class="crm-attendant-activity-item">
                  <button type="button" class="crm-attendant-activity-btn" data-open-atendimento="${escapeHtml(act.atendimentoId)}">
                    <div>
                      <strong>${escapeHtml(act.titulo)} • ${escapeHtml(act.responsavelLead)}</strong>
                      <p>${escapeHtml(act.descricao)}</p>
                    </div>
                    <time>${escapeHtml(formatDateTimeBr(act.criado_em))}</time>
                  </button>
                </li>
              `
            )
            .join('')
        : '<li class="crm-attendant-empty">Nenhuma atividade registrada para este atendente.</li>';

      attendantMetricsEl.innerHTML = `
        <div class="crm-attendant-kpis">
          <article class="crm-mini-stat">
            <span>Leads sob responsabilidade</span>
            <strong id="attendant-stat-leads">${summary.leadsResponsavel}</strong>
          </article>
          <article class="crm-mini-stat">
            <span>Atendimentos realizados</span>
            <strong id="attendant-stat-realized">${summary.atendimentosRealizados}</strong>
          </article>
          <article class="crm-mini-stat">
            <span>Atendimentos pendentes</span>
            <strong id="attendant-stat-pending">${summary.atendimentosPendentes}</strong>
          </article>
          <article class="crm-mini-stat${summary.retornosAtrasados > 0 ? ' is-alert' : ''}">
            <span>Retornos atrasados</span>
            <strong id="attendant-stat-overdue">${summary.retornosAtrasados}</strong>
          </article>
          <article class="crm-mini-stat">
            <span>Visitas agendadas</span>
            <strong id="attendant-stat-visits">${summary.visitasAgendadas}</strong>
          </article>
        </div>

        <div class="crm-attendant-recent">
          <div class="crm-attendant-recent-head">
            <h4>Últimas atividades de ${escapeHtml(summary.attendantName)}</h4>
            <span class="crm-dropdown-sub">${summary.ultimasAtividades.length} recente(s)</span>
          </div>
          <ul class="crm-attendant-activity-list" id="attendant-recent-activities-list">
            ${recentHtml}
          </ul>
        </div>
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

      const buttons = [];
      for (let p = 1; p <= totalPages; p++) {
        buttons.push(
          `<button type="button" class="crm-page-btn${p === page ? ' is-active' : ''}" data-page="${p}" ${
            p === page ? 'aria-current="page"' : ''
          }>${p}</button>`
        );
      }

      paginationEl.innerHTML = `
        <button type="button" class="crm-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>Anterior</button>
        <div class="crm-page-numbers">${buttons.join('')}</div>
        <button type="button" class="crm-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>Próxima</button>
      `;
    }

    function renderAll() {
      const result = service.listAtendimentos(state.filters);
      state.filters.page = result.page;
      renderKpis();
      renderAttendantPanel();

      if (result.total === 0) {
        tableScrollEl.hidden = true;
        paginationEl.innerHTML = '';
        emptyStateEl.hidden = false;

        const hasActiveFilters =
          Boolean(state.filters.search) ||
          state.filters.period !== 'todos' ||
          state.filters.attendant !== 'todos' ||
          state.filters.channel !== 'todos' ||
          state.filters.status !== 'todos';

        if (result.allStoredCount === 0) {
          emptyTitleEl.textContent = 'Nenhum atendimento cadastrado';
          emptyDescEl.textContent = 'Registre o primeiro atendimento ou restaure os dados demonstrativos.';
          emptyClearBtn.hidden = true;
          emptyRestoreBtn.hidden = false;
        } else {
          emptyTitleEl.textContent = 'Nenhum atendimento encontrado';
          emptyDescEl.textContent = 'Nenhum registro corresponde aos filtros selecionados.';
          emptyClearBtn.hidden = !hasActiveFilters;
          emptyRestoreBtn.hidden = true;
        }

        resultsCounterEl.textContent = '0 atendimentos exibidos';
        return;
      }

      tableScrollEl.hidden = false;
      emptyStateEl.hidden = true;

      const start = (result.page - 1) * result.pageSize + 1;
      const end = Math.min(result.page * result.pageSize, result.total);
      resultsCounterEl.textContent = `Mostrando ${start}–${end} de ${result.total} atendimento(s)`;

      tbodyEl.innerHTML = result.items
        .map((item) => {
          const overdueTag = service.isReturnOverdue(item)
            ? '<span class="crm-overdue-tag">Retorno atrasado</span>'
            : '';
          return `
            <tr data-atendimento-id="${escapeHtml(item.id)}">
              <td>
                <div class="crm-lead-primary-cell">
                  <strong>${escapeHtml(item.lead_id)}</strong>
                  <small>${escapeHtml(item.id)}</small>
                </div>
              </td>
              <td>${escapeHtml(item.nome_responsavel)}</td>
              <td>${item.nome_aluno ? escapeHtml(item.nome_aluno) : '<span class="crm-muted-dash">—</span>'}</td>
              <td>${escapeHtml(item.responsavel_atendimento)}</td>
              <td>
                <span class="crm-channel-badge channel-${escapeHtml(item.canal)}">
                  ${escapeHtml(service.getChannelLabel(item.canal))}
                </span>
              </td>
              <td class="crm-nowrap">${escapeHtml(formatDateTimeBr(item.data_hora))}</td>
              <td>
                <span class="crm-status-badge crm-atend-status-${escapeHtml(item.status)}">
                  ${escapeHtml(service.getStatusLabel(item.status))}
                </span>
                ${overdueTag}
              </td>
              <td class="crm-nowrap">${escapeHtml(formatDateTimeBr(item.ultima_atualizacao))}</td>
              <td class="crm-td-actions">
                <div class="crm-table-actions">
                  <button type="button" class="crm-table-btn" data-action="detail" data-id="${escapeHtml(item.id)}">
                    Detalhes
                  </button>
                  <button type="button" class="crm-table-btn" data-action="edit" data-id="${escapeHtml(item.id)}">
                    Editar
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

    function openFormModal(itemToEdit = null) {
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      clearFormErrors();
      crudForm.reset();

      if (itemToEdit) {
        state.editingId = itemToEdit.id;
        formTitle.textContent = `Editar atendimento (${itemToEdit.id})`;
        formSubtitle.textContent = `Atualize os dados da interação vinculada ao lead ${itemToEdit.lead_id}.`;
        saveAtendBtn.textContent = 'Salvar alterações';

        populateLeadSelect(itemToEdit.lead_id);
        formFields.channel.input.value = itemToEdit.canal || 'whatsapp';
        formFields.attendant.input.value = itemToEdit.responsavel_atendimento || actorName;
        formFields.datetime.input.value = toDatetimeLocalValue(itemToEdit.data_hora) || getNowDatetimeLocal();
        formFields.status.input.value = itemToEdit.status || 'em_andamento';
        formFields.returnDate.input.value = toDatetimeLocalValue(itemToEdit.data_retorno);
        formFields.description.input.value = itemToEdit.descricao || '';
        formFields.result.input.value = itemToEdit.resultado || '';
        formFields.nextAction.input.value = itemToEdit.proxima_acao || '';
      } else {
        state.editingId = null;
        formTitle.textContent = 'Novo atendimento';
        formSubtitle.textContent = 'Registre uma interação, resultado e próxima ação com a família.';
        saveAtendBtn.textContent = 'Registrar atendimento';

        populateLeadSelect('');
        formFields.channel.input.value = 'whatsapp';
        formFields.attendant.input.value = service.CATALOGS.attendants.includes(actorName)
          ? actorName
          : service.CATALOGS.attendants[0];
        formFields.datetime.input.value = getNowDatetimeLocal();
        formFields.status.input.value = 'em_andamento';
      }

      formModal.hidden = false;
      formFields.lead.input.focus();
    }

    function closeFormModal(restoreFocus = false) {
      formModal.hidden = true;
      state.editingId = null;
      if (restoreFocus && lastTriggerEl && typeof lastTriggerEl.focus === 'function') {
        lastTriggerEl.focus();
      }
    }

    function renderDetailModalContent(item) {
      if (!item) return;
      detailTitle.textContent = `Atendimento ${item.id} • ${item.nome_responsavel}`;
      detailSubtitle.textContent = `Lead ${item.lead_id} • Canal principal: ${service.getChannelLabel(
        item.canal
      )} • ${formatDateTimeBr(item.data_hora)}`;

      const statusOptionsHtml = buildSelectOptions(service.CATALOGS.statuses, item.status, '');
      const stageLabel = leadsService ? leadsService.getStageLabel(item.etapa_codigo) : item.etapa_codigo;
      const shiftLabel = leadsService ? leadsService.getShiftLabel(item.turno_codigo) : item.turno_codigo;
      const originLabel = leadsService ? leadsService.getOriginLabel(item.origem) : item.origem;
      const formattedPhone = leadsService ? leadsService.formatPhone(item.telefone) : item.telefone;
      const overdue = service.isReturnOverdue(item);

      const timelineSorted = [...(Array.isArray(item.historico) ? item.historico : [])].sort(
        (a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime()
      );

      const timelineHtml = timelineSorted
        .map(
          (entry) => `
            <li class="crm-history-item">
              <div class="crm-history-dot crm-dot-type-${escapeHtml(entry.tipo || 'registro')}" aria-hidden="true"></div>
              <div class="crm-history-content">
                <div class="crm-timeline-head">
                  <span class="crm-channel-badge channel-${escapeHtml(entry.tipo || 'whatsapp')}">
                    ${escapeHtml(entry.titulo || service.getChannelLabel(entry.tipo))}
                  </span>
                  <time>${escapeHtml(formatDateTimeBr(entry.criado_em))}</time>
                </div>
                <p>${escapeHtml(entry.descricao)}</p>
                <small>Registrado por ${escapeHtml(entry.autor || item.responsavel_atendimento)}</small>
              </div>
            </li>
          `
        )
        .join('');

      detailBody.innerHTML = `
        <div class="crm-detail-grid">
          <section class="crm-detail-card">
            <h4>Dados do Lead</h4>
            <dl class="crm-detail-dl">
              <div><dt>Identificação</dt><dd>${escapeHtml(item.lead_id)}</dd></div>
              <div><dt>Responsável</dt><dd>${escapeHtml(item.nome_responsavel)}</dd></div>
              <div><dt>Telefone</dt><dd>${escapeHtml(formattedPhone || 'Não informado')}</dd></div>
              <div><dt>E-mail</dt><dd>${escapeHtml(item.email || 'Não informado')}</dd></div>
              <div><dt>Origem</dt><dd>${escapeHtml(originLabel)}</dd></div>
            </dl>
          </section>

          <section class="crm-detail-card">
            <h4>Informações do Aluno</h4>
            <dl class="crm-detail-dl">
              <div><dt>Aluno(a)</dt><dd>${escapeHtml(item.nome_aluno || 'Não informado')}</dd></div>
              <div><dt>Idade</dt><dd>${item.idade_aluno ? `${escapeHtml(item.idade_aluno)} ano(s)` : 'Não informada'}</dd></div>
              <div><dt>Etapa de ensino</dt><dd>${escapeHtml(stageLabel)}</dd></div>
              <div><dt>Turno desejado</dt><dd>${escapeHtml(shiftLabel)}</dd></div>
            </dl>
          </section>

          <section class="crm-detail-card">
            <h4>Situação e Próxima Ação</h4>
            <dl class="crm-detail-dl">
              <div>
                <dt>Status atual</dt>
                <dd>
                  <span class="crm-status-badge crm-atend-status-${escapeHtml(item.status)}" id="detail-atend-status-badge">
                    ${escapeHtml(service.getStatusLabel(item.status))}
                  </span>
                </dd>
              </div>
              <div><dt>Responsável atual</dt><dd>${escapeHtml(item.responsavel_atendimento)}</dd></div>
              <div><dt>Última atualização</dt><dd>${escapeHtml(formatDateTimeBr(item.ultima_atualizacao))}</dd></div>
              <div>
                <dt>Retorno previsto</dt>
                <dd id="detail-atend-return-preview">
                  ${item.data_retorno ? escapeHtml(formatDateTimeBr(item.data_retorno)) : 'Não definido'}
                  ${overdue ? ' <span class="crm-overdue-tag">Atrasado</span>' : ''}
                </dd>
              </div>
            </dl>

            <div class="crm-detail-inline-action">
              <label for="detail-atend-status-select">Atualizar status</label>
              <div class="crm-detail-inline-row">
                <select id="detail-atend-status-select" class="form-control crm-input-compact">
                  ${statusOptionsHtml}
                </select>
                <button type="button" class="btn btn-secondary btn-sm" id="btn-detail-atend-apply-status">Aplicar</button>
              </div>
            </div>

            <div class="crm-detail-inline-action">
              <label for="detail-atend-next-action">Próxima ação programada</label>
              <p class="crm-detail-notes-text" id="detail-atend-next-action-preview">
                ${item.proxima_acao ? escapeHtml(item.proxima_acao) : 'Nenhuma próxima ação definida.'}
              </p>
              <input
                type="text"
                id="detail-atend-next-action"
                class="form-control crm-input-compact"
                maxlength="200"
                value="${escapeHtml(item.proxima_acao || '')}"
                placeholder="Definir próxima ação..."
                aria-describedby="error-detail-atend-next-action"
              />
              <input
                type="datetime-local"
                id="detail-atend-return-date"
                class="form-control crm-input-compact"
                value="${escapeHtml(toDatetimeLocalValue(item.data_retorno))}"
              />
              <span class="form-error-msg" id="error-detail-atend-next-action" role="alert"></span>
              <div class="crm-detail-obs-footer">
                <button type="button" class="btn btn-outline btn-sm" id="btn-detail-atend-save-next-action">
                  Definir próxima ação
                </button>
              </div>
            </div>
          </section>

          <section class="crm-detail-card">
            <h4>Resumo da Interação e Nota Interna</h4>
            <p class="crm-detail-notes-text" id="detail-atend-description-preview">
              ${escapeHtml(item.descricao)}
            </p>
            ${
              item.resultado
                ? `<p class="crm-detail-result-pill"><strong>Resultado:</strong> ${escapeHtml(item.resultado)}</p>`
                : ''
            }

            <div class="crm-detail-inline-action">
              <label for="detail-atend-internal-note">Registrar nota interna</label>
              <textarea
                id="detail-atend-internal-note"
                class="form-control form-textarea"
                rows="3"
                maxlength="500"
                placeholder="Registre uma anotação interna da equipe (não visível ao responsável)..."
                aria-describedby="error-detail-atend-note"
              ></textarea>
              <span class="form-error-msg" id="error-detail-atend-note" role="alert"></span>
              <div class="crm-detail-obs-footer">
                <button type="button" class="btn btn-primary btn-sm" id="btn-detail-atend-save-note">
                  Registrar nota interna
                </button>
              </div>
            </div>
          </section>
        </div>

        <section class="crm-detail-history-section" aria-label="Linha do tempo cronológica de atendimentos">
          <div class="crm-detail-history-head">
            <h4>Histórico de Atendimentos &bull; Linha do Tempo Cronológica</h4>
            <span class="crm-dropdown-sub">${timelineSorted.length} evento(s)</span>
          </div>
          <ul class="crm-history-timeline" id="detail-atend-timeline">
            ${timelineHtml}
          </ul>
        </section>
      `;

      const applyStatusBtn = detailBody.querySelector('#btn-detail-atend-apply-status');
      const statusSel = detailBody.querySelector('#detail-atend-status-select');
      if (applyStatusBtn && statusSel) {
        applyStatusBtn.addEventListener('click', () => {
          const updated = service.changeAtendimentoStatus(item.id, statusSel.value, actorName);
          if (updated) {
            renderDetailModalContent(updated);
            renderAll();
            notify(`Status de "${updated.id}" atualizado para ${service.getStatusLabel(updated.status)}.`);
          }
        });
      }

      const saveNextBtn = detailBody.querySelector('#btn-detail-atend-save-next-action');
      const nextInput = detailBody.querySelector('#detail-atend-next-action');
      const returnInput = detailBody.querySelector('#detail-atend-return-date');
      const nextError = detailBody.querySelector('#error-detail-atend-next-action');
      if (saveNextBtn && nextInput) {
        saveNextBtn.addEventListener('click', () => {
          const actionText = nextInput.value.trim();
          if (!actionText) {
            if (nextError) {
              nextError.textContent = 'Informe a próxima ação antes de salvar.';
              nextError.classList.add('show');
            }
            nextInput.classList.add('is-invalid');
            nextInput.focus();
            return;
          }
          const updated = service.updateNextAction(
            item.id,
            actionText,
            returnInput ? returnInput.value : '',
            actorName
          );
          if (updated) {
            renderDetailModalContent(updated);
            renderAll();
            notify(`Próxima ação definida no atendimento ${updated.id}.`);
          }
        });
      }

      const saveNoteBtn = detailBody.querySelector('#btn-detail-atend-save-note');
      const noteInput = detailBody.querySelector('#detail-atend-internal-note');
      const noteError = detailBody.querySelector('#error-detail-atend-note');
      if (saveNoteBtn && noteInput) {
        noteInput.addEventListener('input', () => {
          if (noteInput.value.trim()) {
            noteInput.classList.remove('is-invalid');
            if (noteError) {
              noteError.textContent = '';
              noteError.classList.remove('show');
            }
          }
        });

        saveNoteBtn.addEventListener('click', () => {
          const noteText = noteInput.value.trim();
          if (!noteText) {
            if (noteError) {
              noteError.textContent = 'Digite uma nota interna antes de registrar.';
              noteError.classList.add('show');
            }
            noteInput.classList.add('is-invalid');
            noteInput.focus();
            return;
          }
          const updated = service.addInternalNote(item.id, noteText, actorName);
          if (updated) {
            renderDetailModalContent(updated);
            renderAll();
            notify(`Nota interna adicionada à linha do tempo de ${updated.id}.`);
          }
        });
      }
    }

    function openDetailModal(id) {
      const item = service.getAtendimentoById(id);
      if (!item) return;
      lastTriggerEl = globalScope.document ? globalScope.document.activeElement : null;
      state.detailId = item.id;
      renderDetailModalContent(item);
      detailModal.hidden = false;
      const closeBtn = container.querySelector('#btn-close-atend-detail');
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
      state.filters = { ...DEFAULT_FILTERS };
      searchInput.value = '';
      periodSelect.value = 'todos';
      attendantFilterSelect.value = 'todos';
      channelSelect.value = 'todos';
      statusSelect.value = 'todos';
      renderAll();
    }

    // Eventos do Painel do Atendente
    if (attendantSelectEl) {
      attendantSelectEl.addEventListener('change', () => {
        state.selectedAttendantPanel = attendantSelectEl.value;
        renderAttendantPanel();
      });
    }

    if (attendantFilterBtn) {
      attendantFilterBtn.addEventListener('click', () => {
        state.filters.attendant = state.selectedAttendantPanel;
        state.filters.page = 1;
        attendantFilterSelect.value = state.selectedAttendantPanel;
        renderAll();
        notify(`Exibindo atendimentos de ${state.selectedAttendantPanel}.`);
      });
    }

    if (attendantMetricsEl) {
      attendantMetricsEl.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-open-atendimento]');
        if (!btn) return;
        const id = btn.getAttribute('data-open-atendimento');
        if (id) openDetailModal(id);
      });
    }

    // Eventos de Pesquisa e Filtros
    searchInput.addEventListener('input', () => {
      state.filters.search = searchInput.value.trim();
      state.filters.page = 1;
      renderAll();
    });

    [
      [periodSelect, 'period'],
      [attendantFilterSelect, 'attendant'],
      [channelSelect, 'channel'],
      [statusSelect, 'status']
    ].forEach(([el, key]) => {
      el.addEventListener('change', () => {
        state.filters[key] = el.value;
        state.filters.page = 1;
        renderAll();
      });
    });

    clearFiltersBtn.addEventListener('click', resetAllFilters);
    emptyClearBtn.addEventListener('click', resetAllFilters);

    emptyRestoreBtn.addEventListener('click', () => {
      service.restoreDemoAtendimentos();
      resetAllFilters();
      notify('Atendimentos demonstrativos restaurados no armazenamento local.');
    });

    container.querySelector('#btn-new-atendimento').addEventListener('click', () => openFormModal(null));
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
        const item = service.getAtendimentoById(id);
        if (item) openFormModal(item);
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
        canal: formFields.channel.input.value,
        responsavel_atendimento: formFields.attendant.input.value,
        data_hora: formFields.datetime.input.value,
        status: formFields.status.input.value,
        data_retorno: formFields.returnDate.input.value,
        descricao: formFields.description.input.value.trim(),
        resultado: formFields.result.input.value.trim(),
        proxima_acao: formFields.nextAction.input.value.trim()
      };

      const editingId = state.editingId;
      if (editingId) {
        const updated = service.updateAtendimento(editingId, payload, actorName);
        closeFormModal();
        renderAll();
        if (updated) {
          notify(`Atendimento ${updated.id} atualizado localmente.`);
        }
      } else {
        const created = service.createAtendimento(payload, actorName);
        state.filters.page = 1;
        closeFormModal();
        renderAll();
        notify(`Atendimento ${created.id} registrado para ${created.nome_responsavel}.`);
      }
    });

    // Controles dos Modais
    container.querySelector('#btn-close-atend-form').addEventListener('click', () => closeFormModal(true));
    container.querySelector('#btn-cancel-atend-form').addEventListener('click', () => closeFormModal(true));
    formModal.addEventListener('click', (e) => {
      if (e.target === formModal) closeFormModal(true);
    });

    container.querySelector('#btn-close-atend-detail').addEventListener('click', () => closeDetailModal(true));
    container.querySelector('#btn-detail-atend-close').addEventListener('click', () => closeDetailModal(true));
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) closeDetailModal(true);
    });

    container.querySelector('#btn-detail-atend-edit').addEventListener('click', () => {
      const id = state.detailId;
      closeDetailModal(false);
      const item = id ? service.getAtendimentoById(id) : null;
      if (item) openFormModal(item);
    });

    if (globalScope.document && typeof globalScope.document.addEventListener === 'function') {
      if (container.__atendEscapeHandler && typeof globalScope.document.removeEventListener === 'function') {
        globalScope.document.removeEventListener('keydown', container.__atendEscapeHandler);
      }
      container.__atendEscapeHandler = (e) => {
        if (e.key !== 'Escape') return;
        if (!formModal.hidden) {
          closeFormModal(true);
        } else if (!detailModal.hidden) {
          closeDetailModal(true);
        }
      };
      globalScope.document.addEventListener('keydown', container.__atendEscapeHandler);
    }

    renderAll();
  }

  globalScope.EnsinaAiCrmAtendimentos = Object.freeze({
    renderAtendimentosModule
  });
})(window);
