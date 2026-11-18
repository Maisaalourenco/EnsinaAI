/**
 * ENSINA AÍ — CRM Escolar
 * Módulo de Interface de Equipe (js/crm/equipe.js)
 * JavaScript Vanilla ES6+ — Dados e papéis exclusivamente demonstrativos em localStorage
 * Sem controle real de permissões ou autenticação.
 */

(function initCrmEquipeView(globalScope) {
  'use strict';

  const DEFAULT_FILTERS = Object.freeze({
    search: '',
    role: 'todos',
    status: 'todos'
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
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
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

  function renderAvatarHtml(member, large = false) {
    const sizeClass = large ? ' is-large' : '';
    const color = escapeHtml(member.cor_avatar || '#1E3A8A');
    const initials = escapeHtml(member.iniciais || 'EA');
    if (member.avatar_url) {
      return `
        <span class="crm-member-avatar${sizeClass}" style="background-color: ${color};">
          <img
            src="${escapeHtml(member.avatar_url)}"
            alt="Avatar de ${escapeHtml(member.nome)}"
            onerror="this.remove()"
          />
          <span>${initials}</span>
        </span>
      `;
    }
    return `
      <span class="crm-member-avatar${sizeClass}" style="background-color: ${color};" aria-hidden="true">
        ${initials}
      </span>
    `;
  }

  function renderEquipeModule(container, options = {}) {
    const service = globalScope.EnsinaAiEquipeService;
    const components = globalScope.EnsinaAiCrmComponents || null;
    if (!container || !service) return;

    const notify = typeof options.onToast === 'function' ? options.onToast : () => {};
    const onNavigateModule =
      typeof options.onNavigateModule === 'function' ? options.onNavigateModule : null;

    const state = {
      filters: {
        ...DEFAULT_FILTERS,
        search: String(options.initialSearch || '').trim()
      },
      editingId: null,
      detailId: null
    };

    container.innerHTML = `
      <div class="crm-equipe-module" id="crm-equipe-module">
        <!-- Cabeçalho da Página de Equipe -->
        <section class="crm-leads-header-bar">
          <div>
            <div class="crm-leads-title-row">
              <h2>Equipe</h2>
              <span class="crm-demo-pill">Papéis visuais demonstrativos</span>
            </div>
            <p class="crm-leads-subtitle">
              Gerencie colaboradores da secretaria e coordenação escolar com disponibilidade e indicadores individuais demonstrativos (sem controle real de permissões).
            </p>
          </div>
          <div class="crm-leads-header-actions">
            <button type="button" class="btn btn-primary" id="btn-new-membro">
              + Novo membro
            </button>
          </div>
        </section>

        <!-- Aviso explícito sobre cargos demonstrativos -->
        <section class="crm-demo-role-notice" aria-label="Aviso sobre papéis demonstrativos">
          <strong>Ambiente exclusivamente demonstrativo:</strong>
          <span>Os cargos exibidos (Administrador, Gestor Escolar e Atendente) representam perfis visuais de organização da equipe, sem restrições reais de autenticação ou banco de dados.</span>
        </section>

        <!-- Indicadores da Equipe (4 KPIs) -->
        <section class="crm-equipe-kpi-row" id="equipe-kpi-row" aria-label="Indicadores gerais da equipe">
          <!-- Renderizado dinamicamente -->
        </section>

        <!-- Barra de Pesquisa e Filtros -->
        <section class="crm-filters-card" aria-label="Pesquisa e filtros da equipe">
          <div class="crm-filters-grid crm-equipe-filters-grid">
            <div class="crm-filter-field crm-filter-search">
              <label for="equipe-search-input">Pesquisar (nome, e-mail, telefone ou observações)</label>
              <input
                type="search"
                id="equipe-search-input"
                class="form-control crm-input-compact"
                placeholder="Ex.: Ana Paula, secretaria.demo, gestor..."
                value="${escapeHtml(state.filters.search)}"
              />
            </div>

            <div class="crm-filter-field">
              <label for="equipe-filter-role">Cargo (Demo)</label>
              <select id="equipe-filter-role" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.roles, state.filters.role, 'Todos os cargos')}
              </select>
            </div>

            <div class="crm-filter-field">
              <label for="equipe-filter-status">Disponibilidade</label>
              <select id="equipe-filter-status" class="form-control crm-input-compact">
                ${buildSelectOptions(service.CATALOGS.statuses, state.filters.status, 'Todos os status')}
              </select>
            </div>
          </div>

          <div class="crm-filters-footer">
            <span class="crm-results-counter" id="equipe-results-counter"></span>
            <button type="button" class="btn btn-outline btn-sm" id="btn-clear-equipe-filters">
              Limpar filtros
            </button>
          </div>
        </section>

        <!-- Tabela de Equipe -->
        <section class="crm-panel crm-leads-table-panel" aria-label="Listagem da equipe escolar">
          <div class="crm-table-scroll" id="equipe-table-scroll">
            <table class="crm-table crm-equipe-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Cargo (Demo)</th>
                  <th>E-mail demonstrativo</th>
                  <th>Disponibilidade</th>
                  <th class="crm-th-num">Leads</th>
                  <th class="crm-th-num">Atendimentos</th>
                  <th class="crm-th-num">Matrículas</th>
                  <th class="crm-th-actions">Ações</th>
                </tr>
              </thead>
              <tbody id="equipe-table-tbody"></tbody>
            </table>
          </div>

          <div class="crm-empty-state" id="equipe-empty-state" hidden>
            <strong id="equipe-empty-title">Nenhum colaborador encontrado</strong>
            <p id="equipe-empty-desc">
              Nenhum membro da equipe corresponde aos filtros aplicados.
            </p>
            <div class="crm-empty-actions">
              <button type="button" class="btn btn-outline btn-sm" id="btn-equipe-empty-clear">
                Limpar filtros
              </button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-equipe-empty-new">
                + Novo membro
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="btn-equipe-empty-restore" hidden>
                Restaurar equipe demonstrativa
              </button>
            </div>
          </div>
        </section>

        <!-- MODAL: CADASTRAR / EDITAR MEMBRO -->
        <div
          class="crm-modal-backdrop"
          id="membro-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="membro-form-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="membro-form-modal-title">Novo membro da equipe</h3>
                <p class="crm-modal-subtitle">
                  Cadastro demonstrativo armazenado localmente — cargos sem controle real de acesso.
                </p>
              </div>
              <button type="button" class="crm-modal-close" data-modal-close aria-label="Fechar janela">&times;</button>
            </div>

            <form id="membro-crud-form" novalidate>
              <div class="crm-modal-body">
                <div class="crm-form-grid-2">
                  <div class="form-group">
                    <label for="membro-field-name">Nome completo <span class="required-star" aria-hidden="true">*</span></label>
                    <input
                      type="text"
                      id="membro-field-name"
                      class="form-control crm-input-compact"
                      placeholder="Ex.: Beatriz Almeida"
                      required
                    />
                    <span class="form-error-msg" role="alert" id="error-membro-name"></span>
                  </div>

                  <div class="form-group">
                    <label for="membro-field-email">E-mail demonstrativo <span class="required-star" aria-hidden="true">*</span></label>
                    <input
                      type="email"
                      id="membro-field-email"
                      class="form-control crm-input-compact"
                      placeholder="nome.demo@ensinaai.edu.br"
                      required
                    />
                    <span class="form-error-msg" role="alert" id="error-membro-email"></span>
                  </div>

                  <div class="form-group">
                    <label for="membro-field-role">Cargo (visual / demonstrativo) <span class="required-star" aria-hidden="true">*</span></label>
                    <select id="membro-field-role" class="form-control crm-input-compact" required>
                      ${buildSelectOptions(service.CATALOGS.roles, 'atendente', '')}
                    </select>
                    <span class="form-error-msg" role="alert" id="error-membro-role"></span>
                  </div>

                  <div class="form-group">
                    <label for="membro-field-telefone">Telefone / Ramal</label>
                    <input
                      type="tel"
                      id="membro-field-telefone"
                      class="form-control crm-input-compact"
                      placeholder="(11) 98801-0000"
                    />
                    <span class="form-error-msg" role="alert" id="error-membro-telefone"></span>
                  </div>

                  <div class="form-group">
                    <label for="membro-field-status">Status de disponibilidade <span class="required-star" aria-hidden="true">*</span></label>
                    <select id="membro-field-status" class="form-control crm-input-compact" required>
                      ${buildSelectOptions(service.CATALOGS.statuses, 'disponivel', '')}
                    </select>
                    <span class="form-error-msg" role="alert" id="error-membro-status"></span>
                  </div>

                  <div class="form-group">
                    <label for="membro-field-avatar-url">URL do avatar (opcional)</label>
                    <input
                      type="url"
                      id="membro-field-avatar-url"
                      class="form-control crm-input-compact"
                      placeholder="Deixe vazio para usar avatar com iniciais"
                    />
                  </div>
                </div>

                <div class="form-group crm-form-group-spaced">
                  <label for="membro-field-observations">Observações</label>
                  <textarea
                    id="membro-field-observations"
                    class="form-control"
                    rows="3"
                    placeholder="Especialidade por etapa escolar, horários de atendimento ou notas operacionais..."
                  ></textarea>
                </div>
              </div>

              <div class="crm-modal-footer">
                <button type="button" class="btn btn-outline btn-sm" data-modal-close>Cancelar</button>
                <button type="submit" class="btn btn-primary btn-sm" id="btn-save-membro">
                  Salvar membro
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL: DETALHES E INDICADORES INDIVIDUAIS -->
        <div
          class="crm-modal-backdrop"
          id="membro-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="membro-detail-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="membro-detail-modal-title">Ficha do Colaborador</h3>
                <p class="crm-modal-subtitle" id="membro-detail-modal-subtitle">
                  Indicadores individuais consolidados localmente (dados demonstrativos)
                </p>
              </div>
              <button type="button" class="crm-modal-close" data-modal-close aria-label="Fechar janela">&times;</button>
            </div>

            <div class="crm-modal-body" id="membro-detail-body"></div>

            <div class="crm-modal-footer crm-modal-footer-split">
              <button type="button" class="btn btn-outline btn-sm" id="btn-detail-edit-membro">
                Editar membro
              </button>
              <button type="button" class="btn btn-primary btn-sm" data-modal-close>Fechar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Referências
    const kpiRowEl = container.querySelector('#equipe-kpi-row');
    const searchInput = container.querySelector('#equipe-search-input');
    const roleFilter = container.querySelector('#equipe-filter-role');
    const statusFilter = container.querySelector('#equipe-filter-status');
    const clearFiltersBtn = container.querySelector('#btn-clear-equipe-filters');
    const resultsCounterEl = container.querySelector('#equipe-results-counter');

    const tableScrollEl = container.querySelector('#equipe-table-scroll');
    const tbodyEl = container.querySelector('#equipe-table-tbody');
    const emptyStateEl = container.querySelector('#equipe-empty-state');
    const emptyTitleEl = container.querySelector('#equipe-empty-title');
    const emptyDescEl = container.querySelector('#equipe-empty-desc');
    const emptyRestoreBtn = container.querySelector('#btn-equipe-empty-restore');

    const formModalEl = container.querySelector('#membro-form-modal');
    const formEl = container.querySelector('#membro-crud-form');
    const formTitleEl = container.querySelector('#membro-form-modal-title');
    const nameInput = container.querySelector('#membro-field-name');
    const emailInput = container.querySelector('#membro-field-email');
    const roleInput = container.querySelector('#membro-field-role');
    const phoneInput = container.querySelector('#membro-field-telefone');
    const statusInput = container.querySelector('#membro-field-status');
    const avatarUrlInput = container.querySelector('#membro-field-avatar-url');
    const obsInput = container.querySelector('#membro-field-observations');
    const saveBtn = container.querySelector('#btn-save-membro');

    const errName = container.querySelector('#error-membro-name');
    const errEmail = container.querySelector('#error-membro-email');
    const errRole = container.querySelector('#error-membro-role');
    const errPhone = container.querySelector('#error-membro-telefone');
    const errStatus = container.querySelector('#error-membro-status');

    const detailModalEl = container.querySelector('#membro-detail-modal');
    const detailBodyEl = container.querySelector('#membro-detail-body');
    const detailSubtitleEl = container.querySelector('#membro-detail-modal-subtitle');
    const detailEditBtn = container.querySelector('#btn-detail-edit-membro');

    const formModalCtrl = components ? components.bindModalController(formModalEl) : null;
    const detailModalCtrl = components ? components.bindModalController(detailModalEl) : null;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    function setFieldError(input, errEl, message) {
      if (!input || !errEl) return !message;
      if (message) {
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        errEl.textContent = message;
        errEl.classList.add('show');
        return false;
      }
      input.classList.remove('is-invalid');
      input.removeAttribute('aria-invalid');
      errEl.textContent = '';
      errEl.classList.remove('show');
      return true;
    }

    function clearFormErrors() {
      setFieldError(nameInput, errName, '');
      setFieldError(emailInput, errEmail, '');
      setFieldError(roleInput, errRole, '');
      setFieldError(phoneInput, errPhone, '');
      setFieldError(statusInput, errStatus, '');
    }

    function renderKpis() {
      const stats = service.getStats();
      const cards = [
        {
          id: 'total',
          label: 'Total de membros',
          value: stats.total,
          foot: 'Equipe escolar demonstrativa',
          accent: 'navy'
        },
        {
          id: 'available',
          label: 'Disponíveis',
          value: stats.disponiveis,
          foot: 'Prontos para novos contatos',
          accent: 'green'
        },
        {
          id: 'busy',
          label: 'Em atendimento',
          value: stats.emAtendimento,
          foot: 'Atuação ativa com famílias',
          accent: 'blue'
        },
        {
          id: 'enrollments',
          label: 'Matrículas da equipe',
          value: stats.matriculasEquipe,
          foot: 'Consolidado dos leads atribuídos',
          accent: 'amber'
        }
      ];

      kpiRowEl.innerHTML = cards
        .map(
          (card) => `
          <article class="crm-kpi-card accent-${escapeHtml(card.accent)}">
            <span class="crm-kpi-label">${escapeHtml(card.label)}</span>
            <strong class="crm-kpi-value" id="equipe-stat-${escapeHtml(card.id)}">${escapeHtml(card.value)}</strong>
            <span class="crm-kpi-foot">${escapeHtml(card.foot)}</span>
          </article>
        `
        )
        .join('');
    }

    function renderTable() {
      const res = service.listMembers(state.filters);
      const { items, total, allStoredCount } = res;

      resultsCounterEl.textContent = `${total} ${
        total === 1 ? 'colaborador exibido' : 'colaboradores exibidos'
      } (${allStoredCount} cadastrados no ambiente local)`;

      if (items.length === 0) {
        tableScrollEl.hidden = true;
        emptyStateEl.hidden = false;
        if (allStoredCount === 0) {
          emptyTitleEl.textContent = 'Nenhum membro cadastrado';
          emptyDescEl.textContent = 'Cadastre um colaborador demonstrativo ou restaure a equipe inicial.';
          emptyRestoreBtn.hidden = false;
        } else {
          emptyTitleEl.textContent = 'Nenhum colaborador encontrado';
          emptyDescEl.textContent = 'Nenhum membro corresponde à pesquisa ou aos filtros selecionados.';
          emptyRestoreBtn.hidden = true;
        }
        return;
      }

      tableScrollEl.hidden = false;
      emptyStateEl.hidden = true;

      tbodyEl.innerHTML = items
        .map((m) => {
          const metrics = m.metrics || {};
          const roleLabel = service.getRoleLabel(m.cargo);
          const statusOpts = service.CATALOGS.statuses
            .map(
              (s) =>
                `<option value="${escapeHtml(s.codigo)}"${
                  m.status === s.codigo ? ' selected' : ''
                }>${escapeHtml(s.label)}</option>`
            )
            .join('');

          return `
            <tr data-member-id="${escapeHtml(m.id)}">
              <td>
                <div class="crm-member-cell">
                  ${renderAvatarHtml(m, false)}
                  <div class="crm-lead-primary-cell">
                    <button type="button" class="crm-lead-name-btn" data-action="view" data-id="${escapeHtml(m.id)}">
                      ${escapeHtml(m.nome)}
                    </button>
                    <small>${escapeHtml(m.id)} &bull; ${escapeHtml(service.formatPhone(m.telefone))}</small>
                  </div>
                </div>
              </td>
              <td>
                <span class="crm-role-badge role-${escapeHtml(m.cargo)}">${escapeHtml(roleLabel)}</span>
              </td>
              <td>
                <span class="crm-member-email">${escapeHtml(m.email || '—')}</span>
              </td>
              <td>
                <select
                  class="crm-status-select crm-status-badge crm-equipe-status-${escapeHtml(m.status)}"
                  data-action="inline-status"
                  data-id="${escapeHtml(m.id)}"
                  aria-label="Disponibilidade de ${escapeHtml(m.nome)}"
                >
                  ${statusOpts}
                </select>
              </td>
              <td class="crm-td-num"><strong>${metrics.leadsAtribuidos ?? 0}</strong></td>
              <td class="crm-td-num"><strong>${metrics.atendimentosRealizados ?? 0}</strong></td>
              <td class="crm-td-num"><strong class="crm-num-highlight">${metrics.matriculasRealizadas ?? 0}</strong></td>
              <td>
                <div class="crm-table-actions">
                  <button
                    type="button"
                    class="crm-table-btn"
                    data-action="view"
                    data-id="${escapeHtml(m.id)}"
                  >
                    Visualizar
                  </button>
                  <button
                    type="button"
                    class="crm-table-btn"
                    data-action="edit"
                    data-id="${escapeHtml(m.id)}"
                  >
                    Editar
                  </button>
                </div>
              </td>
            </tr>
          `;
        })
        .join('');
    }

    function refreshAll() {
      renderKpis();
      renderTable();
    }

    function openCreateModal(triggerEl) {
      state.editingId = null;
      clearFormErrors();
      formEl.reset();
      roleInput.value = 'atendente';
      statusInput.value = 'disponivel';
      formTitleEl.textContent = 'Novo membro da equipe';
      saveBtn.textContent = 'Cadastrar membro';
      if (formModalCtrl) formModalCtrl.open(triggerEl);
      nameInput.focus();
    }

    function openEditModal(memberId, triggerEl) {
      const m = service.getMemberById(memberId);
      if (!m) {
        notify('Membro não encontrado.');
        return;
      }
      state.editingId = m.id;
      clearFormErrors();
      formTitleEl.textContent = `Editar membro (${m.id})`;
      saveBtn.textContent = 'Salvar alterações';

      nameInput.value = m.nome || '';
      emailInput.value = m.email || '';
      roleInput.value = m.cargo || 'atendente';
      phoneInput.value = m.telefone ? service.formatPhone(m.telefone) : '';
      statusInput.value = m.status || 'disponivel';
      avatarUrlInput.value = m.avatar_url || '';
      obsInput.value = m.observacoes || '';

      if (formModalCtrl) formModalCtrl.open(triggerEl);
      nameInput.focus();
    }

    function openDetailModal(memberId, triggerEl) {
      const m = service.getMemberById(memberId);
      if (!m) {
        notify('Colaborador não encontrado.');
        return;
      }
      state.detailId = m.id;
      const metrics = m.metrics || {};
      const roleLabel = service.getRoleLabel(m.cargo);
      const statusLabel = service.getStatusLabel(m.status);

      if (detailSubtitleEl) {
        detailSubtitleEl.textContent = `${m.id} • Cargo visual: ${roleLabel} (demonstrativo, sem permissões reais)`;
      }

      const recentLeadsHtml =
        Array.isArray(metrics.recentLeads) && metrics.recentLeads.length > 0
          ? `<ul class="crm-member-recent-list">
              ${metrics.recentLeads
                .map(
                  (l) => `
                  <li>
                    <strong>${escapeHtml(l.nome_responsavel)}</strong>
                    <span>${escapeHtml(l.nome_aluno || 'Sem aluno')} &bull; ${escapeHtml(l.id)}</span>
                  </li>
                `
                )
                .join('')}
            </ul>`
          : '<p class="crm-detail-empty">Nenhum lead atribuído a este colaborador no momento.</p>';

      detailBodyEl.innerHTML = `
        <div class="crm-member-detail-hero">
          ${renderAvatarHtml(m, true)}
          <div class="crm-member-detail-title">
            <div class="crm-leads-title-row">
              <h4>${escapeHtml(m.nome)}</h4>
              <span class="crm-role-badge role-${escapeHtml(m.cargo)}">${escapeHtml(roleLabel)} (Demo)</span>
              <span class="crm-status-badge crm-equipe-status-${escapeHtml(m.status)}">${escapeHtml(statusLabel)}</span>
            </div>
            <p>${escapeHtml(m.email || 'E-mail não informado')} &bull; ${escapeHtml(service.formatPhone(m.telefone))}</p>
          </div>
        </div>

        <section class="crm-detail-card" aria-label="Indicadores individuais do colaborador">
          <h4>Indicadores Individuais (Consolidados dos Módulos Locais)</h4>
          <div class="crm-member-kpis-grid">
            <div class="crm-mini-stat">
              <span>Leads atribuídos</span>
              <strong id="detail-kpi-leads">${metrics.leadsAtribuidos ?? 0}</strong>
            </div>
            <div class="crm-mini-stat">
              <span>Atendimentos realizados</span>
              <strong id="detail-kpi-atendimentos">${metrics.atendimentosRealizados ?? 0}</strong>
            </div>
            <div class="crm-mini-stat">
              <span>Tarefas concluídas</span>
              <strong id="detail-kpi-tarefas">${metrics.tarefasConcluidas ?? 0}</strong>
            </div>
            <div class="crm-mini-stat">
              <span>Visitas acompanhadas</span>
              <strong id="detail-kpi-visitas">${metrics.visitasAcompanhadas ?? 0}</strong>
            </div>
            <div class="crm-mini-stat is-highlight">
              <span>Matrículas realizadas</span>
              <strong id="detail-kpi-matriculas">${metrics.matriculasRealizadas ?? 0}</strong>
            </div>
          </div>
        </section>

        <div class="crm-detail-grid" style="margin-top: 0.9rem;">
          <section class="crm-detail-card">
            <h4>Observações e Perfil</h4>
            <p class="crm-detail-notes-text">
              ${escapeHtml(m.observacoes || 'Nenhuma observação operacional registrada para este colaborador.')}
            </p>
            <span class="crm-dropdown-sub" style="display:block; margin-top: 0.55rem;">
              Atualizado em ${escapeHtml(formatDateTimeBr(m.atualizado_em))}
            </span>
          </section>

          <section class="crm-detail-card">
            <h4>Carteira Recente de Leads</h4>
            ${recentLeadsHtml}
          </section>
        </div>

        ${
          onNavigateModule
            ? `
          <div class="crm-detail-module-links" style="margin-top: 0.9rem;">
            <button type="button" class="btn btn-outline btn-sm" data-member-nav="leads" data-owner="${escapeHtml(m.nome)}">
              Ver Leads do colaborador
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-member-nav="atendimentos" data-owner="${escapeHtml(m.nome)}">
              Ver Atendimentos
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-member-nav="tarefas" data-owner="${escapeHtml(m.nome)}">
              Ver Tarefas
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-member-nav="visitas" data-owner="${escapeHtml(m.nome)}">
              Ver Visitas
            </button>
          </div>
        `
            : ''
        }
      `;

      detailBodyEl.querySelectorAll('[data-member-nav]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const targetRoute = btn.getAttribute('data-member-nav');
          const ownerSearch = btn.getAttribute('data-owner') || '';
          if (detailModalCtrl) detailModalCtrl.close(false);
          if (onNavigateModule) {
            onNavigateModule(targetRoute, { search: ownerSearch });
          }
        });
      });

      if (detailModalCtrl) detailModalCtrl.open(triggerEl);
    }

    // Eventos de pesquisa e filtros
    searchInput.addEventListener('input', () => {
      state.filters.search = searchInput.value;
      renderTable();
    });

    roleFilter.addEventListener('change', () => {
      state.filters.role = roleFilter.value;
      renderTable();
    });

    statusFilter.addEventListener('change', () => {
      state.filters.status = statusFilter.value;
      renderTable();
    });

    function clearAllFilters() {
      state.filters = { ...DEFAULT_FILTERS };
      searchInput.value = '';
      roleFilter.value = 'todos';
      statusFilter.value = 'todos';
      renderTable();
    }

    clearFiltersBtn.addEventListener('click', clearAllFilters);
    container.querySelector('#btn-equipe-empty-clear').addEventListener('click', clearAllFilters);

    container.querySelector('#btn-new-membro').addEventListener('click', (e) => {
      openCreateModal(e.currentTarget);
    });

    container.querySelector('#btn-equipe-empty-new').addEventListener('click', (e) => {
      openCreateModal(e.currentTarget);
    });

    emptyRestoreBtn.addEventListener('click', () => {
      service.restoreDemoMembers();
      clearAllFilters();
      refreshAll();
      notify('Equipe demonstrativa restaurada com sucesso.');
    });

    // Ações na tabela
    tbodyEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'view') {
        openDetailModal(id, btn);
      } else if (action === 'edit') {
        openEditModal(id, btn);
      }
    });

    tbodyEl.addEventListener('change', (e) => {
      const sel = e.target.closest('select[data-action="inline-status"]');
      if (!sel) return;
      const id = sel.getAttribute('data-id');
      const nextStatus = sel.value;
      const updated = service.changeMemberStatus(id, nextStatus);
      if (updated) {
        refreshAll();
        notify(`Disponibilidade de ${updated.nome} alterada para "${service.getStatusLabel(updated.status)}".`);
      }
    });

    detailEditBtn.addEventListener('click', (e) => {
      const id = state.detailId;
      if (!id) return;
      if (detailModalCtrl) detailModalCtrl.close(false);
      openEditModal(id, e.currentTarget);
    });

    // Máscara leve de telefone
    phoneInput.addEventListener('input', () => {
      const digits = phoneInput.value.replace(/\D/g, '').slice(0, 11);
      if (digits.length >= 11) {
        phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
      } else if (digits.length >= 7) {
        phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
      }
    });

    // Submissão do formulário de membro
    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      clearFormErrors();

      const nome = nameInput.value.trim();
      const email = emailInput.value.trim();
      const cargo = roleInput.value;
      const telefoneDigits = phoneInput.value.replace(/\D/g, '');
      const status = statusInput.value;

      let ok = true;
      if (nome.length < 3) {
        ok = setFieldError(nameInput, errName, 'Informe o nome completo (mínimo 3 caracteres).');
      }
      if (!email || !emailRegex.test(email)) {
        ok = setFieldError(emailInput, errEmail, 'Informe um e-mail demonstrativo válido.');
      }
      if (!cargo) {
        ok = setFieldError(roleInput, errRole, 'Selecione o cargo visual.');
      }
      if (telefoneDigits && telefoneDigits.length < 10) {
        ok = setFieldError(phoneInput, errPhone, 'Informe DDD + número válido ou deixe em branco.');
      }
      if (!status) {
        ok = setFieldError(statusInput, errStatus, 'Selecione o status de disponibilidade.');
      }

      if (!ok) {
        const firstInvalid = formEl.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const payload = {
        nome,
        email,
        cargo,
        telefone: telefoneDigits,
        status,
        avatar_url: avatarUrlInput.value.trim(),
        observacoes: obsInput.value.trim()
      };

      if (state.editingId) {
        const updated = service.updateMember(state.editingId, payload);
        if (formModalCtrl) formModalCtrl.close(false);
        refreshAll();
        if (updated) {
          notify(`Colaborador "${updated.nome}" atualizado com sucesso.`);
        }
      } else {
        const created = service.createMember(payload);
        if (formModalCtrl) formModalCtrl.close(false);
        refreshAll();
        if (created) {
          notify(`Colaborador "${created.nome}" cadastrado na equipe demonstrativa.`);
        }
      }
    });

    refreshAll();
  }

  globalScope.EnsinaAiCrmEquipe = Object.freeze({
    renderEquipeModule
  });
})(window);
