/**
 * ENSINA AÍ — CRM Escolar
 * Controlador Principal da Aplicação CRM e Login Visual (js/crm/app.js)
 * JavaScript Vanilla ES6+ — Sem autenticação real ou chamadas a banco de dados
 */

(function initCrmAppModule(globalScope) {
  'use strict';

  const DEMO_SESSION_KEY = 'ensina_ai_crm_demo_session';

  /**
   * ATENÇÃO: Perfis demonstrativos em memória/sessionStorage apenas para simular
   * a experiência de Atendente vs. Gestor Escolar no front-end.
   * A autenticação real e a autorização definitiva serão implementadas no back-end.
   */
  const DEMO_PROFILES = Object.freeze({
    gestor: {
      role: 'gestor',
      roleLabel: 'Gestor Escolar',
      scopeLabel: 'Visão Gerencial • Toda a escola',
      name: 'Coordenação Demo',
      initials: 'CD',
      email: 'gestor.demo@ensinaai.edu.br',
      capabilities: {
        scope: 'all',
        canManageTeam: true,
        canDistributeLeads: true,
        canReassignTasks: true,
        canManageKnowledgeBase: true,
        canManageSchoolSettings: true,
        canViewTeamComparison: true
      }
    },
    atendente: {
      role: 'atendente',
      roleLabel: 'Atendente',
      scopeLabel: 'Visão Operacional • Minha carteira',
      name: 'Secretaria Demo',
      initials: 'SD',
      email: 'atendimento.demo@ensinaai.edu.br',
      capabilities: {
        scope: 'own',
        canManageTeam: false,
        canDistributeLeads: false,
        canReassignTasks: false,
        canManageKnowledgeBase: false,
        canManageSchoolSettings: false,
        canViewTeamComparison: false
      }
    }
  });

  const DEMO_NOTIFICATIONS = [
    {
      id: 'n1',
      title: 'Novo lead recebido (demo)',
      text: 'Mariana Oliveira demonstrou interesse no Ensino Fundamental I.',
      time: 'Há 12 minutos',
      unread: true
    },
    {
      id: 'n2',
      title: 'Visita programada hoje (demo)',
      text: 'Família Rodrigues confirmou visita ao campus às 14h30.',
      time: 'Há 1 hora',
      unread: true
    },
    {
      id: 'n3',
      title: 'Retorno pendente (demo)',
      text: 'Atendimento de Eduardo Ferreira aguarda retorno da secretaria.',
      time: 'Há 3 horas',
      unread: true
    }
  ];

  function getStoredDemoSession() {
    try {
      const raw = globalScope.sessionStorage.getItem(DEMO_SESSION_KEY);
      if (!raw) return DEMO_PROFILES.gestor;
      const parsed = JSON.parse(raw);
      return DEMO_PROFILES[parsed.role] || DEMO_PROFILES.gestor;
    } catch {
      return DEMO_PROFILES.gestor;
    }
  }

  function saveDemoSession(role) {
    const profile = DEMO_PROFILES[role] || DEMO_PROFILES.gestor;
    try {
      globalScope.sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify({ role: profile.role }));
    } catch {
      // Sem impacto caso sessionStorage esteja bloqueado
    }
    return profile;
  }

  function clearDemoSession() {
    try {
      globalScope.sessionStorage.removeItem(DEMO_SESSION_KEY);
    } catch {
      // Sem impacto
    }
  }

  function initLoginPage() {
    const form = document.getElementById('crm-login-form');
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const emailError = document.getElementById('error-login-email');
    const passwordError = document.getElementById('error-login-password');
    const loginErrorBanner = document.getElementById('login-error-banner');
    const submitBtn = document.getElementById('btn-login-submit');
    const submitText = document.getElementById('btn-login-submit-text');
    const spinner = document.getElementById('login-spinner');
    const togglePasswordBtn = document.getElementById('toggle-password-visibility');
    const forgotBtn = document.getElementById('btn-forgot-password');
    const recoveryPanel = document.getElementById('login-recovery-panel');
    const recoveryEmail = document.getElementById('recovery-email');
    const recoveryEmailError = document.getElementById('error-recovery-email');
    const recoveryFeedback = document.getElementById('recovery-feedback');
    const recoverySendBtn = document.getElementById('btn-recovery-send');
    const recoveryBackBtn = document.getElementById('btn-recovery-back');
    const demoAccessBtn = document.getElementById('btn-demo-access');

    if (!form) return;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    function setFieldError(input, errorEl, message) {
      if (!input || !errorEl) return !message;
      if (message) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        input.setAttribute('aria-invalid', 'true');
        errorEl.textContent = message;
        errorEl.classList.add('show');
        return false;
      }
      input.classList.remove('is-invalid');
      if (input.value.trim()) input.classList.add('is-valid');
      input.removeAttribute('aria-invalid');
      errorEl.textContent = '';
      errorEl.classList.remove('show');
      return true;
    }

    function validateEmailField() {
      const val = emailInput.value.trim();
      if (!val) return setFieldError(emailInput, emailError, 'Informe seu e-mail institucional.');
      if (!emailRegex.test(val)) return setFieldError(emailInput, emailError, 'Informe um e-mail válido.');
      return setFieldError(emailInput, emailError, '');
    }

    function validatePasswordField() {
      const val = passwordInput.value;
      if (!val) return setFieldError(passwordInput, passwordError, 'Informe sua senha de acesso.');
      if (val.length < 6) return setFieldError(passwordInput, passwordError, 'A senha deve conter ao menos 6 caracteres.');
      return setFieldError(passwordInput, passwordError, '');
    }

    if (emailInput) {
      emailInput.addEventListener('blur', validateEmailField);
      emailInput.addEventListener('input', () => {
        if (loginErrorBanner) loginErrorBanner.hidden = true;
        if (emailInput.classList.contains('is-invalid')) validateEmailField();
      });
    }

    if (passwordInput) {
      passwordInput.addEventListener('blur', validatePasswordField);
      passwordInput.addEventListener('input', () => {
        if (loginErrorBanner) loginErrorBanner.hidden = true;
        if (passwordInput.classList.contains('is-invalid')) validatePasswordField();
      });
    }

    if (togglePasswordBtn && passwordInput) {
      const eyeOpen = togglePasswordBtn.querySelector('.icon-eye-open');
      const eyeClosed = togglePasswordBtn.querySelector('.icon-eye-closed');

      togglePasswordBtn.addEventListener('click', () => {
        const isMasked = passwordInput.type === 'password';
        passwordInput.type = isMasked ? 'text' : 'password';
        togglePasswordBtn.setAttribute('aria-pressed', isMasked ? 'true' : 'false');
        togglePasswordBtn.setAttribute('aria-label', isMasked ? 'Ocultar senha' : 'Mostrar senha');
        if (eyeOpen) eyeOpen.hidden = isMasked;
        if (eyeClosed) eyeClosed.hidden = !isMasked;
      });
    }

    if (forgotBtn && recoveryPanel) {
      forgotBtn.addEventListener('click', () => {
        form.hidden = true;
        recoveryPanel.hidden = false;
        if (recoveryFeedback) recoveryFeedback.hidden = true;
        if (recoveryEmail) {
          recoveryEmail.value = emailInput ? emailInput.value.trim() : '';
          setFieldError(recoveryEmail, recoveryEmailError, '');
          recoveryEmail.focus();
        }
      });
    }

    if (recoveryBackBtn && recoveryPanel) {
      recoveryBackBtn.addEventListener('click', () => {
        recoveryPanel.hidden = true;
        form.hidden = false;
        if (emailInput) emailInput.focus();
      });
    }

    if (recoveryEmail) {
      recoveryEmail.addEventListener('input', () => {
        if (recoveryEmail.classList.contains('is-invalid')) {
          const val = recoveryEmail.value.trim();
          if (val && emailRegex.test(val)) {
            setFieldError(recoveryEmail, recoveryEmailError, '');
          }
        }
      });
    }

    if (recoverySendBtn && recoveryEmail) {
      recoverySendBtn.addEventListener('click', () => {
        const val = recoveryEmail.value.trim();
        if (!val || !emailRegex.test(val)) {
          setFieldError(recoveryEmail, recoveryEmailError, 'Informe um e-mail válido para recuperação.');
          recoveryEmail.focus();
          return;
        }
        setFieldError(recoveryEmail, recoveryEmailError, '');
        if (recoveryFeedback) {
          recoveryFeedback.textContent =
            'Interface de recuperação validada. O envio real de link será conectado na etapa de autenticação.';
          recoveryFeedback.hidden = false;
        }
      });
    }


form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (loginErrorBanner) loginErrorBanner.hidden = true;

  const emailOk = validateEmailField();
  const passOk = validatePasswordField();

  if (!emailOk) {
    emailInput.focus();
    return;
  }

  if (!passOk) {
    passwordInput.focus();
    return;
  }

  if (submitBtn) submitBtn.disabled = true;
  if (spinner) spinner.hidden = false;
  if (submitText) submitText.textContent = 'Autenticando...';
  form.setAttribute('aria-busy', 'true');

  try {
    if (!window.EnsinaAiCrmAuth) {
      throw new Error('Serviço de autenticação indisponível.');
    }

    const resultado = await window.EnsinaAiCrmAuth.entrar(
      emailInput.value.trim(),
      passwordInput.value
    );

    console.log('Autenticação validada. Papel:', resultado.perfil.papel);


    // Remove o modo demonstração, caso esteja ativo.
    clearDemoSession();

    // Abre o CRM com a sessão real do Supabase.
    const targetUrl =
      document.body.getAttribute('data-crm-dashboard-url') ||
      '../crm.html#dashboard';

    globalScope.location.href = targetUrl;


    // A navegação será habilitada após protegermos
    // o painel e conectarmos o perfil real ao CRM.

  } catch (erro) {
    if (loginErrorBanner) {
      loginErrorBanner.textContent =
        erro.message || 'Não foi possível realizar o login.';
      loginErrorBanner.hidden = false;
    }
  } finally {
    if (submitBtn) submitBtn.disabled = false;
    if (spinner) spinner.hidden = true;
    if (submitText) submitText.textContent = 'Entrar';
    form.setAttribute('aria-busy', 'false');
  }
});


    if (demoAccessBtn) {
      demoAccessBtn.addEventListener('click', () => {
        const selected = document.querySelector('input[name="demo_role"]:checked');
        const role = selected ? selected.value : 'gestor';
        saveDemoSession(role);
        const targetUrl =
          (document.body && document.body.getAttribute('data-crm-dashboard-url')) ||
          'crm.html#dashboard';
        globalScope.location.href = targetUrl;
      });
    }
  }

  async function initCrmShell() {
    const viewContainer = document.getElementById('crm-view-container');
    const sidebarNav = document.getElementById('crm-sidebar-nav');
    if (!viewContainer || !sidebarNav) return;

    const navApi = globalScope.EnsinaAiCrmNavigation;
    const dashboardApi = globalScope.EnsinaAiCrmDashboard;
    const leadsApi = globalScope.EnsinaAiCrmLeads;
    const atendimentosApi = globalScope.EnsinaAiCrmAtendimentos;
    const tarefasApi = globalScope.EnsinaAiCrmTarefas;
    const visitasApi = globalScope.EnsinaAiCrmVisitas;
    const equipeApi = globalScope.EnsinaAiCrmEquipe;
    const relatoriosApi = globalScope.EnsinaAiCrmRelatorios;
    const conhecimentoApi = globalScope.EnsinaAiCrmConhecimento;
    const configuracoesApi = globalScope.EnsinaAiCrmConfiguracoes;
    const configuracoesService = globalScope.EnsinaAiConfiguracoesService;
    if (!navApi || !dashboardApi) return;


if (
  configuracoesService &&
  typeof configuracoesService.applyVisualPreferences === 'function'
) {
  configuracoesService.applyVisualPreferences(
    configuracoesService.getSettings()
  );
}

let currentSession;

let modoDemo = false;

try {
  modoDemo = Boolean(
    globalScope.sessionStorage.getItem(DEMO_SESSION_KEY)
  );
} catch {
  modoDemo = false;
}

if (modoDemo) {
  // Mantém o modo demonstração existente.
  currentSession = {
    ...getStoredDemoSession(),
    isDemo: true
  };
} else {
  // Verifica o usuário autenticado no Supabase.
  const auth = globalScope.EnsinaAiCrmAuth;
  const resultado = auth
    ? await auth.usuarioAtual()
    : null;

  if (!resultado) {
    // Sem sessão válida, volta para o login.
    globalScope.location.replace('crm/login.html');
    return;
  }

  const perfil = resultado.perfil;
  const modelo = DEMO_PROFILES[perfil.papel];

  if (!modelo) {
    globalScope.location.replace('crm/login.html');
    return;
  }

  currentSession = {
    ...modelo,
    name: perfil.nome,
    email: resultado.usuario.email || '',
    initials: perfil.nome
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(parte => parte[0])
      .join('')
      .toUpperCase(),
    isDemo: false
  };
}

    let currentRoute = navApi.resolveRoute(globalScope.location.hash);
    let pendingLeadsSearch = '';
    let pendingAtendimentosContext = null;
    let pendingTarefasContext = null;
    let pendingVisitasContext = null;
    let pendingEquipeSearch = '';
    let pendingConhecimentoSearch = '';
    const notificationsState = DEMO_NOTIFICATIONS.map((item) => ({ ...item }));

    const toastEl = document.getElementById('crm-action-toast');
    const toastTextEl = document.getElementById('crm-action-toast-text');
    const toastCloseBtn = document.getElementById('crm-action-toast-close');

    function showToast(message) {
      if (!toastEl || !toastTextEl) return;
      toastTextEl.textContent = message;
      toastEl.hidden = false;
    }

    function hideToast() {
      if (!toastEl) return;
      toastEl.hidden = true;
    }

    if (toastCloseBtn) {
      toastCloseBtn.addEventListener('click', hideToast);
    }

    function syncUserHeader() {
      const avatarEl = document.getElementById('crm-user-avatar');
      const nameEl = document.getElementById('crm-user-name');
      const roleEl = document.getElementById('crm-user-role');
      const menuNameEl = document.getElementById('crm-menu-user-name');
      const menuEmailEl = document.getElementById('crm-menu-user-email');
      const menuBadgeEl = document.getElementById('crm-menu-user-badge');
      const switchLabelEl = document.getElementById('crm-switch-role-label');
      const quickRoleBtn = document.getElementById('crm-header-role-pill');
      const quickRoleText = document.getElementById('crm-header-role-text');

      if (avatarEl) avatarEl.textContent = currentSession.initials;
      if (nameEl) nameEl.textContent = currentSession.name;
      if (roleEl) roleEl.textContent = currentSession.roleLabel;
      if (menuNameEl) menuNameEl.textContent = currentSession.name;
      if (menuEmailEl) menuEmailEl.textContent = currentSession.email;
      if (menuBadgeEl) {
        menuBadgeEl.textContent = `Simulação Front-end • ${currentSession.roleLabel}`;
      }
      if (switchLabelEl) {
        switchLabelEl.textContent =
          currentSession.role === 'gestor'
            ? 'Alternar para visão Atendente'
            : 'Alternar para visão Gestor Escolar';
      }
      if (quickRoleBtn && quickRoleText) {
        quickRoleText.textContent =
          currentSession.role === 'gestor' ? 'Perfil: Gestor Escolar' : 'Perfil: Atendente';
        quickRoleBtn.setAttribute(
          'data-role',
          currentSession.role === 'atendente' ? 'atendente' : 'gestor'
        );
        quickRoleBtn.setAttribute(
          'title',
          currentSession.role === 'gestor'
            ? 'Modo demonstração (Gestor Escolar). Clique para alternar para Atendente.'
            : 'Modo demonstração (Atendente). Clique para alternar para Gestor Escolar.'
        );
      }
    }

    function renderNotifications() {
      const listEl = document.getElementById('crm-notif-list');
      const countEl = document.getElementById('crm-notif-count');
      const unreadCount = notificationsState.filter((n) => n.unread).length;

      if (countEl) {
        countEl.textContent = String(unreadCount);
        countEl.hidden = unreadCount === 0;
      }

      if (listEl) {
        listEl.innerHTML = notificationsState
          .map(
            (item) => `
              <li class="crm-notif-item${item.unread ? ' is-unread' : ''}">
                <span class="crm-notif-dot" aria-hidden="true"></span>
                <div>
                  <strong>${item.title}</strong>
                  <span>${item.text}</span>
                  <time>${item.time}</time>
                </div>
              </li>
            `
          )
          .join('');
      }
    }

    function navigateTo(routeId, updateHash = true) {
      currentRoute = navApi.resolveRoute(routeId);
      const isAllowed =
        typeof navApi.isRouteAllowedForRole === 'function'
          ? navApi.isRouteAllowedForRole(currentRoute, currentSession.role)
          : true;

      navApi.renderSidebarNav(sidebarNav, currentRoute, currentSession.role);
      navApi.updateHeaderMeta(currentRoute, currentSession.role);

      if (updateHash && globalScope.location.hash !== `#${currentRoute}`) {
        globalScope.history.replaceState(null, '', `#${currentRoute}`);
      }

      if (!isAllowed && typeof navApi.renderRestrictedModuleView === 'function') {
        navApi.renderRestrictedModuleView(viewContainer, currentSession.role, () =>
          navigateTo('dashboard')
        );
        return;
      }

      function navigateWithContext(targetRoute, ctxObj = null) {
        const resolved = navApi.resolveRoute(targetRoute);
        if (resolved === 'leads') {
          pendingLeadsSearch = (ctxObj && (ctxObj.search || ctxObj.leadId)) || '';
        } else if (resolved === 'atendimentos') {
          pendingAtendimentosContext = ctxObj || null;
        } else if (resolved === 'tarefas') {
          pendingTarefasContext = ctxObj || null;
        } else if (resolved === 'visitas') {
          pendingVisitasContext = ctxObj || null;
        } else if (resolved === 'equipe') {
          pendingEquipeSearch = (ctxObj && ctxObj.search) || '';
        } else if (resolved === 'base-conhecimento') {
          pendingConhecimentoSearch = (ctxObj && ctxObj.search) || '';
        }
        navigateTo(resolved);
      }

      if (currentRoute === 'dashboard') {
        dashboardApi.renderDashboard(viewContainer, {
          monthsCount: 6,
          session: currentSession,
          onNavigate: (nextRoute) => navigateTo(nextRoute),
          onNavigateModule: navigateWithContext
        });

      } else if (
  currentRoute === 'leads' &&
  !currentSession.isDemo &&
  globalScope.EnsinaAiRealLeads
) {
  globalScope.EnsinaAiRealLeads.render(viewContainer);

      } else if (currentRoute === 'leads' && leadsApi) {
        const initialSearch = pendingLeadsSearch;
        pendingLeadsSearch = '';
        leadsApi.renderLeadsModule(viewContainer, {
          session: currentSession,
          initialSearch,
          onToast: showToast,
          onNavigateModule: navigateWithContext,
          onOpenAtendimentos: (ctxObj) => navigateWithContext('atendimentos', ctxObj)
        });
      } else if (currentRoute === 'atendimentos' && atendimentosApi) {
        const atendCtx = pendingAtendimentosContext || {};
        pendingAtendimentosContext = null;
        atendimentosApi.renderAtendimentosModule(viewContainer, {
          session: currentSession,
          initialLeadId: atendCtx.leadId || '',
          initialSearch: atendCtx.search || '',
          autoOpenNewModal: Boolean(atendCtx.autoOpenNewModal),
          onToast: showToast,
          onNavigate: (nextRoute) => navigateTo(nextRoute),
          onNavigateModule: navigateWithContext,
          onOpenLead: (leadId) => navigateWithContext('leads', { search: leadId || '' })
        });
      } else if (currentRoute === 'tarefas' && tarefasApi) {
        const tarefasCtx = pendingTarefasContext || {};
        pendingTarefasContext = null;
        tarefasApi.renderTarefasModule(viewContainer, {
          session: currentSession,
          initialLeadId: tarefasCtx.leadId || '',
          initialAtendimentoId: tarefasCtx.atendimentoId || '',
          initialSearch: tarefasCtx.search || '',
          autoOpenNewModal: Boolean(tarefasCtx.autoOpenNewModal),
          onToast: showToast,
          onNavigateModule: navigateWithContext
        });
      } else if (currentRoute === 'visitas' && visitasApi) {
        const visitasCtx = pendingVisitasContext || {};
        pendingVisitasContext = null;
        visitasApi.renderVisitasModule(viewContainer, {
          session: currentSession,
          initialLeadId: visitasCtx.leadId || '',
          initialAtendimentoId: visitasCtx.atendimentoId || '',
          initialSearch: visitasCtx.search || '',
          autoOpenNewModal: Boolean(visitasCtx.autoOpenNewModal),
          onToast: showToast,
          onNavigateModule: navigateWithContext
        });
      } else if (currentRoute === 'equipe' && equipeApi) {
        const initialEquipeSearch = pendingEquipeSearch;
        pendingEquipeSearch = '';
        equipeApi.renderEquipeModule(viewContainer, {
          session: currentSession,
          initialSearch: initialEquipeSearch,
          onToast: showToast,
          onNavigateModule: navigateWithContext
        });
      } else if (currentRoute === 'relatorios' && relatoriosApi) {
        relatoriosApi.renderRelatoriosModule(viewContainer, {
          session: currentSession,
          onToast: showToast,
          onNavigateModule: navigateWithContext
        });
      } else if (currentRoute === 'base-conhecimento' && conhecimentoApi) {
        const initialKbSearch = pendingConhecimentoSearch;
        pendingConhecimentoSearch = '';
        conhecimentoApi.renderConhecimentoModule(viewContainer, {
          session: currentSession,
          initialSearch: initialKbSearch,
          onToast: showToast
        });
      } else if (currentRoute === 'configuracoes' && configuracoesApi) {
        configuracoesApi.renderConfiguracoesModule(viewContainer, {
          session: currentSession,
          onToast: showToast,
          onSwitchDemoRole: handleSwitchDemoRole
        });
      } else {
        navApi.renderPlannedModuleView(viewContainer, currentRoute, () => navigateTo('dashboard'));
      }
    }

    // Popovers do Cabeçalho (Notificações e Perfil)
    const notifBtn = document.getElementById('crm-notifications-btn');
    const notifPanel = document.getElementById('crm-notifications-panel');
    const markReadBtn = document.getElementById('crm-mark-all-read');
    const profileBtn = document.getElementById('crm-profile-btn');
    const profileMenu = document.getElementById('crm-profile-menu');
    const switchRoleBtn = document.getElementById('crm-switch-demo-role');
    const searchForm = document.getElementById('crm-search-form');
    const searchInput = document.getElementById('crm-search-input');

    function closeHeaderPopovers() {
      if (notifPanel) notifPanel.hidden = true;
      if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');
      if (profileMenu) profileMenu.hidden = true;
      if (profileBtn) profileBtn.setAttribute('aria-expanded', 'false');
    }

    if (notifBtn && notifPanel) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = notifPanel.hidden;
        closeHeaderPopovers();
        notifPanel.hidden = !willOpen;
        notifBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    }

    if (markReadBtn) {
      markReadBtn.addEventListener('click', () => {
        notificationsState.forEach((n) => {
          n.unread = false;
        });
        renderNotifications();
      });
    }

    if (profileBtn && profileMenu) {
      profileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const willOpen = profileMenu.hidden;
        closeHeaderPopovers();
        profileMenu.hidden = !willOpen;
        profileBtn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
      });
    }

    const quickRoleBtn = document.getElementById('crm-header-role-pill');

    function handleSwitchDemoRole() {

if (!currentSession.isDemo) {
  showToast(
    'Seu perfil é definido pelo Supabase e não pode ser alterado manualmente.'
  );
  return;
}

      const nextRole = currentSession.role === 'gestor' ? 'atendente' : 'gestor';
      currentSession = saveDemoSession(nextRole);
      syncUserHeader();
      closeHeaderPopovers();
      if (
        currentSession.role === 'atendente' &&
        typeof navApi.isRouteAllowedForRole === 'function' &&
        !navApi.isRouteAllowedForRole(currentRoute, currentSession.role)
      ) {
        currentRoute = 'dashboard';
        navigateTo('dashboard', true);
        showToast(
          `Visão alternada para ${currentSession.roleLabel}. Módulo Equipe é exclusivo do Gestor Escolar.`
        );
        return;
      }
      if (
        currentRoute === 'dashboard' ||
        currentRoute === 'leads' ||
        currentRoute === 'atendimentos' ||
        currentRoute === 'tarefas' ||
        currentRoute === 'visitas' ||
        currentRoute === 'equipe' ||
        currentRoute === 'relatorios' ||
        currentRoute === 'base-conhecimento' ||
        currentRoute === 'configuracoes'
      ) {
        navigateTo(currentRoute, false);
      }
      showToast(`Visão demonstrativa alternada para: ${currentSession.roleLabel}.`);
    }

    if (switchRoleBtn) {
      switchRoleBtn.addEventListener('click', handleSwitchDemoRole);
    }

    if (quickRoleBtn) {
      quickRoleBtn.addEventListener('click', handleSwitchDemoRole);
    }

    document.querySelectorAll('[data-route-action]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-route-action');
        closeHeaderPopovers();
        navigateTo(target);
      });
    });

    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const rawQuery = searchInput.value.trim();
        const query = rawQuery.toLowerCase();
        if (!query) {
          showToast('Digite o nome de um módulo (ex.: Leads, Visitas) ou um contato para buscar em Leads.');
          searchInput.focus();
          return;
        }

        const matchedRoute = Object.keys(navApi.MODULE_META).find((key) => {
          const roleMeta =
            typeof navApi.getModuleMetaForRole === 'function'
              ? navApi.getModuleMetaForRole(key, currentSession.role)
              : navApi.MODULE_META[key];
          const baseTitle = navApi.MODULE_META[key].title.toLowerCase();
          const roleTitle = (roleMeta.title || '').toLowerCase();
          return roleTitle.includes(query) || baseTitle.includes(query) || key.includes(query);
        });

        if (matchedRoute) {
          const roleMeta =
            typeof navApi.getModuleMetaForRole === 'function'
              ? navApi.getModuleMetaForRole(matchedRoute, currentSession.role)
              : navApi.MODULE_META[matchedRoute];
          navigateTo(matchedRoute);
          showToast(`Exibindo módulo "${roleMeta.title}" correspondente à pesquisa.`);
          return;
        }

        if (leadsApi) {
          pendingLeadsSearch = rawQuery;
          navigateTo('leads');
          showToast(`Filtrando leads para "${rawQuery}".`);
          return;
        }

        showToast(`Pesquisa visual registrada para "${rawQuery}".`);
      });
    }


