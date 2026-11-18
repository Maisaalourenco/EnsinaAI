/**
 * ENSINA AÍ — CRM Escolar
 * Módulo de Interface da Base de Conhecimento (js/crm/conhecimento.js)
 * JavaScript Vanilla ES6+ — Pesquisa, filtros por categoria, leitura, cadastro, edição e exclusão
 */

(function initCrmConhecimentoView(globalScope) {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateBr(isoString) {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  function renderConhecimentoModule(container, options = {}) {
    const service = globalScope.EnsinaAiConhecimentoService;
    const components = globalScope.EnsinaAiCrmComponents || null;
    if (!container || !service) return;

    const session = options.session || { role: 'gestor', name: 'Coordenação Demo' };
    const isAtendente = session.role === 'atendente';
    const notify = typeof options.onToast === 'function' ? options.onToast : () => {};

    const state = {
      search: String(options.initialSearch || '').trim(),
      category: 'todos',
      editingId: null,
      viewingId: null,
      deletingId: null
    };

    const catOptionsHtml = [
      '<option value="todos">Todas as categorias</option>',
      ...service.CATALOGS.categories.map(
        (c) => `<option value="${escapeHtml(c.codigo)}">${escapeHtml(c.label)}</option>`
      )
    ].join('');

    const formCatOptionsHtml = service.CATALOGS.categories
      .map((c) => `<option value="${escapeHtml(c.codigo)}">${escapeHtml(c.label)}</option>`)
      .join('');

    container.innerHTML = `
      <div class="crm-conhecimento-module" id="crm-conhecimento-module">
        <section class="crm-leads-header-bar">
          <div>
            <div class="crm-leads-title-row">
              <h2>Base de conhecimento</h2>
              <span class="crm-demo-pill">Conteúdo interno demonstrativo</span>
            </div>
            <p class="crm-leads-subtitle">
              ${
                isAtendente
                  ? 'Consulte roteiros de atendimento, checklists de matrícula e orientações oficiais da escola durante seus contatos.'
                  : 'Gerencie roteiros de atendimento, checklists de matrícula, processos escolares e modelos de comunicação da escola.'
              }
            </p>
          </div>
          <div class="crm-leads-header-actions">
            ${
              isAtendente
                ? `<span class="crm-readonly-pill" id="kb-readonly-pill">Modo consulta &bull; Edição exclusiva do Gestor Escolar</span>`
                : ''
            }
            <button type="button" class="btn btn-primary" id="btn-new-artigo"${isAtendente ? ' hidden' : ''}>
              + Novo artigo
            </button>
          </div>
        </section>

        <!-- Pesquisa e Filtro por Categoria -->
        <section class="crm-filters-card" aria-label="Pesquisa e filtros da base de conhecimento">
          <div class="crm-filters-grid crm-kb-filters-grid">
            <div class="crm-filter-field crm-filter-search">
              <label for="conhecimento-search-input">Pesquisar por título, resumo ou conteúdo</label>
              <input
                type="search"
                id="conhecimento-search-input"
                class="form-control crm-input-compact"
                placeholder="Ex.: matrícula, WhatsApp, adaptação, LGPD..."
                value="${escapeHtml(state.search)}"
              />
            </div>

            <div class="crm-filter-field">
              <label for="conhecimento-filter-category">Categoria</label>
              <select id="conhecimento-filter-category" class="form-control crm-input-compact">
                ${catOptionsHtml}
              </select>
            </div>
          </div>

          <div class="crm-report-tabs-bar" id="conhecimento-category-tabs" role="tablist" aria-label="Filtrar por categoria"></div>

          <div class="crm-filters-footer">
            <span class="crm-results-counter" id="conhecimento-results-counter"></span>
            <button type="button" class="btn btn-outline btn-sm" id="btn-clear-conhecimento-filters">
              Limpar filtros
            </button>
          </div>
        </section>

        <!-- Grade de Artigos -->
        <section class="crm-kb-grid" id="conhecimento-articles-grid" aria-label="Artigos disponíveis"></section>

        <!-- Estado Vazio -->
        <section class="crm-panel" id="conhecimento-empty-wrap" hidden>
          <div class="crm-empty-state" id="conhecimento-empty-state">
            <strong id="conhecimento-empty-title">Nenhum artigo encontrado</strong>
            <p id="conhecimento-empty-desc">
              Nenhum conteúdo corresponde à pesquisa ou categoria selecionada.
            </p>
            <div class="crm-empty-actions">
              <button type="button" class="btn btn-outline btn-sm" id="btn-conhecimento-empty-clear">
                Limpar filtros
              </button>
              <button type="button" class="btn btn-primary btn-sm" id="btn-conhecimento-empty-new"${isAtendente ? ' hidden' : ''}>
                + Novo artigo
              </button>
              <button type="button" class="btn btn-outline btn-sm" id="btn-conhecimento-empty-restore" hidden>
                Restaurar artigos demonstrativos
              </button>
            </div>
          </div>
        </section>

        <!-- MODAL: VISUALIZAR ARTIGO -->
        <div
          class="crm-modal-backdrop"
          id="artigo-view-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="artigo-view-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="artigo-view-title">Visualização do Artigo</h3>
                <p class="crm-modal-subtitle" id="artigo-view-meta"></p>
              </div>
              <button type="button" class="crm-modal-close" data-modal-close aria-label="Fechar janela">&times;</button>
            </div>
            <div class="crm-modal-body" id="artigo-view-body"></div>
            <div class="crm-modal-footer crm-modal-footer-split">
              <div class="crm-modal-footer-actions">
                <button type="button" class="btn btn-outline btn-sm" id="btn-view-edit-artigo"${isAtendente ? ' hidden' : ''}>Editar</button>
                <button type="button" class="btn btn-outline btn-sm crm-btn-danger-outline" id="btn-view-delete-artigo"${isAtendente ? ' hidden' : ''}>Excluir</button>
              </div>
              <button type="button" class="btn btn-primary btn-sm" data-modal-close>Fechar</button>
            </div>
          </div>
        </div>

        <!-- MODAL: CADASTRAR / EDITAR ARTIGO -->
        <div
          class="crm-modal-backdrop"
          id="artigo-form-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="artigo-form-modal-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-wide">
            <div class="crm-modal-header">
              <div>
                <h3 id="artigo-form-modal-title">Novo artigo</h3>
                <p class="crm-modal-subtitle">Conteúdo armazenado localmente para demonstração da equipe.</p>
              </div>
              <button type="button" class="crm-modal-close" data-modal-close aria-label="Fechar janela">&times;</button>
            </div>

            <form id="artigo-crud-form" novalidate>
              <div class="crm-modal-body">
                <div class="crm-form-grid-2">
                  <div class="form-group crm-form-span-2">
                    <label for="artigo-field-titulo">Título do artigo <span class="required-star" aria-hidden="true">*</span></label>
                    <input
                      type="text"
                      id="artigo-field-titulo"
                      class="form-control crm-input-compact"
                      placeholder="Ex.: Roteiro de apresentação da Educação Infantil"
                      required
                    />
                    <span class="form-error-msg" role="alert" id="error-artigo-titulo"></span>
                  </div>

                  <div class="form-group">
                    <label for="artigo-field-categoria">Categoria <span class="required-star" aria-hidden="true">*</span></label>
                    <select id="artigo-field-categoria" class="form-control crm-input-compact" required>
                      ${formCatOptionsHtml}
                    </select>
                    <span class="form-error-msg" role="alert" id="error-artigo-categoria"></span>
                  </div>

                  <div class="form-group">
                    <label for="artigo-field-autor">Autor demonstrativo <span class="required-star" aria-hidden="true">*</span></label>
                    <input
                      type="text"
                      id="artigo-field-autor"
                      class="form-control crm-input-compact"
                      placeholder="Ex.: Coordenação Pedagógica (Demo)"
                      required
                    />
                    <span class="form-error-msg" role="alert" id="error-artigo-autor"></span>
                  </div>
                </div>

                <div class="form-group crm-form-group-spaced">
                  <label for="artigo-field-resumo">Resumo <span class="required-star" aria-hidden="true">*</span></label>
                  <textarea
                    id="artigo-field-resumo"
                    class="form-control"
                    rows="2"
                    placeholder="Breve descrição do objetivo deste conteúdo..."
                    required
                  ></textarea>
                  <span class="form-error-msg" role="alert" id="error-artigo-resumo"></span>
                </div>

                <div class="form-group crm-form-group-spaced">
                  <label for="artigo-field-conteudo">Conteúdo completo <span class="required-star" aria-hidden="true">*</span></label>
                  <textarea
                    id="artigo-field-conteudo"
                    class="form-control"
                    rows="6"
                    placeholder="Orientações detalhadas, etapas, checklists ou textos modelo..."
                    required
                  ></textarea>
                  <span class="form-error-msg" role="alert" id="error-artigo-conteudo"></span>
                </div>
              </div>

              <div class="crm-modal-footer">
                <button type="button" class="btn btn-outline btn-sm" data-modal-close>Cancelar</button>
                <button type="submit" class="btn btn-primary btn-sm" id="btn-save-artigo">Salvar artigo</button>
              </div>
            </form>
          </div>
        </div>

        <!-- MODAL: CONFIRMAR EXCLUSÃO -->
        <div
          class="crm-modal-backdrop"
          id="artigo-delete-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="artigo-delete-title"
          hidden
        >
          <div class="crm-modal-dialog crm-modal-dialog-sm">
            <div class="crm-modal-header">
              <div>
                <h3 id="artigo-delete-title">Confirmar exclusão</h3>
                <p class="crm-modal-subtitle">Esta ação remove o artigo da lista local demonstrativa.</p>
              </div>
              <button type="button" class="crm-modal-close" data-modal-close aria-label="Fechar janela">&times;</button>
            </div>
            <div class="crm-modal-body">
              <p class="crm-detail-notes-text" id="artigo-delete-message">
                Tem certeza que deseja excluir este artigo?
              </p>
            </div>
            <div class="crm-modal-footer">
              <button type="button" class="btn btn-outline btn-sm" data-modal-close>Cancelar</button>
              <button type="button" class="btn btn-primary btn-sm crm-btn-danger" id="btn-confirm-delete-artigo">
                Excluir artigo
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    const searchInput = container.querySelector('#conhecimento-search-input');
    const catSelect = container.querySelector('#conhecimento-filter-category');
    const catTabsEl = container.querySelector('#conhecimento-category-tabs');
    const counterEl = container.querySelector('#conhecimento-results-counter');
    const clearBtn = container.querySelector('#btn-clear-conhecimento-filters');
    const gridEl = container.querySelector('#conhecimento-articles-grid');
    const emptyWrapEl = container.querySelector('#conhecimento-empty-wrap');
    const emptyTitleEl = container.querySelector('#conhecimento-empty-title');
    const emptyDescEl = container.querySelector('#conhecimento-empty-desc');
    const emptyRestoreBtn = container.querySelector('#btn-conhecimento-empty-restore');

    const viewModalEl = container.querySelector('#artigo-view-modal');
    const viewTitleEl = container.querySelector('#artigo-view-title');
    const viewMetaEl = container.querySelector('#artigo-view-meta');
    const viewBodyEl = container.querySelector('#artigo-view-body');
    const viewEditBtn = container.querySelector('#btn-view-edit-artigo');
    const viewDeleteBtn = container.querySelector('#btn-view-delete-artigo');

    const formModalEl = container.querySelector('#artigo-form-modal');
    const formEl = container.querySelector('#artigo-crud-form');
    const formTitleEl = container.querySelector('#artigo-form-modal-title');
    const tituloInput = container.querySelector('#artigo-field-titulo');
    const categoriaInput = container.querySelector('#artigo-field-categoria');
    const autorInput = container.querySelector('#artigo-field-autor');
    const resumoInput = container.querySelector('#artigo-field-resumo');
    const conteudoInput = container.querySelector('#artigo-field-conteudo');
    const saveBtn = container.querySelector('#btn-save-artigo');

    const errTitulo = container.querySelector('#error-artigo-titulo');
    const errCategoria = container.querySelector('#error-artigo-categoria');
    const errAutor = container.querySelector('#error-artigo-autor');
    const errResumo = container.querySelector('#error-artigo-resumo');
    const errConteudo = container.querySelector('#error-artigo-conteudo');

    const deleteModalEl = container.querySelector('#artigo-delete-modal');
    const deleteMsgEl = container.querySelector('#artigo-delete-message');
    const confirmDeleteBtn = container.querySelector('#btn-confirm-delete-artigo');

    const viewModalCtrl = components ? components.bindModalController(viewModalEl) : null;
    const formModalCtrl = components ? components.bindModalController(formModalEl) : null;
    const deleteModalCtrl = components ? components.bindModalController(deleteModalEl) : null;

    function setFieldError(input, errEl, msg) {
      if (!input || !errEl) return !msg;
      if (msg) {
        input.classList.add('is-invalid');
        input.setAttribute('aria-invalid', 'true');
        errEl.textContent = msg;
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
      setFieldError(tituloInput, errTitulo, '');
      setFieldError(categoriaInput, errCategoria, '');
      setFieldError(autorInput, errAutor, '');
      setFieldError(resumoInput, errResumo, '');
      setFieldError(conteudoInput, errConteudo, '');
    }

    function renderCategoryTabs() {
      const counts = service.getCategoryCounts();
      const tabs = [
        { codigo: 'todos', label: 'Todas', count: counts.todos },
        ...service.CATALOGS.categories.map((c) => ({
          codigo: c.codigo,
          label: c.label,
          count: counts[c.codigo] || 0
        }))
      ];

      catTabsEl.innerHTML = tabs
        .map(
          (t) => `
          <button
            type="button"
            role="tab"
            class="crm-report-tab-btn${state.category === t.codigo ? ' is-active' : ''}"
            data-kb-cat="${escapeHtml(t.codigo)}"
            aria-selected="${state.category === t.codigo ? 'true' : 'false'}"
          >
            ${escapeHtml(t.label)} (${t.count})
          </button>
        `
        )
        .join('');
    }

    function renderArticles() {
      catSelect.value = state.category;
      renderCategoryTabs();

      const { items, total, allStoredCount } = service.listArticles({
        search: state.search,
        category: state.category
      });

      counterEl.textContent = `${total} ${
        total === 1 ? 'artigo exibido' : 'artigos exibidos'
      } (${allStoredCount} na base local)`;

      if (items.length === 0) {
        gridEl.hidden = true;
        emptyWrapEl.hidden = false;
        if (allStoredCount === 0) {
          emptyTitleEl.textContent = 'Nenhum artigo cadastrado';
          emptyDescEl.textContent = isAtendente
            ? 'Nenhum artigo disponível para consulta no momento.'
            : 'Crie um novo artigo ou restaure os 8 artigos demonstrativos iniciais.';
          emptyRestoreBtn.hidden = isAtendente;
        } else {
          emptyTitleEl.textContent = 'Nenhum artigo encontrado';
          emptyDescEl.textContent = 'Ajuste a pesquisa por título ou selecione outra categoria.';
          emptyRestoreBtn.hidden = true;
        }
        return;
      }

      gridEl.hidden = false;
      emptyWrapEl.hidden = true;

      gridEl.innerHTML = items
        .map((art) => {
          const catLabel = service.getCategoryLabel(art.categoria);
          return `
            <article class="crm-kb-card" data-article-id="${escapeHtml(art.id)}">
              <div class="crm-kb-card-meta">
                <span>${escapeHtml(catLabel)}</span>
                <span aria-hidden="true">&middot;</span>
                <span>${escapeHtml(art.id)}</span>
              </div>
              <h3 class="crm-kb-card-title">
                <button type="button" class="crm-kb-title-btn" data-action="view" data-id="${escapeHtml(art.id)}">
                  ${escapeHtml(art.titulo)}
                </button>
              </h3>
              <p class="crm-kb-card-summary">${escapeHtml(art.resumo)}</p>
              <div class="crm-kb-card-foot">
                <span class="crm-kb-card-author">
                  ${escapeHtml(art.autor)} &middot; Atualizado em ${escapeHtml(formatDateBr(art.atualizado_em))}
                </span>
                <div class="crm-table-actions">
                  <button type="button" class="crm-table-btn" data-action="view" data-id="${escapeHtml(art.id)}">Ler</button>
                  ${
                    isAtendente
                      ? ''
                      : `<button type="button" class="crm-table-btn" data-action="edit" data-id="${escapeHtml(art.id)}">Editar</button>
                         <button type="button" class="crm-table-btn crm-table-btn-danger" data-action="delete" data-id="${escapeHtml(art.id)}">Excluir</button>`
                  }
                </div>
              </div>
            </article>
          `;
        })
        .join('');
    }

    function openViewModal(id, triggerEl) {
      const art = service.getArticleById(id);
      if (!art) return;
      state.viewingId = art.id;
      viewTitleEl.textContent = art.titulo;
      viewMetaEl.textContent = `${service.getCategoryLabel(art.categoria)} • ${art.autor} • Atualizado em ${formatDateBr(art.atualizado_em)}`;

      const paragraphs = String(art.conteudo || '')
        .split(/\n+/)
        .filter((line) => line.trim())
        .map((line) => `<p>${escapeHtml(line)}</p>`)
        .join('');

      viewBodyEl.innerHTML = `
        <div class="crm-kb-article-view">
          <div class="crm-detail-card">
            <h4>Resumo</h4>
            <p class="crm-detail-notes-text">${escapeHtml(art.resumo)}</p>
          </div>
          <div class="crm-kb-article-content">
            <h4>Orientações</h4>
            ${paragraphs || '<p>Sem conteúdo detalhado.</p>'}
          </div>
        </div>
      `;
      if (viewModalCtrl) viewModalCtrl.open(triggerEl);
    }

    function openCreateModal(triggerEl) {
      if (isAtendente) return;
      state.editingId = null;
      clearFormErrors();
      formEl.reset();
      categoriaInput.value = 'atendimento';
      autorInput.value = session.name || 'Secretaria Escolar (Demo)';
      formTitleEl.textContent = 'Novo artigo na Base de Conhecimento';
      saveBtn.textContent = 'Publicar artigo (demo)';
      if (formModalCtrl) formModalCtrl.open(triggerEl);
      tituloInput.focus();
    }

    function openEditModal(id, triggerEl) {
      if (isAtendente) return;
      const art = service.getArticleById(id);
      if (!art) return;
      state.editingId = art.id;
      clearFormErrors();
      formTitleEl.textContent = `Editar artigo (${art.id})`;
      saveBtn.textContent = 'Salvar alterações';

      tituloInput.value = art.titulo || '';
      categoriaInput.value = art.categoria || 'atendimento';
      autorInput.value = art.autor || '';
      resumoInput.value = art.resumo || '';
      conteudoInput.value = art.conteudo || '';
      if (formModalCtrl) formModalCtrl.open(triggerEl);
      tituloInput.focus();
    }

    function openDeleteModal(id, triggerEl) {
      if (isAtendente) return;
      const art = service.getArticleById(id);
      if (!art) return;
      state.deletingId = art.id;
      deleteMsgEl.textContent = `Tem certeza que deseja excluir o artigo "${art.titulo}" (${art.id}) da base demonstrativa?`;
      if (deleteModalCtrl) deleteModalCtrl.open(triggerEl);
    }

    // Eventos
    searchInput.addEventListener('input', () => {
      state.search = searchInput.value;
      renderArticles();
    });

    catSelect.addEventListener('change', () => {
      state.category = catSelect.value;
      renderArticles();
    });

    catTabsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-kb-cat]');
      if (!btn) return;
      state.category = btn.getAttribute('data-kb-cat') || 'todos';
      renderArticles();
    });

    function clearAllFilters() {
      state.search = '';
      state.category = 'todos';
      searchInput.value = '';
      catSelect.value = 'todos';
      renderArticles();
    }

    clearBtn.addEventListener('click', clearAllFilters);
    container.querySelector('#btn-conhecimento-empty-clear').addEventListener('click', clearAllFilters);
    container.querySelector('#btn-new-artigo').addEventListener('click', (e) => openCreateModal(e.currentTarget));
    container.querySelector('#btn-conhecimento-empty-new').addEventListener('click', (e) => openCreateModal(e.currentTarget));

    emptyRestoreBtn.addEventListener('click', () => {
      service.restoreDemoArticles();
      clearAllFilters();
      notify('Artigos demonstrativos restaurados.');
    });

    gridEl.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      if (action === 'view') openViewModal(id, btn);
      else if (action === 'edit') openEditModal(id, btn);
      else if (action === 'delete') openDeleteModal(id, btn);
    });

    viewEditBtn.addEventListener('click', (e) => {
      const id = state.viewingId;
      if (!id) return;
      if (viewModalCtrl) viewModalCtrl.close(false);
      openEditModal(id, e.currentTarget);
    });

    viewDeleteBtn.addEventListener('click', (e) => {
      const id = state.viewingId;
      if (!id) return;
      if (viewModalCtrl) viewModalCtrl.close(false);
      openDeleteModal(id, e.currentTarget);
    });

    confirmDeleteBtn.addEventListener('click', () => {
      if (!state.deletingId) return;
      const removed = service.deleteArticle(state.deletingId);
      state.deletingId = null;
      if (deleteModalCtrl) deleteModalCtrl.close(false);
      renderArticles();
      if (removed) {
        notify(`Artigo "${removed.titulo}" excluído da base demonstrativa.`);
      }
    });

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      clearFormErrors();

      const titulo = tituloInput.value.trim();
      const categoria = categoriaInput.value;
      const autor = autorInput.value.trim();
      const resumo = resumoInput.value.trim();
      const conteudo = conteudoInput.value.trim();

      let ok = true;
      if (titulo.length < 4) ok = setFieldError(tituloInput, errTitulo, 'Informe um título com ao menos 4 caracteres.');
      if (!categoria) ok = setFieldError(categoriaInput, errCategoria, 'Selecione a categoria.');
      if (autor.length < 3) ok = setFieldError(autorInput, errAutor, 'Informe o autor demonstrativo.');
      if (resumo.length < 10) ok = setFieldError(resumoInput, errResumo, 'Informe um resumo breve (mínimo 10 caracteres).');
      if (conteudo.length < 15) ok = setFieldError(conteudoInput, errConteudo, 'Informe o conteúdo do artigo (mínimo 15 caracteres).');

      if (!ok) {
        const firstInvalid = formEl.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      const payload = { titulo, categoria, autor, resumo, conteudo };
      if (state.editingId) {
        const updated = service.updateArticle(state.editingId, payload);
        if (formModalCtrl) formModalCtrl.close(false);
        renderArticles();
        if (updated) notify(`Artigo "${updated.titulo}" atualizado.`);
      } else {
        const created = service.createArticle(payload, session.name);
        if (formModalCtrl) formModalCtrl.close(false);
        renderArticles();
        if (created) notify(`Artigo "${created.titulo}" adicionado à Base de Conhecimento.`);
      }
    });

    renderArticles();
  }

  globalScope.EnsinaAiCrmConhecimento = Object.freeze({
    renderConhecimentoModule
  });
})(window);
