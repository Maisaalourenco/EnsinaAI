/**
 * ENSINA AÍ — CRM Escolar
 * Camada de Serviços de Relatórios (js/crm/relatorios-service.js)
 * Consolida indicadores, tabelas e exportação CSV a partir dos dados demonstrativos
 * disponíveis localmente nos módulos de Leads, Atendimentos, Tarefas, Visitas e Equipe.
 */

(function initCrmRelatoriosService(globalScope) {
  'use strict';

  const PERIOD_OPTIONS = Object.freeze([
    { codigo: 'todos', label: 'Todo o período' },
    { codigo: 'hoje', label: 'Hoje' },
    { codigo: '7d', label: 'Últimos 7 dias' },
    { codigo: '30d', label: 'Últimos 30 dias' },
    { codigo: '90d', label: 'Últimos 90 dias' },
    { codigo: 'personalizado', label: 'Período personalizado' }
  ]);

  const REPORT_TABS = Object.freeze([
    { codigo: 'visao_geral', label: 'Todos os relatórios' },
    { codigo: 'leads_recebidos', label: 'Leads recebidos' },
    { codigo: 'leads_origem', label: 'Leads por origem' },
    { codigo: 'leads_status', label: 'Leads por status' },
    { codigo: 'conversao_matriculas', label: 'Conversão em matrículas' },
    { codigo: 'atendimentos_realizados', label: 'Atendimentos realizados' },
    { codigo: 'visitas', label: 'Visitas' },
    { codigo: 'desempenho_atendente', label: 'Desempenho por atendente' },
    { codigo: 'tarefas', label: 'Tarefas' }
  ]);

  function parseDateBound(dateStr, endOfDay = false) {
    if (!dateStr) return null;
    const suffix = endOfDay ? 'T23:59:59.999' : 'T00:00:00.000';
    const d = new Date(`${dateStr}${suffix}`);
    return Number.isNaN(d.getTime()) ? null : d.getTime();
  }

  function matchesDateFilter(dateInput, period = 'todos', startDate = '', endDate = '') {
    if (!period || period === 'todos') return true;
    if (!dateInput) return false;

    const rawStr = String(dateInput);
    const normalizedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawStr)
      ? new Date(`${rawStr}T12:00:00`)
      : new Date(rawStr);
    if (Number.isNaN(normalizedDate.getTime())) return false;

    const ts = normalizedDate.getTime();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

    if (period === 'hoje') {
      return ts >= startOfToday && ts <= endOfToday;
    }
    if (period === '7d') {
      const minTs = startOfToday - 6 * 86400000;
      return ts >= minTs;
    }
    if (period === '30d') {
      const minTs = startOfToday - 29 * 86400000;
      return ts >= minTs;
    }
    if (period === '90d') {
      const minTs = startOfToday - 89 * 86400000;
      return ts >= minTs;
    }
    if (period === 'personalizado') {
      const minBound = parseDateBound(startDate, false);
      const maxBound = parseDateBound(endDate, true);
      if (minBound !== null && ts < minBound) return false;
      if (maxBound !== null && ts > maxBound) return false;
      return true;
    }
    return true;
  }

  function formatPct(num, den) {
    if (!den || den <= 0) return '0,0%';
    return `${((num / den) * 100).toFixed(1).replace('.', ',')}%`;
  }

  function formatDateBr(dateInput) {
    if (!dateInput) return '—';
    const raw = String(dateInput);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const parts = raw.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  function matchOwner(a, b) {
    const eqSvc = globalScope.EnsinaAiEquipeService;
    if (eqSvc && typeof eqSvc.matchOwnerName === 'function') {
      return eqSvc.matchOwnerName(a, b);
    }
    return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
  }

  function buildReportsSnapshot(filters = {}) {
    const period = filters.period || 'todos';
    const startDate = filters.startDate || '';
    const endDate = filters.endDate || '';

    const leadsSvc = globalScope.EnsinaAiLeadsService || null;
    const atendSvc = globalScope.EnsinaAiAtendimentosService || null;
    const tarefasSvc = globalScope.EnsinaAiTarefasService || null;
    const visitasSvc = globalScope.EnsinaAiVisitasService || null;
    const equipeSvc = globalScope.EnsinaAiEquipeService || null;

    const allLeads =
      leadsSvc && typeof leadsSvc.listLeads === 'function'
        ? leadsSvc.listLeads({ page: 1, pageSize: 1000 }).items || []
        : [];
    const allAtends =
      atendSvc && typeof atendSvc.listAtendimentos === 'function'
        ? atendSvc.listAtendimentos({ page: 1, pageSize: 1000 }).items || []
        : [];
    const allTarefas =
      tarefasSvc && typeof tarefasSvc.listTarefas === 'function'
        ? tarefasSvc.listTarefas({ page: 1, pageSize: 1000 }).items || []
        : [];
    const allVisitas =
      visitasSvc && typeof visitasSvc.listVisitas === 'function'
        ? visitasSvc.listVisitas({ page: 1, pageSize: 1000 }).items || []
        : [];
    const allMembers =
      equipeSvc && typeof equipeSvc.listMembers === 'function'
        ? equipeSvc.listMembers({}).items || []
        : [];

    const ownerFilter =
      filters.ownerFilter && filters.ownerFilter !== 'todos' ? String(filters.ownerFilter).trim() : '';
    const roleScope = filters.role === 'atendente' ? 'atendente' : 'gestor';

    const leads = allLeads.filter(
      (l) =>
        matchesDateFilter(l.criado_em, period, startDate, endDate) &&
        (!ownerFilter || matchOwner(l.atendente, ownerFilter))
    );
    const atends = allAtends.filter(
      (a) =>
        matchesDateFilter(a.data_hora, period, startDate, endDate) &&
        (!ownerFilter || matchOwner(a.responsavel_atendimento, ownerFilter))
    );
    const visitas = allVisitas.filter((v) => {
      const visitDate = v.data || v.data_visita;
      return (
        matchesDateFilter(visitDate, period, startDate, endDate) &&
        (!ownerFilter || matchOwner(v.responsavel_interno, ownerFilter))
      );
    });
    const tarefas = allTarefas.filter(
      (t) =>
        matchesDateFilter(t.data_vencimento, period, startDate, endDate) &&
        (!ownerFilter || matchOwner(t.responsavel_tarefa, ownerFilter))
    );

    // Resumo geral
    const totalLeads = leads.length;
    const matriculados = leads.filter((l) => l.status === 'concluido').length;
    const leadsPerdidos = leads.filter((l) => l.status === 'perdido').length;
    const taxaConversao = formatPct(matriculados, totalLeads);
    const atendimentosRealizados = atends.filter((a) => a.status !== 'cancelado').length;
    const atendimentosConcluidos = atends.filter((a) => a.status === 'concluido').length;
    const visitasAgendadas = visitas.filter((v) => v.status === 'agendada' || v.status === 'confirmada').length;
    const visitasRealizadas = visitas.filter((v) => v.status === 'realizada').length;
    const taxaConversaoVisitas = formatPct(
      matriculados,
      visitasRealizadas + visitasAgendadas > 0 ? visitasRealizadas + visitasAgendadas : 0
    );
    const tarefasConcluidas = tarefas.filter((t) => t.status === 'concluida').length;
    const tarefasAtrasadas = tarefas.filter((t) =>
      tarefasSvc && typeof tarefasSvc.isTaskOverdue === 'function' ? tarefasSvc.isTaskOverdue(t) : false
    ).length;

    // Tempo médio demonstrativo até o 1º atendimento por lead
    const responseHoursSamples = [];
    leads.forEach((lead) => {
      const leadAtends = allAtends
        .filter((a) => a.lead_id === lead.id && a.data_hora)
        .sort((x, y) => new Date(x.data_hora).getTime() - new Date(y.data_hora).getTime());
      if (leadAtends.length > 0 && lead.criado_em) {
        const diffH =
          (new Date(leadAtends[0].data_hora).getTime() - new Date(lead.criado_em).getTime()) / 3600000;
        if (diffH >= 0 && diffH <= 240) {
          responseHoursSamples.push(diffH);
        }
      }
    });
    const tempoMedioPrimeiroContatoHoras =
      responseHoursSamples.length > 0
        ? `${(responseHoursSamples.reduce((s, n) => s + n, 0) / responseHoursSamples.length)
            .toFixed(1)
            .replace('.', ',')}h`
        : '1,8h';

    // 1. Leads recebidos
    const leadsRecebidos = leads
      .slice()
      .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
      .map((l) => ({
        id: l.id,
        responsavel: l.nome_responsavel,
        aluno: l.nome_aluno || 'Não informado',
        etapa: leadsSvc ? leadsSvc.getStageLabel(l.etapa_codigo) : l.etapa_codigo,
        origem: leadsSvc ? leadsSvc.getOriginLabel(l.origem) : l.origem,
        atendente: l.atendente,
        status: leadsSvc ? leadsSvc.getStatusLabel(l.status) : l.status,
        data: formatDateBr(l.criado_em)
      }));

    // 2. Leads por origem
    const originCatalog = (leadsSvc && leadsSvc.CATALOGS && leadsSvc.CATALOGS.origins) || [];
    const leadsPorOrigem = originCatalog
      .map((orig) => {
        const subset = leads.filter((l) => l.origem === orig.codigo);
        const conv = subset.filter((l) => l.status === 'concluido').length;
        return {
          codigo: orig.codigo,
          origem: orig.label,
          quantidade: subset.length,
          participacao: formatPct(subset.length, totalLeads),
          matriculas: conv,
          conversao: formatPct(conv, subset.length)
        };
      })
      .filter((row) => row.quantidade > 0)
      .sort((a, b) => b.quantidade - a.quantidade);

    // 3. Leads por status
    const statusCatalog = (leadsSvc && leadsSvc.CATALOGS && leadsSvc.CATALOGS.statuses) || [];
    const leadsPorStatus = statusCatalog.map((st) => {
      const count = leads.filter((l) => l.status === st.codigo).length;
      return {
        codigo: st.codigo,
        status: st.label,
        quantidade: count,
        participacao: formatPct(count, totalLeads)
      };
    });

    // 4. Conversão em matrículas (por etapa escolar)
    const stageCatalog = (leadsSvc && leadsSvc.CATALOGS && leadsSvc.CATALOGS.stages) || [];
    const conversaoMatriculas = stageCatalog
      .map((stg) => {
        const subset = leads.filter((l) => l.etapa_codigo === stg.codigo);
        const emNegociacao = subset.filter((l) =>
          ['em_contato', 'aguardando_retorno', 'visita_agendada'].includes(l.status)
        ).length;
        const enrolled = subset.filter((l) => l.status === 'concluido').length;
        const perdidos = subset.filter((l) => l.status === 'perdido').length;
        return {
          etapa: stg.label,
          totalLeads: subset.length,
          emNegociacao,
          matriculas: enrolled,
          perdidos,
          taxaConversao: formatPct(enrolled, subset.length)
        };
      })
      .filter((r) => r.totalLeads > 0 || r.matriculas > 0);

    // 5. Atendimentos realizados (por canal + listagem resumida)
    const channelCatalog = (atendSvc && atendSvc.CATALOGS && atendSvc.CATALOGS.channels) || [];
    const atendimentosPorCanal = channelCatalog.map((ch) => {
      const subset = atends.filter((a) => a.canal === ch.codigo);
      const concluidos = subset.filter((a) => a.status === 'concluido').length;
      const emAberto = subset.filter((a) => a.status === 'pendente' || a.status === 'em_andamento').length;
      const cancelados = subset.filter((a) => a.status === 'cancelado').length;
      return {
        canal: ch.label,
        total: subset.length,
        concluidos,
        emAberto,
        cancelados,
        taxaConclusao: formatPct(concluidos, subset.length - cancelados)
      };
    });

    // 6. Visitas agendadas e realizadas
    const visitasLista = visitas
      .slice()
      .sort((a, b) => {
        const aKey = `${a.data || a.data_visita || ''} ${a.horario || a.horario_visita || ''}`;
        const bKey = `${b.data || b.data_visita || ''} ${b.horario || b.horario_visita || ''}`;
        return bKey.localeCompare(aKey);
      })
      .map((v) => ({
        id: v.id,
        responsavel: v.nome_responsavel,
        aluno: v.nome_aluno || 'Não informado',
        data: formatDateBr(v.data || v.data_visita),
        horario: v.horario || v.horario_visita || '—',
        responsavelInterno: v.responsavel_interno,
        statusCodigo: v.status,
        status: visitasSvc ? visitasSvc.getStatusLabel(v.status) : v.status
      }));

    // 7. Desempenho por atendente
    const attendantSet = new Set();
    allMembers.forEach((m) => attendantSet.add(m.nome));
    leads.forEach((l) => {
      if (l.atendente && l.atendente !== 'Aguardando atribuição') attendantSet.add(l.atendente);
    });
    atends.forEach((a) => {
      if (a.responsavel_atendimento) attendantSet.add(a.responsavel_atendimento);
    });

    const desempenhoAtendentes = Array.from(attendantSet)
      .map((nome) => {
        const myLeads = leads.filter((l) => matchOwner(l.atendente, nome));
        const myAtends = atends.filter((a) => matchOwner(a.responsavel_atendimento, nome));
        const myVisitas = visitas.filter((v) => matchOwner(v.responsavel_interno, nome));
        const myTarefas = tarefas.filter((t) => matchOwner(t.responsavel_tarefa, nome));
        const myMatriculas = myLeads.filter((l) => l.status === 'concluido').length;
        const myAtendRealizados = myAtends.filter((a) => a.status !== 'cancelado').length;
        const myVisitasRealizadas = myVisitas.filter((v) => v.status === 'realizada').length;
        const myTarefasConcluidas = myTarefas.filter((t) => t.status === 'concluida').length;

        return {
          atendente: nome,
          leads: myLeads.length,
          atendimentos: myAtendRealizados,
          visitasRealizadas: myVisitasRealizadas,
          tarefasConcluidas: myTarefasConcluidas,
          matriculas: myMatriculas,
          conversao: formatPct(myMatriculas, myLeads.length)
        };
      })
      .sort((a, b) => b.matriculas - a.matriculas || b.atendimentos - a.atendimentos);

    // 8. Tarefas concluídas e atrasadas
    const tarefasLista = tarefas
      .slice()
      .sort((a, b) => `${a.data_vencimento} ${a.horario}`.localeCompare(`${b.data_vencimento} ${b.horario}`))
      .map((t) => {
        const overdue =
          tarefasSvc && typeof tarefasSvc.isTaskOverdue === 'function' ? tarefasSvc.isTaskOverdue(t) : false;
        return {
          id: t.id,
          titulo: t.titulo,
          responsavel: t.responsavel_tarefa,
          vencimento: `${formatDateBr(t.data_vencimento)} ${t.horario || ''}`.trim(),
          prioridade: tarefasSvc ? tarefasSvc.getPriorityLabel(t.prioridade) : t.prioridade,
          status: tarefasSvc ? tarefasSvc.getStatusLabel(t.status) : t.status,
          atrasada: overdue ? 'Sim' : 'Não',
          isOverdue: overdue
        };
      });

    return {
      period,
      startDate,
      endDate,
      ownerFilter,
      roleScope,
      summary: {
        totalLeads,
        matriculados,
        leadsPerdidos,
        taxaConversao,
        tempoMedioPrimeiroContatoHoras,
        atendimentosRealizados,
        atendimentosConcluidos,
        visitasAgendadas,
        visitasRealizadas,
        taxaConversaoVisitas,
        visitasTotal: visitas.length,
        tarefasConcluidas,
        tarefasAtrasadas,
        tarefasTotal: tarefas.length
      },
      leadsRecebidos,
      leadsPorOrigem,
      leadsPorStatus,
      conversaoMatriculas,
      atendimentosPorCanal,
      visitasLista,
      desempenhoAtendentes: ownerFilter
        ? desempenhoAtendentes.filter((d) => matchOwner(d.atendente, ownerFilter))
        : desempenhoAtendentes,
      tarefasLista
    };
  }

  function escapeCsvCell(val) {
    const str = String(val ?? '').replace(/\r?\n/g, ' ');
    if (/[;"\n,]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function rowsToCsv(headers, rows) {
    const lines = [
      headers.map(escapeCsvCell).join(';'),
      ...rows.map((row) => row.map(escapeCsvCell).join(';'))
    ];
    return '\uFEFF' + lines.join('\r\n');
  }

  function buildCsvContent(reportKey = 'visao_geral', filters = {}) {
    const snap = buildReportsSnapshot(filters);

    switch (reportKey) {
      case 'leads_recebidos':
        return rowsToCsv(
          ['ID', 'Responsavel', 'Aluno', 'Etapa', 'Origem', 'Atendente', 'Status', 'Data'],
          snap.leadsRecebidos.map((r) => [r.id, r.responsavel, r.aluno, r.etapa, r.origem, r.atendente, r.status, r.data])
        );

      case 'leads_origem':
        return rowsToCsv(
          ['Origem', 'Quantidade', 'Participacao', 'Matriculas', 'Taxa de Conversao'],
          snap.leadsPorOrigem.map((r) => [r.origem, r.quantidade, r.participacao, r.matriculas, r.conversao])
        );

      case 'leads_status':
        return rowsToCsv(
          ['Status', 'Quantidade', 'Participacao'],
          snap.leadsPorStatus.map((r) => [r.status, r.quantidade, r.participacao])
        );

      case 'conversao_matriculas':
        return rowsToCsv(
          ['Etapa Escolar', 'Total de Leads', 'Em Negociacao', 'Matriculas', 'Perdidos', 'Taxa de Conversao'],
          snap.conversaoMatriculas.map((r) => [r.etapa, r.totalLeads, r.emNegociacao, r.matriculas, r.perdidos, r.taxaConversao])
        );

      case 'atendimentos_realizados':
        return rowsToCsv(
          ['Canal', 'Total', 'Concluidos', 'Em Aberto', 'Cancelados', 'Taxa de Conclusao'],
          snap.atendimentosPorCanal.map((r) => [r.canal, r.total, r.concluidos, r.emAberto, r.cancelados, r.taxaConclusao])
        );

      case 'visitas':
        return rowsToCsv(
          ['ID', 'Responsavel', 'Aluno', 'Data', 'Horario', 'Responsavel Interno', 'Status'],
          snap.visitasLista.map((r) => [r.id, r.responsavel, r.aluno, r.data, r.horario, r.responsavelInterno, r.status])
        );

      case 'desempenho_atendente':
        return rowsToCsv(
          ['Atendente', 'Leads', 'Atendimentos', 'Visitas Realizadas', 'Tarefas Concluidas', 'Matriculas', 'Conversao'],
          snap.desempenhoAtendentes.map((r) => [
            r.atendente,
            r.leads,
            r.atendimentos,
            r.visitasRealizadas,
            r.tarefasConcluidas,
            r.matriculas,
            r.conversao
          ])
        );

      case 'tarefas':
        return rowsToCsv(
          ['ID', 'Titulo', 'Responsavel', 'Vencimento', 'Prioridade', 'Status', 'Atrasada'],
          snap.tarefasLista.map((r) => [r.id, r.titulo, r.responsavel, r.vencimento, r.prioridade, r.status, r.atrasada])
        );

      case 'visao_geral':
      default: {
        const isAtendente = snap.roleScope === 'atendente';
        const blocks = [
          isAtendente
            ? `RESUMO DE DESEMPENHO INDIVIDUAL — ${snap.ownerFilter || 'ATENDENTE'} (DADOS DEMONSTRATIVOS)`
            : 'RESUMO CONSOLIDADO ENSINA AI (DADOS DEMONSTRATIVOS)',
          rowsToCsv(
            ['Indicador', 'Valor'],
            [
              ['Leads recebidos', snap.summary.totalLeads],
              ['Matriculas realizadas', snap.summary.matriculados],
              ['Leads perdidos', snap.summary.leadsPerdidos],
              ['Taxa de conversao', snap.summary.taxaConversao],
              ['Atendimentos realizados', snap.summary.atendimentosRealizados],
              ['Visitas agendadas', snap.summary.visitasAgendadas],
              ['Visitas realizadas', snap.summary.visitasRealizadas],
              ['Tarefas concluidas', snap.summary.tarefasConcluidas],
              ['Tarefas atrasadas', snap.summary.tarefasAtrasadas]
            ]
          ).replace(/^\uFEFF/, ''),
          '',
          ...(isAtendente
            ? []
            : [
                'DESEMPENHO POR ATENDENTE',
                rowsToCsv(
                  ['Atendente', 'Leads', 'Atendimentos', 'Visitas Realizadas', 'Tarefas Concluidas', 'Matriculas', 'Conversao'],
                  snap.desempenhoAtendentes.map((r) => [
                    r.atendente,
                    r.leads,
                    r.atendimentos,
                    r.visitasRealizadas,
                    r.tarefasConcluidas,
                    r.matriculas,
                    r.conversao
                  ])
                ).replace(/^\uFEFF/, ''),
                ''
              ]),
          'CONVERSAO POR ORIGEM',
          rowsToCsv(
            ['Origem', 'Quantidade', 'Participacao', 'Matriculas', 'Taxa de Conversao'],
            snap.leadsPorOrigem.map((r) => [r.origem, r.quantidade, r.participacao, r.matriculas, r.conversao])
          ).replace(/^\uFEFF/, '')
        ];
        return '\uFEFF' + blocks.join('\r\n');
      }
    }
  }

  function downloadCsv(reportKey = 'visao_geral', filters = {}) {
    const csvText = buildCsvContent(reportKey, filters);
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `ensina-ai-relatorio-${reportKey}-${dateStamp}.csv`;

    if (
      globalScope.document &&
      typeof globalScope.Blob === 'function' &&
      globalScope.URL &&
      typeof globalScope.URL.createObjectURL === 'function'
    ) {
      const blob = new globalScope.Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = globalScope.URL.createObjectURL(blob);
      const link = globalScope.document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      link.style.display = 'none';
      globalScope.document.body.appendChild(link);
      link.click();
      globalScope.document.body.removeChild(link);
      globalScope.setTimeout(() => {
        if (typeof globalScope.URL.revokeObjectURL === 'function') {
          globalScope.URL.revokeObjectURL(url);
        }
      }, 250);
    }

    return { filename, csvText };
  }

  globalScope.EnsinaAiRelatoriosService = Object.freeze({
    PERIOD_OPTIONS,
    REPORT_TABS,
    buildReportsSnapshot,
    buildCsvContent,
    downloadCsv
  });
})(window);
