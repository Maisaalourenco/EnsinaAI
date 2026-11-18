/**
 * ENSINA AÍ — CRM Escolar
 * Módulo de Interface de Configurações Visuais (js/crm/configuracoes.js)
 * JavaScript Vanilla ES6+ — Sem autenticação ou alteração real de credenciais
 */

(function initCrmConfiguracoesView(globalScope) {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatDateTimeBr(isoString) {
    if (!isoString) return 'Ainda não salvo nesta sessão';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  function renderConfiguracoesModule(container, options = {}) {
    const service = globalScope.EnsinaAiConfiguracoesService;
    if (!container || !service) return;

    const session = options.session || {
      role: 'gestor',
      roleLabel: 'Gestor Escolar',
      name: 'Coordenação Demo',
      initials: 'CD',
      email: 'gestor.demo@ensinaai.edu.br'
    };
    const isAtendente = session.role === 'atendente';
    const notify = typeof options.onToast === 'function' ? options.onToast : () => {};
    const onSwitchDemoRole =
      typeof options.onSwitchDemoRole === 'function' ? options.onSwitchDemoRole : null;

    const current = service.getSettings();

    container.innerHTML = `
      <div class="crm-config-module" id="crm-configuracoes-module">
        <section class="crm-leads-header-bar">
          <div>
            <div class="crm-leads-title-row">
              <h2>${isAtendente ? 'Meu Perfil' : 'Configurações'}</h2>
              <span class="crm-demo-pill">Preferências visuais locais</span>
            </div>
            <p class="crm-leads-subtitle">
              ${
                isAtendente
                  ? 'Consulte seus dados de sessão demonstrativa, ajuste sua assinatura de atendimento e personalize preferências de notificações e interface.'
                  : 'Gerencie os dados institucionais demonstrativos da escola, preferências de notificações, ajustes de interface e informações do perfil visual.'
              }
            </p>
          </div>
          <div class="crm-leads-header-actions">
            <button type="button" class="btn btn-outline btn-sm" id="btn-reset-config">
              Restaurar padrões demo
            </button>
            <button type="button" class="btn btn-primary" id="btn-save-config-top">
              ${isAtendente ? 'Salvar preferências' : 'Salvar configurações'}
            </button>
          </div>
        </section>

        <section class="crm-demo-role-notice" aria-label="Aviso de ambiente sem autenticação">
          <strong>${isAtendente ? 'Perfil operacional (Atendente):' : 'Configurações exclusivamente visuais:'}</strong>
          <span>${
            isAtendente
              ? 'As preferências abaixo são salvas apenas no navegador (localStorage). Dados institucionais da escola ficam restritos ao perfil Gestor Escolar.'
              : 'As preferências abaixo são salvas apenas no navegador (localStorage). Não há autenticação ativa, servidor de e-mail ou alteração real de credenciais.'
          }</span>
        </section>

        <form id="configuracoes-form" class="crm-config-form" novalidate>
          <div class="crm-config-grid">
            <!-- 1. Dados demonstrativos da escola (Gestor Escolar) -->
            <section class="crm-panel" id="cfg-escola-section" aria-label="Dados demonstrativos da escola"${isAtendente ? ' hidden' : ''}>
              <div class="crm-panel-header">
                <div>
                  <h3 class="crm-panel-title">Dados demonstrativos da escola</h3>
                  <p class="crm-panel-subtitle">Informações institucionais exibidas como referência no CRM</p>
                </div>
              </div>

              <div class="crm-form-grid-2">
                <div class="form-group crm-form-span-2">
                  <label for="cfg-escola-nome">Nome da instituição <span class="required-star" aria-hidden="true">*</span></label>
                  <input
                    type="text"
                    id="cfg-escola-nome"
                    class="form-control crm-input-compact"
                    value="${escapeHtml(current.escola.nome_instituicao)}"
                    required
                  />
                  <span class="form-error-msg" role="alert" id="error-cfg-escola-nome"></span>
                </div>

                <div class="form-group">
                  <label for="cfg-escola-telefone">Telefone institucional <span class="required-star" aria-hidden="true">*</span></label>
                  <input
                    type="tel"
                    id="cfg-escola-telefone"
                    class="form-control crm-input-compact"
                    value="${escapeHtml(current.escola.telefone)}"
                    required
                  />
                  <span class="form-error-msg" role="alert" id="error-cfg-escola-telefone"></span>
                </div>

                <div class="form-group">
                  <label for="cfg-escola-email">E-mail de contato <span class="required-star" aria-hidden="true">*</span></label>
                  <input
                    type="email"
                    id="cfg-escola-email"
                    class="form-control crm-input-compact"
                    value="${escapeHtml(current.escola.email)}"
                    required
                  />
                  <span class="form-error-msg" role="alert" id="error-cfg-escola-email"></span>
                </div>

                <div class="form-group crm-form-span-2">
                  <label for="cfg-escola-endereco">Endereço do campus <span class="required-star" aria-hidden="true">*</span></label>
                  <input
                    type="text"
                    id="cfg-escola-endereco"
                    class="form-control crm-input-compact"
                    value="${escapeHtml(current.escola.endereco)}"
                    required
                  />
                  <span class="form-error-msg" role="alert" id="error-cfg-escola-endereco"></span>
                </div>

                <div class="form-group crm-form-span-2">
                  <label for="cfg-escola-horarios">Horários de atendimento <span class="required-star" aria-hidden="true">*</span></label>
                  <textarea
                    id="cfg-escola-horarios"
                    class="form-control"
                    rows="2"
                    required
                  >${escapeHtml(current.escola.horarios_atendimento)}</textarea>
                  <span class="form-error-msg" role="alert" id="error-cfg-escola-horarios"></span>
                </div>
              </div>
            </section>

            <!-- 2. Informações do perfil visual -->
            <section class="crm-panel" aria-label="Informações do perfil visual">
              <div class="crm-panel-header">
                <div>
                  <h3 class="crm-panel-title">Informações do perfil visual</h3>
                  <p class="crm-panel-subtitle">Sessão demonstrativa ativa (sem credenciais ou senha)</p>
                </div>
              </div>

              <div class="crm-member-detail-hero">
                <span class="crm-member-avatar is-large" style="background-color: #1E3A8A;" aria-hidden="true">
                  ${escapeHtml(session.initials || 'CD')}
                </span>
                <div class="crm-member-detail-title">
                  <div class="crm-leads-title-row">
                    <h4>${escapeHtml(session.name)}</h4>
                    <span class="crm-role-badge role-${escapeHtml(session.role === 'atendente' ? 'atendente' : 'gestor')}">
                      ${escapeHtml(session.roleLabel)} (Demo)
                    </span>
                  </div>
                  <p>${escapeHtml(session.email)}</p>
                </div>
              </div>

              <div class="form-group">
                <label for="cfg-perfil-assinatura">Assinatura visual de atendimento</label>
                <input
                  type="text"
                  id="cfg-perfil-assinatura"
                  class="form-control crm-input-compact"
                  value="${escapeHtml(current.perfil_visual.assinatura_atendimento)}"
                />
              </div>

              <div class="crm-config-profile-note">
                <p>
                  Alterações de senha, permissões de acesso e vinculação de contas oficiais não fazem parte desta etapa de front-end.
                </p>
                <button type="button" class="btn btn-outline btn-sm" id="btn-cfg-switch-role">
                  Alternar perfil visual (${session.role === 'gestor' ? 'para Atendente' : 'para Gestor Escolar'})
                </button>
              </div>
            </section>

            <!-- 3. Preferências de notificações -->
            <section class="crm-panel" aria-label="Preferências de notificações">
              <div class="crm-panel-header">
                <div>
                  <h3 class="crm-panel-title">Preferências de notificações</h3>
                  <p class="crm-panel-subtitle">Defina quais alertas visuais deseja destacar no painel</p>
                </div>
              </div>

              <div class="crm-config-checks-list">
                <label class="crm-config-check-row" for="cfg-notif-leads">
                  <input type="checkbox" id="cfg-notif-leads"${current.notificacoes.novos_leads ? ' checked' : ''} />
                  <div>
                    <strong>Alertar sobre novos leads recebidos</strong>
                    <span>Destaca novas famílias cadastradas pela Landing Page ou recepção.</span>
                  </div>
                </label>

                <label class="crm-config-check-row" for="cfg-notif-visitas">
                  <input type="checkbox" id="cfg-notif-visitas"${current.notificacoes.visitas_dia ? ' checked' : ''} />
                  <div>
                    <strong>Lembretes de visitas do dia</strong>
                    <span>Exibe sinalização para agendamentos programados para a data atual.</span>
                  </div>
                </label>

                <label class="crm-config-check-row" for="cfg-notif-tarefas">
                  <input type="checkbox" id="cfg-notif-tarefas"${current.notificacoes.tarefas_atrasadas ? ' checked' : ''} />
                  <div>
                    <strong>Sinalizar tarefas atrasadas</strong>
                    <span>Mantém destaque visual em pendências com prazo vencido.</span>
                  </div>
                </label>

                <label class="crm-config-check-row" for="cfg-notif-resumo">
                  <input type="checkbox" id="cfg-notif-resumo"${current.notificacoes.resumo_diario ? ' checked' : ''} />
                  <div>
                    <strong>Resumo diário demonstrativo da coordenação</strong>
                    <span>Preferência visual de consolidação diária de indicadores.</span>
                  </div>
                </label>
              </div>
            </section>

            <!-- 4. Preferências de interface -->
            <section class="crm-panel" aria-label="Preferências de interface">
              <div class="crm-panel-header">
                <div>
                  <h3 class="crm-panel-title">Preferências de interface</h3>
                  <p class="crm-panel-subtitle">Ajustes visuais aplicados imediatamente ao painel local</p>
                </div>
              </div>

              <div class="crm-form-grid-2">
                <div class="form-group">
                  <label for="cfg-ui-densidade">Densidade das tabelas</label>
                  <select id="cfg-ui-densidade" class="form-control crm-input-compact">
                    <option value="confortavel"${current.interface_prefs.densidade_tabelas === 'confortavel' ? ' selected' : ''}>Confortável (padrão)</option>
                    <option value="compacta"${current.interface_prefs.densidade_tabelas === 'compacta' ? ' selected' : ''}>Compacta</option>
                  </select>
                </div>

                <div class="form-group">
                  <label for="cfg-ui-formato-data">Formato de exibição de datas</label>
                  <select id="cfg-ui-formato-data" class="form-control crm-input-compact">
                    <option value="dd/mm/aaaa"${current.interface_prefs.formato_data === 'dd/mm/aaaa' ? ' selected' : ''}>DD/MM/AAAA (Brasil)</option>
                    <option value="aaaa-mm-dd"${current.interface_prefs.formato_data === 'aaaa-mm-dd' ? ' selected' : ''}>AAAA-MM-DD (ISO)</option>
                  </select>
                </div>
              </div>

              <div class="crm-config-checks-list" style="margin-top: 0.85rem;">
                <label class="crm-config-check-row" for="cfg-ui-avisos">
                  <input type="checkbox" id="cfg-ui-avisos"${current.interface_prefs.exibir_avisos_demo ? ' checked' : ''} />
                  <div>
                    <strong>Exibir avisos de ambiente demonstrativo</strong>
                    <span>Mantém explícito que os registros do CRM são fictícios e locais.</span>
                  </div>
                </label>

                <label class="crm-config-check-row" for="cfg-ui-sidebar">
                  <input type="checkbox" id="cfg-ui-sidebar"${current.interface_prefs.sidebar_compacta_padrao ? ' checked' : ''} />
                  <div>
                    <strong>Preferir menu lateral compacto por padrão</strong>
                    <span>Indica preferência visual para ampliar a área útil de tabelas e gráficos.</span>
                  </div>
                </label>
              </div>
            </section>
          </div>

          <div class="crm-config-save-bar">
            <span class="crm-results-counter" id="cfg-last-saved-label">
              Última atualização local: ${escapeHtml(formatDateTimeBr(current.atualizado_em))}
            </span>
            <button type="submit" class="btn btn-primary" id="btn-save-config">
              ${isAtendente ? 'Salvar preferências' : 'Salvar configurações'}
            </button>
          </div>
        </form>
      </div>
    `;

    const formEl = container.querySelector('#configuracoes-form');
    const saveTopBtn = container.querySelector('#btn-save-config-top');
    const resetBtn = container.querySelector('#btn-reset-config');
    const switchRoleBtn = container.querySelector('#btn-cfg-switch-role');
    const lastSavedLabel = container.querySelector('#cfg-last-saved-label');

    const nomeInput = container.querySelector('#cfg-escola-nome');
    const telInput = container.querySelector('#cfg-escola-telefone');
    const emailInput = container.querySelector('#cfg-escola-email');
    const enderecoInput = container.querySelector('#cfg-escola-endereco');
    const horariosInput = container.querySelector('#cfg-escola-horarios');
    const assinaturaInput = container.querySelector('#cfg-perfil-assinatura');

    const errNome = container.querySelector('#error-cfg-escola-nome');
    const errTel = container.querySelector('#error-cfg-escola-telefone');
    const errEmail = container.querySelector('#error-cfg-escola-email');
    const errEndereco = container.querySelector('#error-cfg-escola-endereco');
    const errHorarios = container.querySelector('#error-cfg-escola-horarios');

    const notifLeads = container.querySelector('#cfg-notif-leads');
    const notifVisitas = container.querySelector('#cfg-notif-visitas');
    const notifTarefas = container.querySelector('#cfg-notif-tarefas');
    const notifResumo = container.querySelector('#cfg-notif-resumo');

    const uiDensidade = container.querySelector('#cfg-ui-densidade');
    const uiFormatoData = container.querySelector('#cfg-ui-formato-data');
    const uiAvisos = container.querySelector('#cfg-ui-avisos');
    const uiSidebar = container.querySelector('#cfg-ui-sidebar');

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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

    function submitSettings() {
      let escolaPayload = current.escola;

      if (!isAtendente) {
        setFieldError(nomeInput, errNome, '');
        setFieldError(telInput, errTel, '');
        setFieldError(emailInput, errEmail, '');
        setFieldError(enderecoInput, errEndereco, '');
        setFieldError(horariosInput, errHorarios, '');

        const nomeVal = nomeInput.value.trim();
        const telVal = telInput.value.trim();
        const emailVal = emailInput.value.trim();
        const endVal = enderecoInput.value.trim();
        const horVal = horariosInput.value.trim();

        let ok = true;
        if (nomeVal.length < 3) ok = setFieldError(nomeInput, errNome, 'Informe o nome da instituição.');
        if (telVal.length < 8) ok = setFieldError(telInput, errTel, 'Informe um telefone institucional válido.');
        if (!emailRegex.test(emailVal)) ok = setFieldError(emailInput, errEmail, 'Informe um e-mail válido.');
        if (endVal.length < 5) ok = setFieldError(enderecoInput, errEndereco, 'Informe o endereço do campus.');
        if (horVal.length < 5) ok = setFieldError(horariosInput, errHorarios, 'Informe os horários de atendimento.');

        if (!ok) {
          const firstInvalid = formEl.querySelector('.is-invalid');
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        escolaPayload = {
          nome_instituicao: nomeVal,
          telefone: telVal,
          email: emailVal,
          endereco: endVal,
          horarios_atendimento: horVal
        };
      }

      const saved = service.saveSettings({
        escola: escolaPayload,
        notificacoes: {
          novos_leads: Boolean(notifLeads.checked),
          visitas_dia: Boolean(notifVisitas.checked),
          tarefas_atrasadas: Boolean(notifTarefas.checked),
          resumo_diario: Boolean(notifResumo.checked)
        },
        interface_prefs: {
          densidade_tabelas: uiDensidade.value,
          formato_data: uiFormatoData.value,
          exibir_avisos_demo: Boolean(uiAvisos.checked),
          sidebar_compacta_padrao: Boolean(uiSidebar.checked)
        },
        perfil_visual: {
          assinatura_atendimento: assinaturaInput.value.trim() || 'Equipe de Atendimento ENSINA AÍ'
        }
      });

      if (lastSavedLabel) {
        lastSavedLabel.textContent = `Última atualização local: ${formatDateTimeBr(saved.atualizado_em)}`;
      }
      notify(isAtendente ? 'Preferências pessoais salvas localmente.' : 'Configurações visuais salvas localmente com sucesso.');
    }

    formEl.addEventListener('submit', (e) => {
      e.preventDefault();
      submitSettings();
    });

    saveTopBtn.addEventListener('click', submitSettings);

    resetBtn.addEventListener('click', () => {
      service.resetDefaultSettings();
      renderConfiguracoesModule(container, options);
      notify('Configurações demonstrativas restauradas para o padrão.');
    });

    if (switchRoleBtn && onSwitchDemoRole) {
      switchRoleBtn.addEventListener('click', () => {
        onSwitchDemoRole();
      });
    }
  }

  globalScope.EnsinaAiCrmConfiguracoes = Object.freeze({
    renderConfiguracoesModule
  });
})(window);
