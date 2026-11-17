/**
 * ENSINA AÍ — CRM Escolar
 * Controlador Principal da Aplicação CRM e Login Visual (js/crm/app.js)
 * JavaScript Vanilla ES6+ — Sem autenticação real ou chamadas a banco de dados
 */

(function initCrmAppModule(globalScope) {
  'use strict';

  const DEMO_SESSION_KEY = 'ensina_ai_crm_demo_session';

  const DEMO_PROFILES = Object.freeze({
    gestor: {
      role: 'gestor',
      roleLabel: 'Gestor Escolar',
      name: 'Coordenação Demo',
      initials: 'CD',
      email: 'gestor.demo@ensinaai.edu.br'
    },
    atendente: {
      role: 'atendente',
      roleLabel: 'Atendente',
      name: 'Secretaria Demo',
      initials: 'SD',
      email: 'atendimento.demo@ensinaai.edu.br'
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

    form.addEventListener('submit', (e) => {
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
      if (submitText) submitText.textContent = 'Verificando acesso...';
      form.setAttribute('aria-busy', 'true');

      globalScope.setTimeout(() => {
        if (submitBtn) submitBtn.disabled = false;
        if (spinner) spinner.hidden = true;
        if (submitText) submitText.textContent = 'Entrar';
        form.setAttribute('aria-busy', 'false');

        if (loginErrorBanner) {
          loginErrorBanner.textContent =
            'Autenticação oficial ainda não integrada nesta etapa visual. Utilize o botão "Entrar em Modo Demonstração" logo abaixo para explorar o CRM.';
          loginErrorBanner.hidden = false;
        }
      }, 500);
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

  function initCrmShell() {
    const viewContainer = document.getElementById('crm-view-container');
    const sidebarNav = document.getElementById('crm-sidebar-nav');
    if (!viewContainer || !sidebarNav) return;

    const navApi = globalScope.EnsinaAiCrmNavigation;
    const dashboardApi = globalScope.EnsinaAiCrmDashboard;
    const leadsApi = globalScope.EnsinaAiCrmLeads;
    const atendimentosApi = globalScope.EnsinaAiCrmAtendimentos;
    if (!navApi || !dashboardApi) return;

    let currentSession = getStoredDemoSession();
    let currentRoute = navApi.resolveRoute(globalScope.location.hash);
    let pendingLeadsSearch = '';
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
      const switchLabelEl = document.getElementById('crm-switch-role-label');

      if (avatarEl) avatarEl.textContent = currentSession.initials;
      if (nameEl) nameEl.textContent = currentSession.name;
      if (roleEl) roleEl.textContent = currentSession.roleLabel;
      if (menuNameEl) menuNameEl.textContent = currentSession.name;
      if (menuEmailEl) menuEmailEl.textContent = currentSession.email;
      if (switchLabelEl) {
        switchLabelEl.textContent =
          currentSession.role === 'gestor'
            ? 'Alternar para visão Atendente'
            : 'Alternar para visão Gestor Escolar';
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
      navApi.renderSidebarNav(sidebarNav, currentRoute);
      navApi.updateHeaderMeta(currentRoute);

      if (updateHash && globalScope.location.hash !== `#${currentRoute}`) {
        globalScope.history.replaceState(null, '', `#${currentRoute}`);
      }

      if (currentRoute === 'dashboard') {
        dashboardApi.renderDashboard(viewContainer, {
          monthsCount: 6,
          session: currentSession,
          onNavigate: (nextRoute) => navigateTo(nextRoute)
        });
      } else if (currentRoute === 'leads' && leadsApi) {
        const initialSearch = pendingLeadsSearch;
        pendingLeadsSearch = '';
        leadsApi.renderLeadsModule(viewContainer, {
          session: currentSession,
          initialSearch,
          onToast: showToast
        });
      } else if (currentRoute === 'atendimentos' && atendimentosApi) {
        atendimentosApi.renderAtendimentosModule(viewContainer, {
          session: currentSession,
          onToast: showToast,
          onNavigate: (nextRoute) => navigateTo(nextRoute)
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

    if (switchRoleBtn) {
      switchRoleBtn.addEventListener('click', () => {
        const nextRole = currentSession.role === 'gestor' ? 'atendente' : 'gestor';
        currentSession = saveDemoSession(nextRole);
        syncUserHeader();
        closeHeaderPopovers();
        if (currentRoute === 'dashboard' || currentRoute === 'leads' || currentRoute === 'atendimentos') {
          navigateTo(currentRoute, false);
        }
        showToast(`Visão demonstrativa alternada para: ${currentSession.roleLabel}.`);
      });
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
          const title = navApi.MODULE_META[key].title.toLowerCase();
          return title.includes(query) || key.includes(query);
        });

        if (matchedRoute) {
          navigateTo(matchedRoute);
          showToast(`Exibindo módulo "${navApi.MODULE_META[matchedRoute].title}" correspondente à pesquisa.`);
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

    const logoutLinks = document.querySelectorAll('#crm-sidebar-logout, #crm-menu-logout');
    logoutLinks.forEach((link) => {
      link.addEventListener('click', () => {
        clearDemoSession();
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
