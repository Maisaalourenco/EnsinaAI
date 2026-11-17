/**
 * ENSINA AÍ — CRM Escolar
 * Módulo de Navegação, Sidebar e Rotas (js/crm/navigation.js)
 * JavaScript Vanilla ES6+
 */

(function initCrmNavigationModule(globalScope) {
  'use strict';

  const SIDEBAR_COLLAPSED_KEY = 'ensina_ai_crm_sidebar_collapsed';

  const NAV_CATEGORIES = [
    {
      category: 'Visão Geral',
      items: [
        { id: 'dashboard', label: 'Dashboard', badge: '', icon: 'dashboard' }
      ]
    },
    {
      category: 'Captação & Atendimento',
      items: [
        { id: 'leads', label: 'Leads', badge: '', icon: 'users' },
        { id: 'atendimentos', label: 'Atendimentos', badge: '', icon: 'message' },
        { id: 'tarefas', label: 'Tarefas', badge: 'Em breve', icon: 'check-square' },
        { id: 'visitas', label: 'Visitas', badge: 'Em breve', icon: 'calendar' }
      ]
    },
    {
      category: 'Gestão & Conhecimento',
      items: [
        { id: 'relatorios', label: 'Relatórios', badge: 'Em breve', icon: 'bar-chart' },
        { id: 'equipe', label: 'Equipe', badge: 'Em breve', icon: 'shield' },
        { id: 'base-conhecimento', label: 'Base de conhecimento', badge: 'Em breve', icon: 'book' }
      ]
    },
    {
      category: 'Sistema',
      items: [
        { id: 'configuracoes', label: 'Configurações', badge: 'Em breve', icon: 'settings' }
      ]
    }
  ];

  const MODULE_META = {
    dashboard: {
      title: 'Dashboard',
      category: 'Visão Geral',
      description: 'Indicadores gerais de captação, atendimentos e conversões escolares.',
      plannedCapabilities: []
    },
    leads: {
      title: 'Leads',
      category: 'Captação & Atendimento',
      description: 'Gestão de responsáveis interessados captados pelo site, WhatsApp e atendimento presencial.',
      plannedCapabilities: [
        { title: 'Listagem e Filtros', text: 'Busca por responsável, etapa escolar, turno e canal de entrada.' },
        { title: 'Distribuição de Carteira', text: 'Atribuição automática e redistribuição manual pelo gestor.' },
        { title: 'Detalhamento LGPD', text: 'Registro de consentimento, data e versão do aviso de privacidade.' }
      ],
      previewColumns: ['Responsável', 'Etapa de Interesse', 'Canal', 'Status Demonstrativo']
    },
    atendimentos: {
      title: 'Atendimentos',
      category: 'Captação & Atendimento',
      description: 'Acompanhamento do funil completo com linha do tempo de interações e registro de conversões.',
      plannedCapabilities: [
        { title: 'Funil Operacional', text: 'Transição controlada entre Novo, Em contato, Retorno, Visita e Concluído.' },
        { title: 'Histórico de Interações', text: 'Registro de contatos por WhatsApp, telefone, e-mail e notas internas.' },
        { title: 'Tempo de Resposta', text: 'Monitoramento de SLA de primeira resposta e motivos de perda.' }
      ],
      previewColumns: ['Protocolo', 'Responsável', 'Atendente', 'Etapa do Funil']
    },
    tarefas: {
      title: 'Tarefas',
      category: 'Captação & Atendimento',
      description: 'Organização de retornos (follow-ups), ligações agendadas e pendências da equipe.',
      plannedCapabilities: [
        { title: 'Fila de Follow-ups', text: 'Priorização de retornos vencidos, do dia e programados.' },
        { title: 'Responsável e Prazo', text: 'Controle individual por atendente e acompanhamento do gestor.' },
        { title: 'Conclusão Auditável', text: 'Registro de conclusão com observação operacional.' }
      ],
      previewColumns: ['Tarefa', 'Atendimento', 'Vencimento', 'Situação']
    },
    visitas: {
      title: 'Visitas',
      category: 'Captação & Atendimento',
      description: 'Calendário de visitas guiadas das famílias ao campus escolar.',
      plannedCapabilities: [
        { title: 'Agendamento Guiado', text: 'Definição de data, horário e responsável pelo acolhimento.' },
        { title: 'Confirmação e Presença', text: 'Registro de realizada, cancelada ou não compareceu.' },
        { title: 'Lembretes Operacionais', text: 'Integração visual com a agenda do dia no Dashboard.' }
      ],
      previewColumns: ['Família', 'Data / Horário', 'Etapa Desejada', 'Situação']
    },
    relatorios: {
      title: 'Relatórios',
      category: 'Gestão & Conhecimento',
      description: 'Indicadores consolidados de conversão, desempenho por etapa e produtividade.',
      plannedCapabilities: [
        { title: 'Taxa de Conversão', text: 'Comparativo por período, série escolar, turno e canal de origem.' },
        { title: 'Desempenho da Equipe', text: 'Indicadores de tempo médio de resposta e matrículas concluídas.' },
        { title: 'Exportação Estruturada', text: 'Relatórios gerenciais preparados para exportação segura.' }
      ],
      previewColumns: ['Indicador', 'Período', 'Referência', 'Visualização']
    },
    equipe: {
      title: 'Equipe',
      category: 'Gestão & Conhecimento',
      description: 'Administração de perfis (Gestor e Atendente), status ativo e disponibilidade na fila.',
      plannedCapabilities: [
        { title: 'Perfis de Acesso', text: 'Separação clara entre atribuições de Gestor Escolar e Atendente.' },
        { title: 'Controle de Disponibilidade', text: 'Ativação ou pausa na distribuição automática de novos leads.' },
        { title: 'Carga da Carteira', text: 'Visão equilibrada dos atendimentos em aberto por colaborador.' }
      ],
      previewColumns: ['Colaborador', 'Perfil', 'Disponibilidade', 'Carteira Aberta']
    },
    'base-conhecimento': {
      title: 'Base de conhecimento',
      category: 'Gestão & Conhecimento',
      description: 'Repositório interno de orientações pedagógicas, calendário, documentos e respostas padrão.',
      plannedCapabilities: [
        { title: 'Respostas Padronizadas', text: 'Guias rápidos para dúvidas frequentes sobre matrícula e rotina.' },
        { title: 'Aprovação Pedagógica', text: 'Publicação controlada de informações institucionais validadas.' },
        { title: 'Consulta Ágil', text: 'Pesquisa por categoria durante o atendimento às famílias.' }
      ],
      previewColumns: ['Tema', 'Categoria', 'Público-alvo', 'Situação']
    },
    configuracoes: {
      title: 'Configurações',
      category: 'Sistema',
      description: 'Parâmetros institucionais da escola, séries escolares, turnos e preferências de interface.',
      plannedCapabilities: [
        { title: 'Catálogos Escolares', text: 'Manutenção das etapas de ensino e turnos ofertados.' },
        { title: 'Dados da Escola', text: 'Horários de atendimento, canais oficiais e endereço do campus.' },
        { title: 'Preferências Visuais', text: 'Ajustes de exibição e preferências operacionais do painel.' }
      ],
      previewColumns: ['Parâmetro', 'Escopo', 'Responsável', 'Estado']
    }
  };

  function getIconSvg(name) {
    const icons = {
      dashboard: '<rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect>',
      users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>',
      message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>',
      'check-square': '<polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>',
      calendar: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line>',
      'bar-chart': '<line x1="12" x2="12" y1="20" y2="10"></line><line x1="18" x2="18" y1="20" y2="4"></line><line x1="6" x2="6" y1="20" y2="16"></line>',
      shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>',
      book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>',
      settings: '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>'
    };
    const path = icons[name] || icons.dashboard;
    return `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function resolveRoute(rawRoute) {
    const clean = String(rawRoute || '').replace(/^#/, '').trim().toLowerCase();
    return MODULE_META[clean] ? clean : 'dashboard';
  }

  function renderSidebarNav(container, activeRoute) {
    if (!container) return;

    container.innerHTML = NAV_CATEGORIES.map((group) => {
      const itemsHtml = group.items
        .map((item) => {
          const isActive = item.id === activeRoute;
          const badgeHtml = item.badge
            ? `<span class="crm-nav-pill">${escapeHtml(item.badge)}</span>`
            : '';
          return `
            <li>
              <a
                href="#${escapeHtml(item.id)}"
                class="crm-nav-item-link${isActive ? ' is-active' : ''}"
                data-route="${escapeHtml(item.id)}"
                title="${escapeHtml(item.label)}"
                ${isActive ? 'aria-current="page"' : ''}
              >
                <span class="crm-nav-icon">${getIconSvg(item.icon)}</span>
                <span class="crm-nav-label">${escapeHtml(item.label)}</span>
                ${badgeHtml}
              </a>
            </li>
          `;
        })
        .join('');

      return `
        <div class="crm-nav-group">
          <div class="crm-nav-group-title">${escapeHtml(group.category)}</div>
          <ul class="crm-nav-list">${itemsHtml}</ul>
        </div>
      `;
    }).join('');
  }

  function updateHeaderMeta(routeId) {
    const meta = MODULE_META[routeId] || MODULE_META.dashboard;
    const titleEl = document.getElementById('crm-page-title');
    const breadcrumbEl = document.getElementById('crm-breadcrumb');

    if (titleEl) {
      titleEl.textContent = meta.title;
    }

    if (breadcrumbEl) {
      breadcrumbEl.innerHTML = `
        <span>CRM ENSINA AÍ</span>
        <span aria-hidden="true">/</span>
        <span>${escapeHtml(meta.category)}</span>
        <span aria-hidden="true">/</span>
        <span class="crm-breadcrumb-current">${escapeHtml(meta.title)}</span>
      `;
    }

    if (globalScope.document) {
      globalScope.document.title = `${meta.title} | CRM ENSINA AÍ`;
    }
  }

  function renderPlannedModuleView(container, routeId, onReturnDashboard) {
    if (!container) return;
    const meta = MODULE_META[routeId] || MODULE_META.leads;
    const comp = globalScope.EnsinaAiCrmComponents || null;

    const capabilitiesHtml = (meta.plannedCapabilities || [])
      .map(
        (cap) => `
          <div class="crm-placeholder-check-item">
            <strong>${escapeHtml(cap.title)}</strong>
            <span>${escapeHtml(cap.text)}</span>
          </div>
        `
      )
      .join('');

    const columns = meta.previewColumns || [];
    const tableHtml = comp
      ? comp.renderTable({
          columns,
          rowsHtml: '',
          emptyMessage: `Nenhum registro cadastrado em ${meta.title} nesta etapa demonstrativa.`,
          ariaLabel: `Prévia estrutural da grade de ${meta.title}`
        })
      : `
        <div class="crm-table-scroll" role="region" aria-label="Prévia estrutural da grade de ${escapeHtml(meta.title)}">
          <table class="crm-table">
            <thead>
              <tr>${columns.map((col) => `<th>${escapeHtml(col)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="${columns.length || 4}">
                  Nenhum registro cadastrado em ${escapeHtml(meta.title)} nesta etapa demonstrativa.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `;

    const emptyNoticeHtml = comp
      ? comp.renderEmptyState({
          title: `Módulo ${meta.title} aguardando dados`,
          description:
            'A estrutura de navegação e grade de exibição já estão prontas para receber os fluxos operacionais nas próximas etapas.',
          actionsHtml:
            '<button type="button" class="btn btn-primary btn-sm" id="crm-empty-back-dashboard">Explorar Dashboard</button>'
        })
      : '';

    container.innerHTML = `
      <section class="crm-placeholder-card" aria-label="Estrutura futura do módulo ${escapeHtml(meta.title)}">
        <div class="crm-placeholder-header">
          <div>
            <span class="crm-placeholder-tag">Módulo em Desenvolvimento &bull; Estrutura Navegável</span>
            <h2>${escapeHtml(meta.title)}</h2>
            <p>${escapeHtml(meta.description)}</p>
          </div>
          <button type="button" class="btn btn-outline" id="crm-back-to-dashboard-btn">
            Voltar ao Dashboard
          </button>
        </div>

        <div class="crm-placeholder-checklist">
          ${capabilitiesHtml}
        </div>

        ${tableHtml}

        ${emptyNoticeHtml ? `<div style="margin-top: 1.25rem;">${emptyNoticeHtml}</div>` : ''}
      </section>
    `;

    const backBtn = container.querySelector('#crm-back-to-dashboard-btn');
    const emptyBackBtn = container.querySelector('#crm-empty-back-dashboard');
    if (backBtn && typeof onReturnDashboard === 'function') {
      backBtn.addEventListener('click', onReturnDashboard);
    }
    if (emptyBackBtn && typeof onReturnDashboard === 'function') {
      emptyBackBtn.addEventListener('click', onReturnDashboard);
    }
  }

  function setupSidebarControls(onRouteSelect) {
    const layout = document.getElementById('crm-layout');
    const sidebarNav = document.getElementById('crm-sidebar-nav');
    const collapseBtn = document.getElementById('crm-sidebar-collapse-btn');
    const mobileMenuBtn = document.getElementById('crm-mobile-menu-btn');
    const closeMobileBtn = document.getElementById('crm-sidebar-close-mobile');
    const backdrop = document.getElementById('crm-sidebar-backdrop');
    const brandLink = document.querySelector('.crm-brand-link');

    if (!layout) return;

    try {
      if (globalScope.sessionStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1') {
        layout.classList.add('is-sidebar-collapsed');
        if (collapseBtn) {
          collapseBtn.setAttribute('aria-expanded', 'false');
          collapseBtn.setAttribute('aria-label', 'Expandir menu lateral');
        }
      }
    } catch {
      // Ignora caso sessionStorage esteja indisponível
    }

    const closeMobileDrawer = (restoreFocus = false) => {
      layout.classList.remove('is-mobile-open');
      if (backdrop) backdrop.classList.remove('is-active');
      if (mobileMenuBtn) {
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
        if (restoreFocus) mobileMenuBtn.focus();
      }
      if (globalScope.document && globalScope.document.body) {
        globalScope.document.body.style.overflow = '';
      }
    };

    const openMobileDrawer = () => {
      layout.classList.add('is-mobile-open');
      if (backdrop) backdrop.classList.add('is-active');
      if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
      if (globalScope.document && globalScope.document.body) {
        globalScope.document.body.style.overflow = 'hidden';
      }
      if (closeMobileBtn) closeMobileBtn.focus();
    };

    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        const collapsed = layout.classList.toggle('is-sidebar-collapsed');
        collapseBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
        collapseBtn.setAttribute(
          'aria-label',
          collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'
        );
        try {
          globalScope.sessionStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0');
        } catch {
          // Sem impacto funcional
        }
      });
    }

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', openMobileDrawer);
    }

    if (closeMobileBtn) {
      closeMobileBtn.addEventListener('click', () => closeMobileDrawer(true));
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => closeMobileDrawer(true));
    }

    if (sidebarNav) {
      sidebarNav.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-route]');
        if (!link) return;
        e.preventDefault();
        const route = resolveRoute(link.getAttribute('data-route'));
        closeMobileDrawer(false);
        if (typeof onRouteSelect === 'function') {
          onRouteSelect(route);
        }
      });
    }

    if (brandLink) {
      brandLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileDrawer(false);
        if (typeof onRouteSelect === 'function') {
          onRouteSelect('dashboard');
        }
      });
    }

    globalScope.document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && layout.classList.contains('is-mobile-open')) {
        closeMobileDrawer(true);
      }
    });

    globalScope.addEventListener('resize', () => {
      if (globalScope.innerWidth > 768 && layout.classList.contains('is-mobile-open')) {
        closeMobileDrawer(false);
      }
    });
  }

  globalScope.EnsinaAiCrmNavigation = Object.freeze({
    NAV_CATEGORIES,
    MODULE_META,
    resolveRoute,
    renderSidebarNav,
    updateHeaderMeta,
    renderPlannedModuleView,
    setupSidebarControls
  });
})(window);
