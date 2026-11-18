/**
 * ENSINA AÍ — CRM Escolar
 * Módulo de Interface de Relatórios (js/crm/relatorios.js)
 * JavaScript Vanilla ES6+ — Dados demonstrativos consolidados localmente + exportação CSV
 */

(function initCrmRelatoriosView(globalScope) {
  'use strict';

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderBarSvg(items, labelKey, valueKey, color = '#1E3A8A', ariaLabel = 'Gráfico') {
    if (!items || items.length === 0) {
      return '<div class="crm-empty-state"><strong>Sem dados no período</strong><p>Nenhum registro encontrado para os filtros aplicados.</p></div>';
    }

    const width = 560;
    const height = 220;
    const padLeft = 36;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 42;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const maxVal = Math.max(4, ...items.map((i) => Number(i[valueKey]) || 0));
    const yMax = Math.ceil(maxVal / 4) * 4;
    const stepX = chartW / items.length;

    const grid = [0, 0.25, 0.5, 0.75, 1]
      .map((r) => {
        const y = padTop + chartH - r * chartH;
        const val = Math.round(r * yMax);
        return `
          <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3 3" />
          <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="#64748B">${val}</text>
        `;
      })
      .join('');

    const bars = items
      .map((item, idx) => {
        const val = Number(item[valueKey]) || 0;
        const barW = Math.min(34, Math.max(14, stepX * 0.45));
        const cx = padLeft + idx * stepX + stepX / 2;
        const barH = (val / yMax) * chartH;
        const barY = padTop + chartH - barH;
        const rawLabel = String(item[labelKey] || '');
        const shortLabel = rawLabel.length > 13 ? `${rawLabel.slice(0, 12)}…` : rawLabel;

        return `
          <g>
            <rect x="${cx - barW / 2}" y="${barY}" width="${barW}" height="${barH}" rx="4" fill="${escapeHtml(color)}">
              <title>${escapeHtml(rawLabel)}: ${val}</title>
            </rect>
            <text x="${cx}" y="${Math.max(12, barY - 5)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#172554">${val}</text>
            <text x="${cx}" y="${height - 14}" text-anchor="middle" font-size="10" font-weight="600" fill="#475569">${escapeHtml(shortLabel)}</text>
          </g>
        `;
      })
      .join('');

    return `
      <svg class="crm-evolution-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(ariaLabel)}">
        ${grid}
        <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" stroke="#CBD5E1" />
        ${bars}
      </svg>
    `;
  }

  function renderTableSection(title, subtitle, csvKey, columns, rowsHtml, emptyMsg) {
    return `
      <article class="crm-panel crm-report-section" data-report-section="${escapeHtml(csvKey)}">
        <div class="crm-panel-header">
          <div>
            <h3 class="crm-panel-title">${escapeHtml(title)}</h3>
            <p class="crm-panel-subtitle">${escapeHtml(subtitle)}</p>
          </div>
          <button
            type="button"
            class="btn btn-outline btn-sm"
            data-export-csv-key="${escapeHtml(csvKey)}"
          >
            Exportar CSV
          </button>
        </div>

        <div class="crm-table-scroll" role="region" aria-label="${escapeHtml(title)}">
          <table class="crm-table crm-report-table">
            <thead>
              <tr>${columns.map((c) => `<th>${escapeHtml(c)}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${rowsHtml || `<tr><td colspan="${columns.length}" class="crm-table-empty-cell">${escapeHtml(emptyMsg)}</td></tr>`}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }

  function renderRelatoriosModule(container, options = {}) {
    const service = globalScope.EnsinaAiRelatoriosService;
    if (!container || !service) return;

    const session = options.session || {
      role: 'gestor',
      roleLabel: 'Gestor Escolar',
      name: 'Coordenação Demo'
    };
    const isAtendente = session.role === 'atendente';
    const scopedOwner = isAtendente ? (session.name || 'Secretaria Demo') : '';
    const notify = typeof options.onToast === 'function' ? options.onToast : () => {};
    const availableTabs = isAtendente
      ? service.REPORT_TABS.filter((t) => t.codigo !== 'desempenho_atendente')
      : service.REPORT_TABS;

    const state = {
      period: 'todos',
      startDate: '',
      endDate: '',
      activeTab: 'visao_geral'
    };

    container.innerHTML = `
      <div class="crm-relatorios-module" id="crm-relatorios-module">
        <section class="crm-leads-header-bar">
          <div>
            <div class="crm-leads-title-row">
              <h2>${isAtendente ? 'Meu Desempenho' : 'Relatórios'}</h2>
              <span class="crm-demo-pill">Exportação CSV demonstrativa</span>
            </div>
            <p class="crm-leads-subtitle">
              ${
                isAtendente
                  ? `Acompanhe os indicadores individuais da sua carteira (${escapeHtml(scopedOwner)}), conversões pessoais, atendimentos, visitas e tarefas por período.`
                  : 'Analise captação global, conversão em matrículas, leads perdidos, tempo de resposta e desempenho comparativo por atendente com exportação CSV.'
              }
            </p>
          </div>
          <div class="crm-leads-header-actions">
            <button type="button" class="btn btn-primary" id="btn-export-relatorio-csv">
              Exportar CSV
            </button>
          </div>
        </section>

        ${
          isAtendente
            ? `<section class="crm-role-scope-banner" id="relatorios-role-scope-banner" aria-label="Escopo de desempenho individual">
                <strong>Visão individual:</strong>
                <span>Os indicadores e a exportação CSV consideram exclusivamente os registros vinculados a ${escapeHtml(scopedOwner)}. Relatórios comparativos da equipe ficam disponíveis no perfil Gestor Escolar.</span>
              </section>`
            : ''
        }

        <!-- Barra de Filtros de Período e Abas de Relatórios -->
        <section class="crm-filters-card" aria-label="Filtros de período e seleção de relatório">
          <div class="crm-filters-grid crm-relatorios-filters-grid">
            <div class="crm-filter-field">
              <label for="relatorios-filter-period">Período de análise</label>
              <select id="relatorios-filter-period" class="form-control crm-input-compact">
                ${service.PERIOD_OPTIONS.map(
                  (p) => `<option value="${escapeHtml(p.codigo)}">${escapeHtml(p.label)}</option>`
                ).join('')}
              </select>
            </div>

            <div class="crm-filter-field" id="relatorios-custom-start-wrap" hidden>
              <label for="relatorios-date-start">Data inicial</label>
              <input type="date" id="relatorios-date-start" class="form-control crm-input-compact" />
            </div>

            <div class="crm-filter-field" id="relatorios-custom-end-wrap" hidden>
              <label for="relatorios-date-end">Data final</label>
              <input type="date" id="relatorios-date-end" class="form-control crm-input-compact" />
            </div>

            <div class="crm-filter-field crm-relatorio-select-field">
              <label for="relatorios-filter-tab">Relatório em destaque</label>
              <select id="relatorios-filter-tab" class="form-control crm-input-compact">
                ${availableTabs.map(
                  (t) => `<option value="${escapeHtml(t.codigo)}">${escapeHtml(t.label)}</option>`
                ).join('')}
              </select>
            </div>
          </div>

          <div class="crm-report-tabs-bar" id="relatorios-tabs-bar" role="tablist" aria-label="Relatórios disponíveis">
            ${availableTabs.map(
              (t) => `
                <button
                  type="button"
                  role="tab"
                  class="crm-report-tab-btn${t.codigo === state.activeTab ? ' is-active' : ''}"
                  data-report-tab="${escapeHtml(t.codigo)}"
                  aria-selected="${t.codigo === state.activeTab ? 'true' : 'false'}"
                >
                  ${escapeHtml(t.label)}
                </button>
              `
            ).join('')}
          </div>

          <div class="crm-filters-footer">
            <span class="crm-results-counter" id="relatorios-period-counter"></span>
            <button type="button" class="btn btn-outline btn-sm" id="btn-clear-relatorios-filters">
              Limpar filtros
            </button>
          </div>
        </section>

        <!-- Indicadores Resumidos -->
        <section class="crm-kpi-grid crm-relatorios-kpi-grid" id="relatorios-kpi-row" aria-label="Indicadores resumidos dos relatórios"></section>

        <!-- Indicadores Gerenciais Extras (Gestor Escolar) -->
        <section class="crm-gestor-metrics-strip" id="relatorios-gestor-insights" aria-label="Indicadores gerenciais complementares" ${isAtendente ? 'hidden' : ''}></section>

        <!-- Gráficos Analíticos -->
        <section class="crm-dashboard-lower-grid" id="relatorios-charts-row" aria-label="Gráficos dos relatórios"></section>

        <!-- Tabelas dos Relatórios -->
        <section class="crm-reports-stack" id="relatorios-tables-stack" aria-label="Tabelas analíticas dos relatórios"></section>
      </div>
    `;

    const periodSel = container.querySelector('#relatorios-filter-period');
    const customStartWrap = container.querySelector('#relatorios-custom-start-wrap');
    const customEndWrap = container.querySelector('#relatorios-custom-end-wrap');
    const startInput = container.querySelector('#relatorios-date-start');
    const endInput = container.querySelector('#relatorios-date-end');
    const tabSel = container.querySelector('#relatorios-filter-tab');
    const tabsBar = container.querySelector('#relatorios-tabs-bar');
    const clearBtn = container.querySelector('#btn-clear-relatorios-filters');
    const exportMainBtn = container.querySelector('#btn-export-relatorio-csv');
    const counterEl = container.querySelector('#relatorios-period-counter');
    const kpiRowEl = container.querySelector('#relatorios-kpi-row');
    const gestorInsightsEl = container.querySelector('#relatorios-gestor-insights');
    const chartsRowEl = container.querySelector('#relatorios-charts-row');
    const tablesStackEl = container.querySelector('#relatorios-tables-stack');

    function syncTabControls() {
      tabSel.value = state.activeTab;
      tabsBar.querySelectorAll('[data-report-tab]').forEach((btn) => {
        const active = btn.getAttribute('data-report-tab') === state.activeTab;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-selected', active ? 'true' : 'false');
      });
    }

    function syncPeriodControls() {
      const isCustom = state.period === 'personalizado';
      customStartWrap.hidden = !isCustom;
      customEndWrap.hidden = !isCustom;
    }

    function renderReports() {
      syncPeriodControls();
      syncTabControls();

      const snap = service.buildReportsSnapshot({
        period: state.period,
        startDate: state.startDate,
        endDate: state.endDate,
        ownerFilter: scopedOwner,
        role: isAtendente ? 'atendente' : 'gestor'
      });
      const s = snap.summary;
      const periodLabel =
        (service.PERIOD_OPTIONS.find((p) => p.codigo === state.period) || {}).label || 'Todo o período';

      counterEl.textContent = isAtendente
        ? `Carteira: ${scopedOwner} • ${periodLabel} • ${s.totalLeads} leads, ${s.atendimentosRealizados} atendimentos, ${s.visitasTotal} visitas e ${s.tarefasTotal} tarefas.`
        : `Período ativo: ${periodLabel} • ${s.totalLeads} leads, ${s.atendimentosRealizados} atendimentos, ${s.visitasTotal} visitas e ${s.tarefasTotal} tarefas.`;

      // Indicadores resumidos
      const kpis = [
        { id: 'rel-kpi-leads', label: isAtendente ? 'Meus leads recebidos' : 'Leads recebidos', value: s.totalLeads, foot: `${s.matriculados} matriculados`, accent: 'navy' },
        { id: 'rel-kpi-conversao', label: 'Conversão em matrículas', value: s.taxaConversao, foot: `${s.matriculados} de ${s.totalLeads} leads`, accent: 'green' },
        { id: 'rel-kpi-atend', label: 'Atendimentos realizados', value: s.atendimentosRealizados, foot: `${s.atendimentosConcluidos} concluídos`, accent: 'sky' },
        { id: 'rel-kpi-visitas', label: 'Visitas agendadas / realizadas', value: `${s.visitasAgendadas} / ${s.visitasRealizadas}`, foot: `${s.visitasTotal} no período`, accent: 'amber' }
      ];

      kpiRowEl.innerHTML = kpis
        .map(
          (k) => `
          <article class="crm-kpi-card accent-${escapeHtml(k.accent)}" id="${escapeHtml(k.id)}">
            <span class="crm-kpi-label">${escapeHtml(k.label)}</span>
            <strong class="crm-kpi-value">${escapeHtml(k.value)}</strong>
            <span class="crm-kpi-foot">${escapeHtml(k.foot)}</span>
          </article>
        `
        )
        .join('');

      if (gestorInsightsEl && !isAtendente) {
        gestorInsightsEl.innerHTML = `
          <article class="crm-mini-stat">
            <span>Leads perdidos</span>
            <strong id="rel-gestor-lost">${s.leadsPerdidos}</strong>
          </article>
          <article class="crm-mini-stat">
            <span>Tempo médio até 1º contato</span>
            <strong id="rel-gestor-sla">${escapeHtml(s.tempoMedioPrimeiroContatoHoras)}</strong>
          </article>
          <article class="crm-mini-stat">
            <span>Conversão visitas &rarr; matrículas</span>
            <strong id="rel-gestor-visit-conv">${escapeHtml(s.taxaConversaoVisitas)}</strong>
          </article>
          <article class="crm-mini-stat${s.tarefasAtrasadas > 0 ? ' is-alert' : ''}">
            <span>Tarefas atrasadas da equipe</span>
            <strong id="rel-gestor-overdue">${s.tarefasAtrasadas}</strong>
          </article>
        `;
      }

      // Gráficos
      const originChartHtml = renderBarSvg(
        snap.leadsPorOrigem,
        'origem',
        'quantidade',
        '#1E3A8A',
        'Gráfico de leads por origem'
      );
      const statusChartHtml = renderBarSvg(
        snap.leadsPorStatus,
        'status',
        'quantidade',
        '#0EA5E9',
        'Gráfico de leads por status'
      );

      chartsRowEl.innerHTML = `
        <article class="crm-panel">
          <div class="crm-panel-header">
            <div>
              <h3 class="crm-panel-title">Leads por origem</h3>
              <p class="crm-panel-subtitle">Volume captado por canal no período</p>
            </div>
          </div>
          <div class="crm-chart-box">${originChartHtml}</div>
        </article>

        <article class="crm-panel">
          <div class="crm-panel-header">
            <div>
              <h3 class="crm-panel-title">Leads por status</h3>
              <p class="crm-panel-subtitle">Distribuição operacional no funil escolar</p>
            </div>
          </div>
          <div class="crm-chart-box">${statusChartHtml}</div>
        </article>
      `;

      // Construção dos 8 blocos de tabelas
      const sections = {
        leads_recebidos: renderTableSection(
          '1. Leads recebidos',
          'Listagem de famílias cadastradas dentro do período filtrado',
          'leads_recebidos',
          ['ID', 'Responsável', 'Aluno', 'Etapa', 'Origem', 'Atendente', 'Status', 'Data'],
          snap.leadsRecebidos
            .map(
              (r) => `
              <tr>
                <td><span class="crm-lead-ref-code">${escapeHtml(r.id)}</span></td>
                <td><strong>${escapeHtml(r.responsavel)}</strong></td>
                <td>${escapeHtml(r.aluno)}</td>
                <td>${escapeHtml(r.etapa)}</td>
                <td>${escapeHtml(r.origem)}</td>
                <td>${escapeHtml(r.atendente)}</td>
                <td>${escapeHtml(r.status)}</td>
                <td>${escapeHtml(r.data)}</td>
              </tr>
            `
            )
            .join(''),
          'Nenhum lead recebido no período selecionado.'
        ),

        leads_origem: renderTableSection(
          '2. Leads por origem',
          'Participação e conversão por canal de entrada',
          'leads_origem',
          ['Origem', 'Quantidade', 'Participação', 'Matrículas', 'Conversão'],
          snap.leadsPorOrigem
            .map(
              (r) => `
              <tr>
                <td><strong>${escapeHtml(r.origem)}</strong></td>
                <td class="crm-td-num">${r.quantidade}</td>
                <td class="crm-td-num">${escapeHtml(r.participacao)}</td>
                <td class="crm-td-num">${r.matriculas}</td>
                <td class="crm-td-num"><strong class="crm-num-highlight">${escapeHtml(r.conversao)}</strong></td>
              </tr>
            `
            )
            .join(''),
          'Sem leads por origem no período.'
        ),

        leads_status: renderTableSection(
          '3. Leads por status',
          'Situação atual dos leads filtrados',
          'leads_status',
          ['Status', 'Quantidade', 'Participação'],
          snap.leadsPorStatus
            .map(
              (r) => `
              <tr>
                <td><strong>${escapeHtml(r.status)}</strong></td>
                <td class="crm-td-num">${r.quantidade}</td>
                <td class="crm-td-num">${escapeHtml(r.participacao)}</td>
              </tr>
            `
            )
            .join(''),
          'Sem leads por status no período.'
        ),

        conversao_matriculas: renderTableSection(
          '4. Conversão em matrículas',
          'Desempenho de conversão por etapa escolar',
          'conversao_matriculas',
          ['Etapa escolar', 'Total de leads', 'Em negociação', 'Matrículas', 'Perdidos', 'Taxa de conversão'],
          snap.conversaoMatriculas
            .map(
              (r) => `
              <tr>
                <td><strong>${escapeHtml(r.etapa)}</strong></td>
                <td class="crm-td-num">${r.totalLeads}</td>
                <td class="crm-td-num">${r.emNegociacao}</td>
                <td class="crm-td-num"><strong class="crm-num-highlight">${r.matriculas}</strong></td>
                <td class="crm-td-num">${r.perdidos}</td>
                <td class="crm-td-num"><strong>${escapeHtml(r.taxaConversao)}</strong></td>
              </tr>
            `
            )
            .join(''),
          'Sem dados de conversão no período.'
        ),

        atendimentos_realizados: renderTableSection(
          '5. Atendimentos realizados',
          'Consolidado por canal de atendimento no período',
          'atendimentos_realizados',
          ['Canal', 'Total', 'Concluídos', 'Em aberto', 'Cancelados', 'Taxa de conclusão'],
          snap.atendimentosPorCanal
            .map(
              (r) => `
              <tr>
                <td><strong>${escapeHtml(r.canal)}</strong></td>
                <td class="crm-td-num">${r.total}</td>
                <td class="crm-td-num">${r.concluidos}</td>
                <td class="crm-td-num">${r.emAberto}</td>
                <td class="crm-td-num">${r.cancelados}</td>
                <td class="crm-td-num"><strong>${escapeHtml(r.taxaConclusao)}</strong></td>
              </tr>
            `
            )
            .join(''),
          'Nenhum atendimento registrado no período.'
        ),

        visitas: renderTableSection(
          '6. Visitas agendadas e realizadas',
          `Resumo: ${s.visitasAgendadas} agendada(s)/confirmada(s) e ${s.visitasRealizadas} realizada(s)`,
          'visitas',
          ['ID', 'Responsável', 'Aluno', 'Data', 'Horário', 'Responsável interno', 'Status'],
          snap.visitasLista
            .map(
              (r) => `
              <tr>
                <td><span class="crm-lead-ref-code">${escapeHtml(r.id)}</span></td>
                <td><strong>${escapeHtml(r.responsavel)}</strong></td>
                <td>${escapeHtml(r.aluno)}</td>
                <td>${escapeHtml(r.data)}</td>
                <td>${escapeHtml(r.horario)}</td>
                <td>${escapeHtml(r.responsavelInterno)}</td>
                <td><span class="crm-status-badge crm-visita-status-${escapeHtml(r.statusCodigo)}">${escapeHtml(r.status)}</span></td>
              </tr>
            `
            )
            .join(''),
          'Nenhuma visita registrada no período.'
        ),

        desempenho_atendente: renderTableSection(
          '7. Desempenho por atendente',
          'Comparativo individual de produtividade e matrículas',
          'desempenho_atendente',
          ['Atendente', 'Leads', 'Atendimentos', 'Visitas realizadas', 'Tarefas concluídas', 'Matrículas', 'Conversão'],
          snap.desempenhoAtendentes
            .map(
              (r) => `
              <tr>
                <td><strong>${escapeHtml(r.atendente)}</strong></td>
                <td class="crm-td-num">${r.leads}</td>
                <td class="crm-td-num">${r.atendimentos}</td>
                <td class="crm-td-num">${r.visitasRealizadas}</td>
                <td class="crm-td-num">${r.tarefasConcluidas}</td>
                <td class="crm-td-num"><strong class="crm-num-highlight">${r.matriculas}</strong></td>
                <td class="crm-td-num"><strong>${escapeHtml(r.conversao)}</strong></td>
              </tr>
            `
            )
            .join(''),
          'Sem dados de atendentes no período.'
        ),

        tarefas: renderTableSection(
          '8. Tarefas concluídas e atrasadas',
          `Resumo: ${s.tarefasConcluidas} concluída(s) e ${s.tarefasAtrasadas} atrasada(s)`,
          'tarefas',
          ['ID', 'Título', 'Responsável', 'Vencimento', 'Prioridade', 'Status', 'Atrasada'],
          snap.tarefasLista
            .map(
              (r) => `
              <tr class="${r.isOverdue ? 'is-overdue-row' : ''}">
                <td><span class="crm-lead-ref-code">${escapeHtml(r.id)}</span></td>
                <td><strong>${escapeHtml(r.titulo)}</strong></td>
                <td>${escapeHtml(r.responsavel)}</td>
                <td>${escapeHtml(r.vencimento)}</td>
                <td>${escapeHtml(r.prioridade)}</td>
                <td>${escapeHtml(r.status)}</td>
                <td>${r.isOverdue ? '<span class="crm-overdue-tag">Atrasada</span>' : 'Não'}</td>
              </tr>
            `
            )
            .join(''),
          'Nenhuma tarefa encontrada no período.'
        )
      };

      if (state.activeTab === 'visao_geral') {
        const visibleSections = Object.entries(sections)
          .filter(([key]) => !isAtendente || key !== 'desempenho_atendente')
          .map(([, html]) => html);
        tablesStackEl.innerHTML = visibleSections.join('');
      } else {
        tablesStackEl.innerHTML = sections[state.activeTab] || sections.leads_recebidos;
      }
    }

    function handleCsvExport(reportKey) {
      const { filename } = service.downloadCsv(reportKey, {
        period: state.period,
        startDate: state.startDate,
        endDate: state.endDate,
        ownerFilter: scopedOwner,
        role: isAtendente ? 'atendente' : 'gestor'
      });
      notify(`Arquivo CSV gerado para download: ${filename}`);
    }

    periodSel.addEventListener('change', () => {
      state.period = periodSel.value;
      renderReports();
    });

    startInput.addEventListener('change', () => {
      state.startDate = startInput.value;
      renderReports();
    });

    endInput.addEventListener('change', () => {
      state.endDate = endInput.value;
      renderReports();
    });

    tabSel.addEventListener('change', () => {
      state.activeTab = tabSel.value;
      renderReports();
    });

    tabsBar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-report-tab]');
      if (!btn) return;
      state.activeTab = btn.getAttribute('data-report-tab') || 'visao_geral';
      renderReports();
    });

    clearBtn.addEventListener('click', () => {
      state.period = 'todos';
      state.startDate = '';
      state.endDate = '';
      state.activeTab = 'visao_geral';
      periodSel.value = 'todos';
      startInput.value = '';
      endInput.value = '';
      renderReports();
    });

    exportMainBtn.addEventListener('click', () => {
      handleCsvExport(state.activeTab);
    });

    tablesStackEl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-export-csv-key]');
      if (!btn) return;
      handleCsvExport(btn.getAttribute('data-export-csv-key') || 'visao_geral');
    });

    renderReports();
  }

  globalScope.EnsinaAiCrmRelatorios = Object.freeze({
    renderRelatoriosModule
  });
})(window);
