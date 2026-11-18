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
        { id: 'tarefas', label: 'Tarefas', badge: '', icon: 'check-square' },
        { id: 'visitas', label: 'Visitas', badge: '', icon: 'calendar' }
      ]
    },
    {
      category: 'Gestão & Conhecimento',
      items: [
        { id: 'relatorios', label: 'Relatórios', badge: '', icon: 'bar-chart' },
        { id: 'equipe', label: 'Equipe', badge: '', icon: 'shield' },
        { id: 'base-conhecimento', label: 'Base de conhecimento', badge: '', icon: 'book' }
      ]
    },
    {
      category: 'Sistema',
      items: [
        { id: 'configuracoes', label: 'Configurações', badge: '', icon: 'settings' }
      ]
    }
  ];

  const MODULE_META = {
    dashboard: {
      title: 'Dashboard',
      category: 'Visão Geral',
      description: 'Visão gerencial de captação, atendimentos, funil de conversão, visitas e matrículas.',
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
      description: 'Administração visual de colaboradores, cargos demonstrativos, disponibilidade e indicadores individuais.',
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

  const ROLE_NAV_CATEGORIES = {
    atendente: [
      {
        category: 'Minha Visão',
        items: [{ id: 'dashboard', label: 'Meu Dashboard', badge: '', icon: 'dashboard' }]
      },
      {
        category: 'Minha Carteira',
        items: [
          { id: 'leads', label: 'Meus Leads', badge: '', icon: 'users' },
          { id: 'atendimentos', label: 'Meus Atendimentos', badge: '', icon: 'message' },
          { id: 'tarefas', label: 'Minhas Tarefas', badge: '', icon: 'check-square' },
          { id: 'visitas', label: 'Minhas Visitas', badge: '', icon: 'calendar' }
        ]
      },
      {
        category: 'Acompanhamento',
        items: [
          { id: 'relatorios', label: 'Meu Desempenho', badge: '', icon: 'bar-chart' },
          { id: 'base-conhecimento', label: 'Base de Conhecimento', badge: '', icon: 'book' }
        ]
      },
      {
        category: 'Conta',
        items: [{ id: 'configuracoes', label: 'Meu Perfil', badge: '', icon: 'settings' }]
      }
    ],
    gestor: [
      {
        category: 'Visão Geral',
        items: [{ id: 'dashboard', label: 'Dashboard Geral', badge: '', icon: 'dashboard' }]
      },
      {
        category: 'Operação & Captação',
        items: [
          { id: 'leads', label: 'Gestão de Leads', badge: '', icon: 'users' },
          { id: 'atendimentos', label: 'Atendimentos', badge: '', icon: 'message' },
          { id: 'tarefas', label: 'Gestão de Tarefas', badge: '', icon: 'check-square' },
          { id: 'visitas', label: 'Agenda de Visitas', badge: '', icon: 'calendar' }
        ]
      },
      {
        category: 'Direção & Análise',
        items: [
          { id: 'relatorios', label: 'Relatórios', badge: '', icon: 'bar-chart' },
          { id: 'equipe', label: 'Equipe', badge: '', icon: 'shield' },
          { id: 'base-conhecimento', label: 'Base de Conhecimento', badge: '', icon: 'book' }
        ]
      },
      {
        category: 'Sistema',
        items: [{ id: 'configuracoes', label: 'Configurações', badge: '', icon: 'settings' }]
      }
    ]
  };

  const ROLE_MODULE_META = {
    atendente: {
      dashboard: {
        title: 'Meu Dashboard',
        category: 'Minha Visão',
        description: 'Agenda do dia, retornos pendentes, tarefas atrasadas e resultados da sua carteira individual.'
      },
      leads: {
        title: 'Meus Leads',
        category: 'Minha Carteira',
        description: 'Carteira individual de famílias atribuídas a você para atendimento e acompanhamento de matrícula.'
      },
      atendimentos: {
        title: 'Meus Atendimentos',
        category: 'Minha Carteira',
        description: 'Registro de contatos realizados, notas internas, retornos programados e evolução da sua carteira.'
      },
      tarefas: {
        title: 'Minhas Tarefas',
        category: 'Minha Carteira',
        description: 'Sua fila diária de follow-ups, ligações e compromissos com destaque para prazos vencidos.'
      },
      visitas: {
        title: 'Minhas Visitas',
        category: 'Minha Carteira',
        description: 'Agenda das visitas guiadas sob sua responsabilidade, confirmações e registro de comparecimento.'
      },
      relatorios: {
        title: 'Meu Desempenho',
        category: 'Acompanhamento',
        description: 'Indicadores individuais de atendimentos, visitas, tarefas concluídas e conversões da sua carteira.'
      },
      equipe: {
        title: 'Acesso Restrito',
        category: 'Gestão Escolar',
        description: 'Módulo gerencial disponível exclusivamente para o perfil Gestor Escolar.'
      },
      'base-conhecimento': {
        title: 'Base de Conhecimento',
        category: 'Acompanhamento',
        description: 'Consulta rápida a orientações pedagógicas, calendário, valores e roteiros de atendimento.'
      },
      configuracoes: {
        title: 'Meu Perfil',
        category: 'Conta',
        description: 'Suas informações de perfil demonstrativo, preferências de notificações e ajustes de interface.'
      }
    },
    gestor: {
      dashboard: {
        title: 'Dashboard Geral',
        category: 'Visão Geral',
        description: 'Visão gerencial completa da captação escolar, gargalos, funil de conversão e produtividade da equipe.'
      },
      leads: {
        title: 'Gestão de Leads',
        category: 'Operação & Captação',
        description: 'Distribuição de carteira, acompanhamento de leads sem responsável e visão global de captação.'
      },
      atendimentos: {
        title: 'Atendimentos',
        category: 'Operação & Captação',
        description: 'Visão completa de todos os atendimentos da escola por colaborador, canal, retorno e etapa.'
      },
      tarefas: {
        title: 'Gestão de Tarefas',
        category: 'Operação & Captação',
        description: 'Acompanhamento de carga operacional, redistribuição entre atendentes e controle de atrasos da equipe.'
      },
      visitas: {
        title: 'Agenda de Visitas',
        category: 'Operação & Captação',
        description: 'Agenda geral de visitas guiadas da escola com filtro por responsável interno e período.'
      },
      relatorios: {
        title: 'Relatórios',
        category: 'Direção & Análise',
        description: 'Relatórios gerenciais completos, comparativo entre atendentes, origens, perdas e exportação CSV.'
      },
      equipe: {
        title: 'Equipe',
        category: 'Direção & Análise',
        description: 'Administração de colaboradores, papéis demonstrativos, disponibilidade e indicadores individuais.'
      },
      'base-conhecimento': {
        title: 'Base de Conhecimento',
        category: 'Direção & Análise',
        description: 'Criação, atualização e publicação de orientações internas e guias para toda a equipe.'
      },
      configuracoes: {
        title: 'Configurações',
        category: 'Sistema',
        description: 'Parâmetros institucionais da escola, dados operacionais, perfil e preferências do CRM.'
      }
    }
  };

  function normalizeRole(role) {
    return role === 'atendente' ? 'atendente' : 'gestor';
  }

  function getNavCategoriesForRole(role = 'gestor') {
    const normalized = normalizeRole(role);
    return ROLE_NAV_CATEGORIES[normalized] || NAV_CATEGORIES;
  }

  function getModuleMetaForRole(routeId, role = 'gestor') {
    const normalized = normalizeRole(role);
    const base = MODULE_META[routeId] || MODULE_META.dashboard;
    const roleMeta = (ROLE_MODULE_META[normalized] && ROLE_MODULE_META[normalized][routeId]) || {};
    return {
      ...base,
      ...roleMeta
    };
  }

  function isRouteAllowedForRole(routeId, role = 'gestor') {
    const normalized = normalizeRole(role);
    if (normalized === 'atendente' && routeId === 'equipe') {
      return false;
    }
    return true;
  }

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

  function renderSidebarNav(container, activeRoute, role = 'gestor') {
    if (!container) return;

    const categories = getNavCategoriesForRole(role);

    container.innerHTML = categories.map((group) => {
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

  function updateHeaderMeta(routeId, role = 'gestor') {
    const meta = getModuleMetaForRole(routeId, role);
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

  function renderRestrictedModuleView(container, role, onReturnDashboard) {
    if (!container) return;
    const roleLabel = role === 'atendente' ? 'Atendente' : 'Colaborador';
    container.innerHTML = `
      <section class="crm-guard-card" role="region" aria-label="Área restrita ao perfil Gestor Escolar">
        <div class="crm-guard-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <span class="crm-guard-badge">Simulação visual de perfil &bull; Acesso gerencial</span>
        <h2>Gestão de Equipe indisponível no perfil ${escapeHtml(roleLabel)}</h2>
        <p>
          O gerenciamento de colaboradores, permissões e comparativos da equipe faz parte da visão de
          <strong>Gestor Escolar</strong>. No perfil <strong>Atendente</strong>, você visualiza apenas sua própria carteira operacional.
        </p>
        <p class="crm-guard-note">
          Nota técnica: nesta etapa de front-end a separação de menus e telas é exclusivamente demonstrativa; a validação definitiva de permissões será aplicada no back-end.
        </p>
        <div class="crm-guard-actions">
          <button type="button" class="btn btn-primary" id="crm-guard-back-dashboard">
            Ir para Meu Dashboard
          </button>
        </div>
      </section>
    `;

    const backBtn = container.querySelector('#crm-guard-back-dashboard');
    if (backBtn && typeof onReturnDashboard === 'function') {
      backBtn.addEventListener('click', onReturnDashboard);
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
    getNavCategoriesForRole,
    getModuleMetaForRole,
    isRouteAllowedForRole,
    resolveRoute,
    renderSidebarNav,
    updateHeaderMeta,
    renderPlannedModuleView,
    renderRestrictedModuleView,
    setupSidebarControls
  });
})(window);
