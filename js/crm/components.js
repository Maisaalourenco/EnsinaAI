/**
 * ENSINA AÍ — CRM Escolar
 * Biblioteca de Componentes Reutilizáveis de Interface (js/crm/components.js)
 * JavaScript Vanilla ES6+ — Cards, Tabelas, Botões, Formulários, Modais, Alertas, Menus e Paginação
 */

(function initCrmComponentsModule(globalScope) {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Componente: Botão padronizado
   */
  function renderButton({
    id = '',
    label = '',
    variant = 'outline',
    size = '',
    type = 'button',
    className = '',
    attrs = '',
    disabled = false
  } = {}) {
    const classes = ['btn', `btn-${variant}`];
    if (size) classes.push(`btn-${size}`);
    if (className) classes.push(className);
    const idAttr = id ? ` id="${escapeHtml(id)}"` : '';
    const disabledAttr = disabled ? ' disabled' : '';
    const extraAttrs = attrs ? ` ${attrs}` : '';
    return `<button type="${escapeHtml(type)}"${idAttr} class="${escapeHtml(classes.join(' '))}"${disabledAttr}${extraAttrs}>${escapeHtml(label)}</button>`;
  }

  /**
   * Componente: Card de Indicador (KPI)
   */
  function renderKpiCard({
    id = '',
    label = '',
    value = '0',
    foot = '',
    footTone = '',
    accent = 'blue',
    valueId = ''
  } = {}) {
    const cardIdAttr = id ? ` id="${escapeHtml(id)}"` : '';
    const valueIdAttr = valueId ? ` id="${escapeHtml(valueId)}"` : '';
    const footClass = footTone ? ` ${escapeHtml(footTone)}` : '';
    return `
      <article class="crm-kpi-card accent-${escapeHtml(accent)}"${cardIdAttr}>
        <div class="crm-kpi-top">
          <span class="crm-kpi-label">${escapeHtml(label)}</span>
        </div>
        <strong class="crm-kpi-value"${valueIdAttr}>${escapeHtml(value)}</strong>
        ${foot ? `<span class="crm-kpi-foot${footClass}">${escapeHtml(foot)}</span>` : ''}
      </article>
    `;
  }

  /**
   * Componente: Alerta Contextual
   */
  function renderAlert({
    id = '',
    variant = 'info',
    title = '',
    message = '',
    dismissible = false
  } = {}) {
    const idAttr = id ? ` id="${escapeHtml(id)}"` : '';
    const role = variant === 'error' ? 'alert' : 'status';
    return `
      <div${idAttr} class="crm-alert crm-alert-${escapeHtml(variant)}" role="${role}">
        <div class="crm-alert-body">
          ${title ? `<strong>${escapeHtml(title)}</strong>` : ''}
          ${message ? `<p>${escapeHtml(message)}</p>` : ''}
        </div>
        ${
          dismissible
            ? '<button type="button" class="crm-toast-close" data-alert-dismiss aria-label="Fechar alerta">&times;</button>'
            : ''
        }
      </div>
    `;
  }

  /**
   * Componente: Estado Vazio
   */
  function renderEmptyState({
    id = '',
    title = 'Nenhum registro encontrado',
    description = 'Não há dados disponíveis para exibição no momento.',
    actionsHtml = ''
  } = {}) {
    const idAttr = id ? ` id="${escapeHtml(id)}"` : '';
    return `
      <div class="crm-empty-state"${idAttr}>
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(description)}</p>
        ${actionsHtml ? `<div class="crm-empty-actions">${actionsHtml}</div>` : ''}
      </div>
    `;
  }

  /**
   * Componente: Tabela Responsiva
   */
  function renderTable({
    columns = [],
    rowsHtml = '',
    emptyMessage = 'Nenhum dado registrado até o momento.',
    ariaLabel = 'Tabela de dados',
    tableClass = '',
    scrollId = '',
    tbodyId = ''
  } = {}) {
    const headersHtml = columns.map((col) => `<th>${escapeHtml(col)}</th>`).join('');
    const bodyContent =
      rowsHtml ||
      `<tr><td colspan="${Math.max(1, columns.length)}">${escapeHtml(emptyMessage)}</td></tr>`;
    const scrollIdAttr = scrollId ? ` id="${escapeHtml(scrollId)}"` : '';
    const tbodyIdAttr = tbodyId ? ` id="${escapeHtml(tbodyId)}"` : '';
    const tableClasses = tableClass ? `crm-table ${escapeHtml(tableClass)}` : 'crm-table';

    return `
      <div class="crm-table-scroll"${scrollIdAttr} role="region" aria-label="${escapeHtml(ariaLabel)}">
        <table class="${tableClasses}">
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody${tbodyIdAttr}>
            ${bodyContent}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Componente: Campo de Formulário
   */
  function renderFormField({
    id,
    name = '',
    label = '',
    type = 'text',
    value = '',
    placeholder = '',
    required = false,
    errorId = '',
    options = [],
    rows = 3,
    maxlength = ''
  } = {}) {
    const fieldName = name || id;
    const reqAttr = required ? ' required aria-required="true"' : '';
    const errId = errorId || `error-${id}`;
    const maxAttr = maxlength ? ` maxlength="${escapeHtml(maxlength)}"` : '';

    let controlHtml = '';
    if (type === 'select') {
      const optsHtml = options
        .map(
          (opt) =>
            `<option value="${escapeHtml(opt.value)}"${
              String(opt.value) === String(value) ? ' selected' : ''
            }>${escapeHtml(opt.label)}</option>`
        )
        .join('');
      controlHtml = `<select id="${escapeHtml(id)}" name="${escapeHtml(fieldName)}" class="form-control crm-input-compact" aria-describedby="${escapeHtml(errId)}"${reqAttr}>${optsHtml}</select>`;
    } else if (type === 'textarea') {
      controlHtml = `<textarea id="${escapeHtml(id)}" name="${escapeHtml(fieldName)}" class="form-control form-textarea" rows="${Number(rows) || 3}" placeholder="${escapeHtml(placeholder)}" aria-describedby="${escapeHtml(errId)}"${maxAttr}${reqAttr}>${escapeHtml(value)}</textarea>`;
    } else {
      controlHtml = `<input type="${escapeHtml(type)}" id="${escapeHtml(id)}" name="${escapeHtml(fieldName)}" class="form-control crm-input-compact" value="${escapeHtml(value)}" placeholder="${escapeHtml(placeholder)}" aria-describedby="${escapeHtml(errId)}"${maxAttr}${reqAttr} />`;
    }

    return `
      <div class="form-group">
        <label for="${escapeHtml(id)}" class="form-label">
          <span>${escapeHtml(label)}${required ? ' <span class="required-star" aria-hidden="true">*</span>' : ''}</span>
        </label>
        ${controlHtml}
        <span class="form-error-msg" id="${escapeHtml(errId)}" role="alert"></span>
      </div>
    `;
  }

  /**
   * Componente: Modal Acessível
   */
  function renderModal({
    id,
    titleId = '',
    title = '',
    subtitle = '',
    bodyHtml = '',
    footerHtml = '',
    wide = false
  } = {}) {
    const resolvedTitleId = titleId || `${id}-title`;
    const dialogClass = wide ? 'crm-modal-dialog crm-modal-dialog-wide' : 'crm-modal-dialog';

    return `
      <div
        class="crm-modal-backdrop"
        id="${escapeHtml(id)}"
        role="dialog"
        aria-modal="true"
        aria-labelledby="${escapeHtml(resolvedTitleId)}"
        hidden
      >
        <div class="${dialogClass}">
          <div class="crm-modal-header">
            <div>
              <h3 id="${escapeHtml(resolvedTitleId)}">${escapeHtml(title)}</h3>
              ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
            </div>
            <button type="button" class="crm-modal-close" data-modal-close aria-label="Fechar janela">&times;</button>
          </div>
          <div class="crm-modal-body">
            ${bodyHtml}
          </div>
          ${footerHtml ? `<div class="crm-modal-footer">${footerHtml}</div>` : ''}
        </div>
      </div>
    `;
  }

  function bindModalController(modalEl, options = {}) {
    if (!modalEl) return null;
    let lastFocused = null;

    const close = (restoreFocus = true) => {
      modalEl.hidden = true;
      if (typeof options.onClose === 'function') options.onClose();
      if (restoreFocus && lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    };

    const open = (triggerEl = null) => {
      lastFocused = triggerEl || (globalScope.document ? globalScope.document.activeElement : null);
      modalEl.hidden = false;
      const closeBtn = modalEl.querySelector('[data-modal-close]');
      if (closeBtn && typeof closeBtn.focus === 'function') {
        closeBtn.focus();
      }
    };

    modalEl.addEventListener('click', (e) => {
      if (e.target === modalEl || e.target.closest('[data-modal-close]')) {
        close(true);
      }
    });

    if (globalScope.document && typeof globalScope.document.addEventListener === 'function') {
      if (modalEl.__escapeHandler && typeof globalScope.document.removeEventListener === 'function') {
        globalScope.document.removeEventListener('keydown', modalEl.__escapeHandler);
      }
      modalEl.__escapeHandler = (e) => {
        if (e.key === 'Escape' && !modalEl.hidden) {
          close(true);
        }
      };
      globalScope.document.addEventListener('keydown', modalEl.__escapeHandler);
    }

    return { open, close };
  }

  /**
   * Componente: Menu Dropdown
   */
  function renderDropdownMenu({ id = '', items = [], ariaLabel = 'Opções' } = {}) {
    const idAttr = id ? ` id="${escapeHtml(id)}"` : '';
    const itemsHtml = items
      .map((item) => {
        if (item.divider) return '<div class="crm-menu-divider"></div>';
        const dangerClass = item.danger ? ' crm-menu-item-danger' : '';
        const actionAttr = item.action ? ` data-menu-action="${escapeHtml(item.action)}"` : '';
        return `<button type="button" class="crm-menu-item${dangerClass}" role="menuitem"${actionAttr}>${escapeHtml(item.label)}</button>`;
      })
      .join('');
    return `<div${idAttr} class="crm-dropdown-panel crm-profile-menu" role="menu" aria-label="${escapeHtml(ariaLabel)}" hidden>${itemsHtml}</div>`;
  }

  /**
   * Componente: Paginação
   */
  function renderPagination({ page = 1, totalPages = 1 } = {}) {
    if (totalPages <= 1) return '';
    const buttons = [];
    for (let p = 1; p <= totalPages; p++) {
      buttons.push(`
        <button
          type="button"
          class="crm-page-btn${p === page ? ' is-active' : ''}"
          data-page="${p}"
          ${p === page ? 'aria-current="page"' : ''}
        >${p}</button>
      `);
    }

    return `
      <button type="button" class="crm-page-btn" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''}>
        Anterior
      </button>
      <div class="crm-page-numbers">${buttons.join('')}</div>
      <button type="button" class="crm-page-btn" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''}>
        Próxima
      </button>
    `;
  }

  globalScope.EnsinaAiCrmComponents = Object.freeze({
    escapeHtml,
    renderButton,
    renderKpiCard,
    renderAlert,
    renderEmptyState,
    renderTable,
    renderFormField,
    renderModal,
    bindModalController,
    renderDropdownMenu,
    renderPagination
  });
})(window);
