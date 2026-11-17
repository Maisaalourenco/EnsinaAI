/**
 * ENSINA AÍ — CRM Escolar
 * Módulo do Dashboard Inicial (js/crm/dashboard.js)
 * Contém exclusivamente dados demonstrativos fictícios para validação de interface.
 */

(function initCrmDashboardModule(globalScope) {
  'use strict';

  const DEMO_DASHBOARD_DATA = Object.freeze({
    isDemoData: true,
    kpis: [
      { id: 'total-leads', label: 'Total de leads', value: 148, foot: '+18% no período (demo)', footTone: 'is-positive', accent: 'navy' },
      { id: 'leads-novos', label: 'Leads novos', value: 24, foot: 'Últimos 7 dias (demo)', footTone: '', accent: 'blue' },
      { id: 'leads-atendimento', label: 'Leads em atendimento', value: 57, foot: '38 em contato • 19 retorno (demo)', footTone: '', accent: 'sky' },
      { id: 'visitas-agendadas', label: 'Visitas agendadas', value: 14, foot: 'Próximos 7 dias (demo)', footTone: '', accent: 'amber' },
      { id: 'matriculas', label: 'Matrículas realizadas', value: 31, foot: 'Ano letivo vigente (demo)', footTone: 'is-positive', accent: 'green' },
      { id: 'taxa-conversao', label: 'Taxa de conversão', value: '20,9%', foot: '31 de 148 leads (demo)', footTone: 'is-positive', accent: 'green' }
    ],
    monthlyEvolution: [
      { month: 'Jun', leads: 18, atendimentos: 14 },
      { month: 'Jul', leads: 22, atendimentos: 19 },
      { month: 'Ago', leads: 25, atendimentos: 21 },
      { month: 'Set', leads: 29, atendimentos: 24 },
      { month: 'Out', leads: 26, atendimentos: 23 },
      { month: 'Nov', leads: 28, atendimentos: 25 }
    ],
    funnel: [
      { stage: 'Novos leads', count: 148, color: '#1E3A8A' },
      { stage: 'Em atendimento', count: 102, color: '#0EA5E9' },
      { stage: 'Aguardando retorno', count: 64, color: '#F59E0B' },
      { stage: 'Visita agendada', count: 45, color: '#0284C7' },
      { stage: 'Matrícula realizada', count: 31, color: '#10B981' }
    ],
    originsDistribution: [
      { id: 'site', label: 'Site institucional', count: 58, color: '#1E3A8A' },
      { id: 'whatsapp', label: 'WhatsApp', count: 44, color: '#10B981' },
      { id: 'instagram', label: 'Instagram', count: 24, color: '#0EA5E9' },
      { id: 'presencial', label: 'Presencial', count: 14, color: '#F59E0B' },
      { id: 'indicacao', label: 'Indicação / Outros', count: 8, color: '#64748B' }
    ],
    recentActivities: [
      {
        id: 'act-1',
        dot: 'blue',
        route: 'leads',
        title: 'Novo lead cadastrado pelo site',
        detail: 'Mariana Oliveira — Ensino Fundamental I (Matutino) • Exemplo demonstrativo',
        time: 'Há 12 min'
      },
      {
        id: 'act-2',
        dot: 'sky',
        route: 'atendimentos',
        title: 'Atendimento atualizado',
        detail: 'Eduardo Ferreira avançou para "Aguardando retorno" • Exemplo demonstrativo',
        time: 'Há 38 min'
      },
      {
        id: 'act-3',
        dot: 'amber',
        route: 'visitas',
        title: 'Visita guiada agendada',
        detail: 'Família Souza — Educação Infantil (Berçário) para 19/11 às 10h • Exemplo demonstrativo',
        time: 'Há 2 horas'
      },
      {
        id: 'act-4',
        dot: 'green',
        route: 'leads',
        title: 'Matrícula concluída',
        detail: 'Camila Andrade — Ensino Médio (1ª série) efetivada • Exemplo demonstrativo',
        time: 'Ontem'
      }
    ],
    upcomingTasks: [
      {
        id: 'tsk-1',
        route: 'tarefas',
        badge: 'Prioridade',
        title: 'Retorno telefônico — Juliana Martins',
        meta: 'Enviar matriz horária do Período Integral (demo)',
        dateTime: 'Hoje, 16:00'
      },
      {
        id: 'tsk-2',
        route: 'tarefas',
        badge: 'Secretaria',
        title: 'Conferir documentação pré-matrícula',
        meta: 'Atendimento #DEMO-104 • Ensino Fundamental II',
        dateTime: 'Amanhã, 11:00'
      },
      {
        id: 'tsk-3',
        route: 'tarefas',
        badge: 'Follow-up',
        title: 'Confirmar interesse após envio de proposta',
        meta: 'Gustavo Teixeira • Ensino Fundamental II (demo)',
        dateTime: '21/11, 09:30'
      }
    ],
    upcomingVisits: [
      {
        id: 'vis-1',
        route: 'visitas',
        badge: 'Visita',
        title: 'Visita ao Campus — Família Rodrigues',
        meta: 'Ensino Fundamental II • Coordenação Pedagógica (demo)',
        dateTime: 'Hoje, 14:30'
      },
      {
        id: 'vis-2',
        route: 'visitas',
        badge: 'Visita',
        title: 'Visita guiada — Família Costa Lima',
        meta: 'Educação Infantil (Maternal) • Turno Matutino (demo)',
        dateTime: 'Amanhã, 09:30'
      },
      {
        id: 'vis-3',
        route: 'visitas',
        badge: 'Visita',
        title: 'Apresentação pedagógica — Família Campos',
        meta: 'Educação Infantil • Turno Vespertino (demo)',
        dateTime: '21/11, 15:00'
      }
    ]
  });

  function getComponents() {
    return globalScope.EnsinaAiCrmComponents || null;
  }

  function escapeHtml(value) {
    const c = getComponents();
    if (c && typeof c.escapeHtml === 'function') return c.escapeHtml(value);
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderEmptyBox(title, description, actionsHtml = '') {
    const c = getComponents();
    if (c && typeof c.renderEmptyState === 'function') {
      return c.renderEmptyState({ title, description, actionsHtml });
    }
    return `<div class="crm-empty-state"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(description)}</p></div>`;
  }

  function buildEvolutionChartSvg(series) {
    const width = 560;
    const height = 240;
    const padLeft = 36;
    const padRight = 18;
    const padTop = 20;
    const padBottom = 36;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const maxVal = Math.max(
      32,
      ...series.map((item) => Math.max(item.leads, item.atendimentos))
    );
    const yMax = Math.ceil(maxVal / 5) * 5;
    const stepX = chartW / series.length;

    const gridLines = [0, 0.25, 0.5, 0.75, 1]
      .map((ratio) => {
        const y = padTop + chartH - ratio * chartH;
        const val = Math.round(ratio * yMax);
        return `
          <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3 3" />
          <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="11" fill="#64748B">${val}</text>
        `;
      })
      .join('');

    const bars = series
      .map((item, idx) => {
        const groupX = padLeft + idx * stepX + stepX * 0.2;
        const barW = Math.min(20, stepX * 0.24);
        const gap = 6;

        const leadsH = (item.leads / yMax) * chartH;
        const leadsY = padTop + chartH - leadsH;

        const atendH = (item.atendimentos / yMax) * chartH;
        const atendY = padTop + chartH - atendH;

        const labelX = padLeft + idx * stepX + stepX / 2;

        return `
          <g>
            <rect x="${groupX}" y="${leadsY}" width="${barW}" height="${leadsH}" rx="4" fill="#1E3A8A">
              <title>${escapeHtml(item.month)}: ${item.leads} leads (demo)</title>
            </rect>
            <text x="${groupX + barW / 2}" y="${leadsY - 5}" text-anchor="middle" font-size="10" font-weight="700" fill="#1E3A8A">${item.leads}</text>

            <rect x="${groupX + barW + gap}" y="${atendY}" width="${barW}" height="${atendH}" rx="4" fill="#0EA5E9">
              <title>${escapeHtml(item.month)}: ${item.atendimentos} atendimentos (demo)</title>
            </rect>
            <text x="${groupX + barW + gap + barW / 2}" y="${atendY - 5}" text-anchor="middle" font-size="10" font-weight="700" fill="#0369A1">${item.atendimentos}</text>

            <text x="${labelX}" y="${height - 12}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#475569">${escapeHtml(item.month)}</text>
          </g>
        `;
      })
      .join('');

    return `
      <svg
        class="crm-evolution-svg"
        viewBox="0 0 ${width} ${height}"
        role="img"
        aria-label="Gráfico demonstrativo de evolução mensal de leads e atendimentos"
      >
        ${gridLines}
        <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" stroke="#CBD5E1" />
        ${bars}
      </svg>
    `;
  }

  function buildOriginDonutSvg(origins) {
    const total = origins.reduce((acc, item) => acc + item.count, 0) || 1;
    const size = 156;
    const cx = size / 2;
    const cy = size / 2;
    const r = 56;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    const slices = origins
      .map((item) => {
        const dash = (item.count / total) * circumference;
        const segment = `
          <circle
            cx="${cx}"
            cy="${cy}"
            r="${r}"
            fill="transparent"
            stroke="${escapeHtml(item.color)}"
            stroke-width="20"
            stroke-dasharray="${dash.toFixed(2)} ${(circumference - dash).toFixed(2)}"
            stroke-dashoffset="${(-offset).toFixed(2)}"
            transform="rotate(-90 ${cx} ${cy})"
          >
            <title>${escapeHtml(item.label)}: ${item.count} (${Math.round((item.count / total) * 100)}%)</title>
          </circle>
        `;
        offset += dash;
        return segment;
      })
      .join('');

    return `
      <svg class="crm-origin-donut-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Distribuição de leads por origem (dados demonstrativos)">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="transparent" stroke="#E2E8F0" stroke-width="20" />
        ${slices}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="20" font-weight="800" fill="#172554">${total}</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#64748B">Leads</text>
      </svg>
    `;
  }

  function renderDashboard(container, options = {}) {
    if (!container) return;

    const comp = getComponents();
    const monthsCount = options.monthsCount === 3 ? 3 : 6;
    const isEmpty = Boolean(options.isEmpty);
    const session = options.session || { name: 'Coordenação Demo', roleLabel: 'Gestor Escolar' };

    const kpisSource = isEmpty
      ? DEMO_DASHBOARD_DATA.kpis.map((kpi) => ({
          ...kpi,
          value: kpi.id === 'taxa-conversao' ? '0,0%' : 0,
          foot: 'Sem dados no estado vazio',
          footTone: ''
        }))
      : DEMO_DASHBOARD_DATA.kpis;

    const kpiCardsHtml = kpisSource
      .map((kpi) =>
        comp
          ? comp.renderKpiCard(kpi)
          : `<article class="crm-kpi-card accent-${escapeHtml(kpi.accent)}"><span class="crm-kpi-label">${escapeHtml(kpi.label)}</span><strong class="crm-kpi-value">${escapeHtml(kpi.value)}</strong><span class="crm-kpi-foot ${escapeHtml(kpi.footTone)}">${escapeHtml(kpi.foot)}</span></article>`
      )
      .join('');

    const visibleEvolution = isEmpty ? [] : DEMO_DASHBOARD_DATA.monthlyEvolution.slice(-monthsCount);
    const funnelList = isEmpty ? [] : DEMO_DASHBOARD_DATA.funnel;
    const originsList = isEmpty ? [] : DEMO_DASHBOARD_DATA.originsDistribution;
    const recentList = isEmpty ? [] : DEMO_DASHBOARD_DATA.recentActivities;
    const tasksList = isEmpty ? [] : DEMO_DASHBOARD_DATA.upcomingTasks;
    const visitsList = isEmpty ? [] : DEMO_DASHBOARD_DATA.upcomingVisits;

    const maxFunnel = Math.max(...funnelList.map((f) => f.count), 1);
    const totalOrigins = originsList.reduce((sum, item) => sum + item.count, 0) || 1;

    const evolutionContentHtml = isEmpty
      ? renderEmptyBox('Sem histórico no período', 'Nenhum dado de evolução de leads disponível no estado vazio.')
      : `
        <div class="crm-chart-legend">
          <span class="crm-legend-item"><span class="crm-legend-swatch leads"></span> Leads recebidos</span>
          <span class="crm-legend-item"><span class="crm-legend-swatch atendimentos"></span> Atendimentos realizados</span>
        </div>
        <div class="crm-chart-box">
          ${buildEvolutionChartSvg(visibleEvolution)}
        </div>
      `;

    const funnelHtml = isEmpty
      ? renderEmptyBox('Funil sem registros', 'Quando houver leads cadastrados, as etapas de conversão aparecerão aqui.')
      : `<div class="crm-funnel-list">${funnelList
          .map((stage) => {
            const pct = Math.round((stage.count / maxFunnel) * 100);
            return `
              <div class="crm-funnel-row">
                <div class="crm-funnel-meta">
                  <span>${escapeHtml(stage.stage)}</span>
                  <strong>${stage.count}</strong>
                </div>
                <div class="crm-funnel-track" role="progressbar" aria-valuenow="${stage.count}" aria-valuemin="0" aria-valuemax="${maxFunnel}" aria-label="${escapeHtml(stage.stage)}">
                  <div class="crm-funnel-bar" style="width: ${pct}%; background-color: ${escapeHtml(stage.color)};"></div>
                </div>
              </div>
            `;
          })
          .join('')}</div>`;

    const originsHtml = isEmpty
      ? renderEmptyBox('Sem dados por origem', 'Nenhuma origem de captação registrada no estado vazio.')
      : `
        <div class="crm-origin-layout">
          <div class="crm-origin-donut">
            ${buildOriginDonutSvg(originsList)}
          </div>
          <ul class="crm-origin-list">
            ${originsList
              .map((origin) => {
                const pct = Math.round((origin.count / totalOrigins) * 100);
                return `
                  <li class="crm-origin-row">
                    <span class="crm-origin-name">
                      <span class="crm-origin-dot" style="background-color: ${escapeHtml(origin.color)};" aria-hidden="true"></span>
                      ${escapeHtml(origin.label)}
                    </span>
                    <span class="crm-origin-meta">
                      <strong>${origin.count}</strong>
                      <small>${pct}%</small>
                    </span>
                  </li>
                `;
              })
              .join('')}
          </ul>
        </div>
      `;

    const recentHtml = isEmpty
      ? renderEmptyBox('Nenhuma atividade recente', 'As movimentações mais recentes da secretaria serão listadas aqui.')
      : `<ul class="crm-activity-list">${recentList
          .map(
            (act) => `
              <li class="crm-activity-item">
                <button
                  type="button"
                  class="crm-activity-item-btn"
                  data-dashboard-detail-title="${escapeHtml(act.title)}"
                  data-dashboard-detail-desc="${escapeHtml(act.detail)}"
                  data-dashboard-detail-time="${escapeHtml(act.time)}"
                  data-dashboard-detail-route="${escapeHtml(act.route)}"
                >
                  <div class="crm-activity-left">
                    <span class="crm-status-dot ${escapeHtml(act.dot)}" aria-hidden="true"></span>
                    <div class="crm-activity-copy">
                      <strong>${escapeHtml(act.title)}</strong>
                      <p>${escapeHtml(act.detail)}</p>
                    </div>
                  </div>
                  <span class="crm-activity-time">${escapeHtml(act.time)}</span>
                </button>
              </li>
            `
          )
          .join('')}</ul>`;

    const tasksHtml = isEmpty
      ? renderEmptyBox('Nenhuma tarefa pendente', 'Não há follow-ups ou tarefas programadas no momento.')
      : `<ul class="crm-activity-list">${tasksList
          .map(
            (task) => `
              <li class="crm-activity-item">
                <button
                  type="button"
                  class="crm-activity-item-btn"
                  data-dashboard-detail-title="${escapeHtml(task.title)}"
                  data-dashboard-detail-desc="${escapeHtml(task.meta)}"
                  data-dashboard-detail-time="${escapeHtml(task.dateTime)}"
                  data-dashboard-detail-route="${escapeHtml(task.route)}"
                >
                  <div class="crm-activity-left">
                    <span class="crm-badge-chip tarefa">${escapeHtml(task.badge)}</span>
                    <div class="crm-activity-copy">
                      <strong>${escapeHtml(task.title)}</strong>
                      <p>${escapeHtml(task.meta)}</p>
                    </div>
                  </div>
                  <span class="crm-activity-time">${escapeHtml(task.dateTime)}</span>
                </button>
              </li>
            `
          )
          .join('')}</ul>`;

    const visitsHtml = isEmpty
      ? renderEmptyBox('Nenhuma visita agendada', 'Os próximos atendimentos presenciais no campus aparecerão aqui.')
      : `<ul class="crm-activity-list">${visitsList
          .map(
            (visit) => `
              <li class="crm-activity-item">
                <button
                  type="button"
                  class="crm-activity-item-btn"
                  data-dashboard-detail-title="${escapeHtml(visit.title)}"
                  data-dashboard-detail-desc="${escapeHtml(visit.meta)}"
                  data-dashboard-detail-time="${escapeHtml(visit.dateTime)}"
                  data-dashboard-detail-route="${escapeHtml(visit.route)}"
                >
                  <div class="crm-activity-left">
                    <span class="crm-badge-chip visita">${escapeHtml(visit.badge)}</span>
                    <div class="crm-activity-copy">
                      <strong>${escapeHtml(visit.title)}</strong>
                      <p>${escapeHtml(visit.meta)}</p>
                    </div>
                  </div>
                  <span class="crm-activity-time">${escapeHtml(visit.dateTime)}</span>
                </button>
              </li>
            `
          )
          .join('')}</ul>`;

    const modalHtml = comp
      ? comp.renderModal({
          id: 'crm-dashboard-detail-modal',
          titleId: 'crm-dash-modal-title',
          title: 'Detalhes do Registro (Demonstração)',
          subtitle: 'Prévia rápida vinculada aos dados demonstrativos do Dashboard',
          bodyHtml: `
            <div class="crm-detail-card">
              <h4 id="crm-dash-modal-item-title">Resumo</h4>
              <p class="crm-detail-notes-text" id="crm-dash-modal-item-desc"></p>
              <span class="crm-dropdown-sub" id="crm-dash-modal-item-time"></span>
            </div>
          `,
          footerHtml: `
            <button type="button" class="btn btn-outline btn-sm" data-modal-close>Fechar</button>
            <button type="button" class="btn btn-primary btn-sm" id="crm-dash-modal-go-btn">Abrir módulo correspondente</button>
          `
        })
      : '';

    container.innerHTML = `
      <section class="crm-demo-banner" aria-label="Aviso de ambiente demonstrativo">
        <div class="crm-demo-banner-copy">
          <strong>Visão Demonstrativa do CRM — Perfil ativo: ${escapeHtml(session.roleLabel)}</strong>
          <span>Os indicadores, gráficos e registros exibidos abaixo são dados fictícios de prototipagem visual, sem conexão com banco de dados real.</span>
        </div>
        <div class="crm-demo-banner-actions">
          <button type="button" class="btn btn-outline btn-sm" id="btn-toggle-dashboard-empty">
            ${isEmpty ? 'Restaurar dados demo' : 'Simular estado vazio'}
          </button>
          <button type="button" class="btn btn-outline btn-sm" data-quick-route="leads">
            Ver Leads
          </button>
          <button type="button" class="btn btn-primary btn-sm" data-quick-route="visitas">
            Ver Visitas
          </button>
        </div>
      </section>

      <section class="crm-kpi-grid" aria-label="Indicadores principais do CRM">
        ${kpiCardsHtml}
      </section>

      <section class="crm-dashboard-grid" aria-label="Análise de evolução e funil">
        <article class="crm-panel">
          <div class="crm-panel-header">
            <div>
              <h2 class="crm-panel-title">Evolução dos Leads</h2>
              <p class="crm-panel-subtitle">Comparativo mensal com dados demonstrativos</p>
            </div>
            <div class="crm-filter-pills" role="group" aria-label="Selecionar período do gráfico">
              <button
                type="button"
                class="crm-filter-pill${monthsCount === 3 ? ' is-active' : ''}"
                data-evolution-months="3"
                aria-pressed="${monthsCount === 3 ? 'true' : 'false'}"
              >
                3 meses
              </button>
              <button
                type="button"
                class="crm-filter-pill${monthsCount === 6 ? ' is-active' : ''}"
                data-evolution-months="6"
                aria-pressed="${monthsCount === 6 ? 'true' : 'false'}"
              >
                6 meses
              </button>
            </div>
          </div>

          ${evolutionContentHtml}
        </article>

        <article class="crm-panel">
          <div class="crm-panel-header">
            <div>
              <h2 class="crm-panel-title">Funil de Conversão</h2>
              <p class="crm-panel-subtitle">Distribuição por etapa (dados demo)</p>
            </div>
          </div>

          ${funnelHtml}
        </article>
      </section>

      <section class="crm-dashboard-secondary-grid" aria-label="Origens e atividades recentes">
        <article class="crm-panel">
          <div class="crm-panel-header">
            <div>
              <h2 class="crm-panel-title">Distribuição dos Leads por Origem</h2>
              <p class="crm-panel-subtitle">Canais de captação (dados demo)</p>
            </div>
            <button type="button" class="crm-link-btn" data-quick-route="relatorios">Ver Relatórios</button>
          </div>
          ${originsHtml}
        </article>

        <article class="crm-panel">
          <div class="crm-panel-header">
            <div>
              <h2 class="crm-panel-title">Atividades Recentes</h2>
              <p class="crm-panel-subtitle">Movimentações fictícias de demonstração</p>
            </div>
            <button type="button" class="crm-link-btn" data-quick-route="atendimentos">Ir para Atendimentos</button>
          </div>
          ${recentHtml}
        </article>
      </section>

      <section class="crm-dashboard-lower-grid" aria-label="Próximas tarefas e próximas visitas">
        <article class="crm-panel">
          <div class="crm-panel-header">
            <div>
              <h2 class="crm-panel-title">Próximas Tarefas</h2>
              <p class="crm-panel-subtitle">Follow-ups programados (dados demo)</p>
            </div>
            <button type="button" class="crm-link-btn" data-quick-route="tarefas">Ir para Tarefas</button>
          </div>
          ${tasksHtml}
        </article>

        <article class="crm-panel">
          <div class="crm-panel-header">
            <div>
              <h2 class="crm-panel-title">Próximas Visitas</h2>
              <p class="crm-panel-subtitle">Agendamentos ao campus (dados demo)</p>
            </div>
            <button type="button" class="crm-link-btn" data-quick-route="visitas">Ir para Visitas</button>
          </div>
          ${visitsHtml}
        </article>
      </section>

      ${modalHtml}
    `;

    const toggleEmptyBtn = container.querySelector('#btn-toggle-dashboard-empty');
    if (toggleEmptyBtn) {
      toggleEmptyBtn.addEventListener('click', () => {
        renderDashboard(container, { ...options, isEmpty: !isEmpty });
      });
    }

    container.querySelectorAll('[data-evolution-months]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const nextMonths = Number(btn.getAttribute('data-evolution-months'));
        renderDashboard(container, { ...options, monthsCount: nextMonths });
      });
    });

    container.querySelectorAll('[data-quick-route]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-quick-route');
        if (typeof options.onNavigate === 'function') {
          options.onNavigate(target);
        }
      });
    });

    const detailModalEl = container.querySelector('#crm-dashboard-detail-modal');
    const modalCtrl = comp && detailModalEl ? comp.bindModalController(detailModalEl) : null;
    let selectedDetailRoute = 'dashboard';

    if (modalCtrl && detailModalEl) {
      const goBtn = detailModalEl.querySelector('#crm-dash-modal-go-btn');
      if (goBtn) {
        goBtn.addEventListener('click', () => {
          modalCtrl.close(false);
          if (typeof options.onNavigate === 'function') {
            options.onNavigate(selectedDetailRoute);
          }
        });
      }

      container.querySelectorAll('[data-dashboard-detail-title]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const itemTitle = btn.getAttribute('data-dashboard-detail-title') || '';
          const itemDesc = btn.getAttribute('data-dashboard-detail-desc') || '';
          const itemTime = btn.getAttribute('data-dashboard-detail-time') || '';
          selectedDetailRoute = btn.getAttribute('data-dashboard-detail-route') || 'dashboard';

          const titleEl = detailModalEl.querySelector('#crm-dash-modal-item-title');
          const descEl = detailModalEl.querySelector('#crm-dash-modal-item-desc');
          const timeEl = detailModalEl.querySelector('#crm-dash-modal-item-time');
          if (titleEl) titleEl.textContent = itemTitle;
          if (descEl) descEl.textContent = itemDesc;
          if (timeEl) timeEl.textContent = `Horário / Registro: ${itemTime}`;

          modalCtrl.open(btn);
        });
      });
    }
  }

  globalScope.EnsinaAiCrmDashboard = Object.freeze({
    DEMO_DASHBOARD_DATA,
    renderDashboard
  });
})(window);