const logoutLinks = document.querySelectorAll(
  '#crm-sidebar-logout, #crm-menu-logout'
);

logoutLinks.forEach((link) => {
  link.addEventListener('click', async (event) => {
    event.preventDefault();

    try {
      const auth = globalScope.EnsinaAiCrmAuth;

      // Encerra a sessão real do Supabase.
      if (auth) {
        await auth.sair();
      } else if (!currentSession.isDemo) {
        throw new Error('Serviço de autenticação indisponível.');
      }

      // Limpa também a sessão demonstrativa.
      clearDemoSession();

      // Retorna à tela de login.
      globalScope.location.href = 'crm/login.html';

    } catch (erro) {
      showToast(
        'Não foi possível encerrar a sessão. Tente novamente.'
      );
    }
  });
});


    document.addEventListener('click', (e) => {
      if (
        (notifPanel && !notifPanel.hidden && !notifPanel.contains(e.target) && e.target !== notifBtn) ||
        (profileMenu && !profileMenu.hidden && !profileMenu.contains(e.target) && e.target !== profileBtn)
      ) {
        closeHeaderPopovers();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeHeaderPopovers();
      }
    });

    globalScope.addEventListener('hashchange', () => {
      navigateTo(globalScope.location.hash, false);
    });

    navApi.setupSidebarControls((nextRoute) => navigateTo(nextRoute));
    syncUserHeader();
    renderNotifications();
    navigateTo(currentRoute, false);
  }

  document.addEventListener('DOMContentLoaded', () => {
    const pageType = document.body ? document.body.getAttribute('data-crm-page') : '';
    if (pageType === 'login') {
      initLoginPage();
    } else if (pageType === 'crm') {
      initCrmShell();
    }
  });
})(window);
