/**
 * ENSINA AÍ — CRM Escolar
 * Camada de Serviços de Configurações Visuais (js/crm/configuracoes-service.js)
 * Armazena preferências visuais e dados demonstrativos da instituição em localStorage.
 * Sem autenticação real ou alteração de credenciais.
 */

(function initCrmConfiguracoesService(globalScope) {
  'use strict';

  const STORAGE_KEY = 'ensina_ai_crm_config_demo_v1';

  const DEFAULT_SETTINGS = Object.freeze({
    escola: {
      nome_instituicao: 'Colégio ENSINA AÍ (Unidade Demo)',
      telefone: '(11) 3456-7890',
      email: 'secretaria.demo@ensinaai.edu.br',
      endereco: 'Av. Educação Plena, 420 — Jardim Paulista, São Paulo/SP',
      horarios_atendimento:
        'Segunda a sexta, das 07h30 às 18h00 • Sábados (visitas agendadas), das 09h00 às 12h30'
    },
    notificacoes: {
      novos_leads: true,
      visitas_dia: true,
      tarefas_atrasadas: true,
      resumo_diario: false
    },
    interface_prefs: {
      densidade_tabelas: 'confortavel', // confortavel | compacta
      exibir_avisos_demo: true,
      sidebar_compacta_padrao: false,
      formato_data: 'dd/mm/aaaa'
    },
    perfil_visual: {
      assinatura_atendimento: 'Equipe de Atendimento ENSINA AÍ',
      observacao_visual: 'Perfil visual demonstrativo — sem autenticação ou troca real de senha.'
    },
    atualizado_em: ''
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mergeWithDefaults(raw) {
    const base = clone(DEFAULT_SETTINGS);
    if (!raw || typeof raw !== 'object') return base;
    return {
      escola: {
        ...base.escola,
        ...(raw.escola || {})
      },
      notificacoes: {
        ...base.notificacoes,
        ...(raw.notificacoes || {})
      },
      interface_prefs: {
        ...base.interface_prefs,
        ...(raw.interface_prefs || {})
      },
      perfil_visual: {
        ...base.perfil_visual,
        ...(raw.perfil_visual || {})
      },
      atualizado_em: raw.atualizado_em || ''
    };
  }

  function getSettings() {
    try {
      const raw = globalScope.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = clone(DEFAULT_SETTINGS);
        initial.atualizado_em = new Date().toISOString();
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
        return initial;
      }
      return mergeWithDefaults(JSON.parse(raw));
    } catch {
      return clone(DEFAULT_SETTINGS);
    }
  }

  function saveSettings(nextInput) {
    const merged = mergeWithDefaults(nextInput);
    merged.atualizado_em = new Date().toISOString();
    try {
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Sem impacto caso localStorage esteja indisponível
    }
    applyVisualPreferences(merged, { syncSidebar: true });
    return clone(merged);
  }

  function resetDefaultSettings() {
    const reset = clone(DEFAULT_SETTINGS);
    reset.atualizado_em = new Date().toISOString();
    try {
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(reset));
    } catch {
      // Sem impacto
    }
    applyVisualPreferences(reset, { syncSidebar: true });
    return clone(reset);
  }

  function applyVisualPreferences(settings, opts = {}) {
    if (!globalScope.document) return;
    const layout = globalScope.document.getElementById('crm-layout');
    const prefs = (settings && settings.interface_prefs) || DEFAULT_SETTINGS.interface_prefs;
    if (layout && layout.classList) {
      layout.classList.toggle('is-compact-density', prefs.densidade_tabelas === 'compacta');
      layout.classList.toggle('is-hide-demo-notices', prefs.exibir_avisos_demo === false);

      let hasManualSidebarPref = false;
      try {
        hasManualSidebarPref =
          globalScope.sessionStorage &&
          globalScope.sessionStorage.getItem('ensina_ai_crm_sidebar_collapsed') !== null;
      } catch {
        hasManualSidebarPref = false;
      }

      if (opts.syncSidebar || !hasManualSidebarPref) {
        const shouldCollapse = Boolean(prefs.sidebar_compacta_padrao);
        layout.classList.toggle('is-sidebar-collapsed', shouldCollapse);
        const collapseBtn = globalScope.document.getElementById('crm-sidebar-collapse-btn');
        if (collapseBtn) {
          collapseBtn.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');
          collapseBtn.setAttribute(
            'aria-label',
            shouldCollapse ? 'Expandir menu lateral' : 'Recolher menu lateral'
          );
        }
        try {
          if (opts.syncSidebar && globalScope.sessionStorage) {
            globalScope.sessionStorage.setItem(
              'ensina_ai_crm_sidebar_collapsed',
              shouldCollapse ? '1' : '0'
            );
          }
        } catch {
          // Sem impacto
        }
      }
    }
  }

  globalScope.EnsinaAiConfiguracoesService = Object.freeze({
    STORAGE_KEY,
    DEFAULT_SETTINGS,
    getSettings,
    saveSettings,
    resetDefaultSettings,
    applyVisualPreferences
  });
})(window);
