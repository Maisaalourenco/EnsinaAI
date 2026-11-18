/**
 * ENSINA AÍ — CRM Escolar
 * Módulo do Dashboard Gerencial (js/crm/dashboard.js)
 * Consolida indicadores operacionais e séries históricas demonstrativas em front-end
 * a partir dos serviços locais (Leads, Atendimentos, Tarefas, Visitas e Equipe).
 * Sem integração com banco de dados real ou frameworks externos de gráficos.
 */

(function initCrmDashboardModule(globalScope) {
  'use strict';

  const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  // Série histórica fictícia de 12 meses para demonstrar evolução temporal (meses anteriores + mês atual ao vivo)
  const HISTORICAL_BASELINE = Object.freeze([
    { leads: 14, atendimentos: 11, matriculas: 3 },
    { leads: 16, atendimentos: 13, matriculas: 4 },
    { leads: 19, atendimentos: 15, matriculas: 4 },
    { leads: 17, atendimentos: 14, matriculas: 5 },
    { leads: 21, atendimentos: 18, matriculas: 5 },
    { leads: 24, atendimentos: 20, matriculas: 6 },
    { leads: 22, atendimentos: 19, matriculas: 5 },
    { leads: 26, atendimentos: 22, matriculas: 6 },
    { leads: 29, atendimentos: 25, matriculas: 7 },
    { leads: 27, atendimentos: 24, matriculas: 6 },
    { leads: 31, atendimentos: 27, matriculas: 8 },
    { leads: 0, atendimentos: 0, matriculas: 0 } // Mês atual é preenchido ao vivo com os dados locais
  ]);

  const STATUS_COLORS = Object.freeze({
    novo: '#1D4ED8',
    em_contato: '#0EA5E9',
    aguardando_retorno: '#F59E0B',
    visita_agendada: '#6366F1',
    concluido: '#10B981',
    perdido: '#EF4444'
  });

  const ORIGIN_COLORS = Object.freeze({
    site: '#1E3A8A',
    whatsapp: '#10B981',
    instagram: '#0EA5E9',
    facebook: '#3B82F6',
    indicacao: '#8B5CF6',
    telefone: '#F59E0B',
    visita_presencial: '#0F766E',
    outros: '#64748B'
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

  function formatPct(num, den) {
    if (!den || den <= 0) return '0,0%';
    return `${((num / den) * 100).toFixed(1).replace('.', ',')}%`;
  }

  function formatDateBr(dateInput) {
    if (!dateInput) return '—';
    if (/^\d{4}-\d{2}-\d{2}$/.test(String(dateInput))) {
      const parts = String(dateInput).split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateInput);
    if (Number.isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  function formatRelativeOrDate(isoString) {
    if (!isoString) return 'Agora';
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return 'Recente';
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'Agora';
    if (diffMin < 60) return `Há ${diffMin} min`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `Há ${diffHours}h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    return formatDateBr(isoString);
  }

  function matchesOwner(recordOwner, filterOwner) {
    if (!filterOwner || filterOwner === 'todos') return true;
    const eqSvc = globalScope.EnsinaAiEquipeService;
    if (eqSvc && typeof eqSvc.matchOwnerName === 'function') {
      return eqSvc.matchOwnerName(recordOwner, filterOwner);
    }
    return String(recordOwner || '').trim().toLowerCase() === String(filterOwner).trim().toLowerCase();
  }

  function formatDateInputFromDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function collectManagerialSnapshot(options = {}) {
    const session = options.session || { role: 'gestor', name: 'Coordenação Demo', roleLabel: 'Gestor Escolar' };
    const isAtendente = session.role === 'atendente';
    const ownerFilter = isAtendente ? session.name : options.ownerFilter || 'todos';
    const monthsCount = [3, 6, 12].includes(options.monthsCount) ? options.monthsCount : 6;
    const isEmpty = Boolean(options.isEmpty);

    const leadsSvc = globalScope.EnsinaAiLeadsService || null;
    const atendSvc = globalScope.EnsinaAiAtendimentosService || null;
    const tarefasSvc = globalScope.EnsinaAiTarefasService || null;
    const visitasSvc = globalScope.EnsinaAiVisitasService || null;
    const equipeSvc = globalScope.EnsinaAiEquipeService || null;

    const rawLeads =
      !isEmpty && leadsSvc && typeof leadsSvc.listLeads === 'function'
        ? leadsSvc.listLeads({ page: 1, pageSize: 1000 }).items || []
        : [];
    const rawAtends =
      !isEmpty && atendSvc && typeof atendSvc.listAtendimentos === 'function'
        ? atendSvc.listAtendimentos({ page: 1, pageSize: 1000 }).items || []
        : [];
    const rawTarefas =
      !isEmpty && tarefasSvc && typeof tarefasSvc.listTarefas === 'function'
        ? tarefasSvc.listTarefas({ page: 1, pageSize: 1000 }).items || []
        : [];
    const rawVisitas =
      !isEmpty && visitasSvc && typeof visitasSvc.listVisitas === 'function'
        ? visitasSvc.listVisitas({ page: 1, pageSize: 1000 }).items || []
        : [];
    const rawMembers =
      equipeSvc && typeof equipeSvc.listMembers === 'function'
        ? equipeSvc.listMembers({}).items || []
        : [];

    const leads = rawLeads.filter((l) => matchesOwner(l.atendente, ownerFilter));
    const atends = rawAtends.filter((a) => matchesOwner(a.responsavel_atendimento, ownerFilter));
    const tarefas = rawTarefas.filter((t) => matchesOwner(t.responsavel_tarefa, ownerFilter));
    const visitas = rawVisitas.filter((v) => matchesOwner(v.responsavel_interno, ownerFilter));

    const todayStr = formatDateInputFromDate(new Date());

    // Indicadores principais
    const totalLeads = leads.length;
    const leadsNovos = leads.filter((l) => l.status === 'novo').length;
    const leadsEmAtendimento = leads.filter((l) =>
      ['em_contato', 'aguardando_retorno', 'visita_agendada'].includes(l.status)
    ).length;
    const leadsAguardandoRetorno = leads.filter((l) => l.status === 'aguardando_retorno').length;
    const leadsPerdidos = leads.filter((l) => l.status === 'perdido').length;
    const leadsSemResponsavel = rawLeads.filter(
      (l) => !l.atendente || l.atendente === 'Aguardando atribuição'
    );
    const matriculasRealizadas = leads.filter((l) => l.status === 'concluido').length;
    const taxaConversao = formatPct(matriculasRealizadas, totalLeads);

    const atendimentosRealizados = atends.filter((a) => a.status !== 'cancelado').length;
    const atendimentosConcluidos = atends.filter((a) => a.status === 'concluido').length;
    const atendimentosHoje = atends.filter((a) => {
      if (!a.data_hora || a.status === 'cancelado') return false;
      const d = new Date(a.data_hora);
      return !Number.isNaN(d.getTime()) && formatDateInputFromDate(d) === todayStr;
    }).length;
    const visitasAgendadas = visitas.filter(
      (v) => v.status === 'agendada' || v.status === 'confirmada'
    ).length;
    const visitasRealizadas = visitas.filter((v) => v.status === 'realizada').length;
    const visitasHoje = visitas.filter((v) =>
      visitasSvc && typeof visitasSvc.isVisitToday === 'function' ? visitasSvc.isVisitToday(v) : false
    ).length;
    const tarefasPendentes = tarefas.filter(
      (t) => t.status === 'pendente' || t.status === 'em_andamento'
    ).length;
    const tarefasAtrasadasListRaw = tarefas.filter((t) =>
      tarefasSvc && typeof tarefasSvc.isTaskOverdue === 'function' ? tarefasSvc.isTaskOverdue(t) : false
    );
    const tarefasAtrasadas = tarefasAtrasadasListRaw.length;

    const kpis = isAtendente
      ? [
          {
            id: 'dash-kpi-total-leads',
            label: 'Meus leads',
            value: totalLeads,
            foot: isEmpty ? 'Sem dados no estado vazio' : `Carteira de ${session.name}`,
            footTone: '',
            accent: 'navy'
          },
          {
            id: 'dash-kpi-leads-novos',
            label: 'Novos leads recebidos',
            value: leadsNovos,
            foot: isEmpty ? 'Sem dados no estado vazio' : 'Aguardando 1º contato',
            footTone: leadsNovos > 0 ? 'is-warning' : '',
            accent: 'blue'
          },
          {
            id: 'dash-kpi-leads-atendimento',
            label: 'Leads em atendimento',
            value: leadsEmAtendimento,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${leadsAguardandoRetorno} aguardando retorno`,
            footTone: leadsAguardandoRetorno > 0 ? 'is-warning' : '',
            accent: 'sky'
          },
          {
            id: 'dash-kpi-atendimentos',
            label: 'Atendimentos hoje',
            value: atendimentosHoje,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${atendimentosRealizados} no total (${atendimentosConcluidos} concl.)`,
            footTone: '',
            accent: 'sky'
          },
          {
            id: 'dash-kpi-tarefas',
            label: 'Minhas tarefas pendentes',
            value: tarefasPendentes,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${tarefasAtrasadas} atrasada(s)`,
            footTone: tarefasAtrasadas > 0 ? 'is-warning' : '',
            accent: tarefasAtrasadas > 0 ? 'red' : 'amber'
          },
          {
            id: 'dash-kpi-visitas',
            label: 'Minhas visitas agendadas',
            value: visitasAgendadas,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${visitasHoje} para hoje`,
            footTone: '',
            accent: 'amber'
          },
          {
            id: 'dash-kpi-matriculas',
            label: 'Minhas matrículas',
            value: matriculasRealizadas,
            foot: isEmpty ? 'Sem dados no estado vazio' : `Conversão: ${taxaConversao}`,
            footTone: matriculasRealizadas > 0 ? 'is-positive' : '',
            accent: 'green'
          },
          {
            id: 'dash-kpi-conversao',
            label: 'Minha conversão',
            value: taxaConversao,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${matriculasRealizadas} de ${totalLeads} leads`,
            footTone: matriculasRealizadas > 0 ? 'is-positive' : '',
            accent: 'green'
          }
        ]
      : [
          {
            id: 'dash-kpi-total-leads',
            label: 'Total de leads',
            value: totalLeads,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${ownerFilter === 'todos' ? 'Toda a escola' : ownerFilter}`,
            footTone: '',
            accent: 'navy'
          },
          {
            id: 'dash-kpi-leads-novos',
            label: 'Leads novos',
            value: leadsNovos,
            foot: isEmpty ? 'Sem dados no estado vazio' : 'Aguardando 1º contato',
            footTone: leadsNovos > 0 ? 'is-warning' : '',
            accent: 'blue'
          },
          {
            id: 'dash-kpi-leads-atendimento',
            label: 'Leads em atendimento',
            value: leadsEmAtendimento,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${leadsAguardandoRetorno} aguardando retorno`,
            footTone: '',
            accent: 'sky'
          },
          {
            id: 'dash-kpi-matriculas',
            label: 'Matrículas realizadas',
            value: matriculasRealizadas,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${leadsPerdidos} perdido(s)`,
            footTone: matriculasRealizadas > 0 ? 'is-positive' : '',
            accent: 'green'
          },
          {
            id: 'dash-kpi-conversao',
            label: 'Taxa de conversão',
            value: taxaConversao,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${matriculasRealizadas} de ${totalLeads} leads`,
            footTone: matriculasRealizadas > 0 ? 'is-positive' : '',
            accent: 'green'
          },
          {
            id: 'dash-kpi-atendimentos',
            label: 'Atendimentos realizados',
            value: atendimentosRealizados,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${atendimentosConcluidos} concluídos (${atendimentosHoje} hoje)`,
            footTone: '',
            accent: 'sky'
          },
          {
            id: 'dash-kpi-visitas',
            label: 'Visitas agendadas',
            value: visitasAgendadas,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${visitasHoje} hoje • ${visitasRealizadas} realizadas`,
            footTone: '',
            accent: 'amber'
          },
          {
            id: 'dash-kpi-tarefas',
            label: 'Tarefas pendentes',
            value: tarefasPendentes,
            foot: isEmpty ? 'Sem dados no estado vazio' : `${tarefasAtrasadas} atrasada(s) • ${leadsSemResponsavel.length} sem resp.`,
            footTone: tarefasAtrasadas > 0 || leadsSemResponsavel.length > 0 ? 'is-warning' : '',
            accent: tarefasAtrasadas > 0 ? 'red' : 'amber'
          }
        ];

    // 2. Série Mensal (Evolução de Leads + Matrículas por período)
    const ownerScale =
      ownerFilter === 'todos'
        ? 1
        : Math.max(0.2, rawLeads.length ? totalLeads / rawLeads.length : 0.35);

    const now = new Date();
    const full12Months = HISTORICAL_BASELINE.map((base, index) => {
      const offset = index - 11; // -11 .. 0
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const label = MONTH_NAMES[d.getMonth()];
      if (index === 11) {
        return {
          month: label,
          leads: totalLeads,
          atendimentos: atendimentosRealizados,
          matriculas: matriculasRealizadas,
          isCurrent: true
        };
      }
      return {
        month: label,
        leads: Math.max(1, Math.round(base.leads * ownerScale)),
        atendimentos: Math.max(1, Math.round(base.atendimentos * ownerScale)),
        matriculas: Math.max(0, Math.round(base.matriculas * ownerScale)),
        isCurrent: false
      };
    });
    const monthlySeries = isEmpty ? [] : full12Months.slice(-monthsCount);

    // 3. Conversão por Origem
    const originCatalog =
      leadsSvc && leadsSvc.CATALOGS && Array.isArray(leadsSvc.CATALOGS.origins)
        ? leadsSvc.CATALOGS.origins
        : [];
    const originsStats = isEmpty
      ? []
      : originCatalog
          .map((orig) => {
            const matching = leads.filter((l) => l.origem === orig.codigo);
            const enrolled = matching.filter((l) => l.status === 'concluido').length;
            const total = matching.length;
            const rate = total > 0 ? (enrolled / total) * 100 : 0;
            return {
              codigo: orig.codigo,
              label: orig.label,
              total,
              matriculas: enrolled,
              rate,
              rateLabel: `${rate.toFixed(0)}%`,
              color: ORIGIN_COLORS[orig.codigo] || '#64748B'
            };
          })
          .filter((item) => item.total > 0)
          .sort((a, b) => b.total - a.total || b.rate - a.rate);

    // 4. Distribuição por Status
    const statusCatalog =
      leadsSvc && leadsSvc.CATALOGS && Array.isArray(leadsSvc.CATALOGS.statuses)
        ? leadsSvc.CATALOGS.statuses
        : [];
    const statusDistribution = isEmpty
      ? []
      : statusCatalog
          .map((st) => ({
            codigo: st.codigo,
            label: st.label,
            count: leads.filter((l) => l.status === st.codigo).length,
            color: STATUS_COLORS[st.codigo] || '#64748B'
          }))
          .filter((item) => item.count > 0);

    // 5. Atendimentos por Atendente
    const attendantNamesSet = new Set();
    rawMembers.forEach((m) => attendantNamesSet.add(m.nome));
    atends.forEach((a) => {
      if (a.responsavel_atendimento) attendantNamesSet.add(a.responsavel_atendimento);
    });
    const attendantStats = isEmpty
      ? []
      : Array.from(attendantNamesSet)
          .filter((name) => ownerFilter === 'todos' || matchesOwner(name, ownerFilter))
          .map((name) => {
            const myAtends = atends.filter((a) => matchesOwner(a.responsavel_atendimento, name));
            const total = myAtends.filter((a) => a.status !== 'cancelado').length;
            const concluidos = myAtends.filter((a) => a.status === 'concluido').length;
            const myLeads = leads.filter((l) => matchesOwner(l.atendente, name));
            const matriculas = myLeads.filter((l) => l.status === 'concluido').length;
            return {
              name,
              total,
              concluidos,
              matriculas
            };
          })
          .filter((row) => row.total > 0 || row.matriculas > 0 || ownerFilter !== 'todos')
          .sort((a, b) => b.total - a.total || b.concluidos - a.concluidos);

    // 6. Funil de Conversão (5 etapas exatas)
    const stage5 = matriculasRealizadas;
    const stage4Leads = leads.filter((l) => l.status === 'visita_agendada' || l.status === 'concluido').length;
    const activeOrDoneVisits = visitas.filter((v) => v.status !== 'cancelada').length;
    const stage4 = Math.max(stage5, Math.min(totalLeads, Math.max(stage4Leads, activeOrDoneVisits)));
    const stage3Raw = leads.filter((l) =>
      ['em_contato', 'aguardando_retorno', 'visita_agendada', 'concluido'].includes(l.status)
    ).length;
    const stage3 = Math.max(stage4, stage3Raw);
    const stage2Raw = leads.filter((l) => l.status !== 'novo').length;
    const stage2 = Math.max(stage3, Math.min(totalLeads, Math.max(stage2Raw, Math.min(totalLeads, atends.length))));
    const stage1 = Math.max(stage2, totalLeads);

    const funnel = isEmpty
      ? []
      : [
          { stage: 'Lead recebido', count: stage1, color: '#1E3A8A' },
          { stage: 'Primeiro contato', count: stage2, color: '#0369A1' },
          { stage: 'Em negociação', count: stage3, color: '#0EA5E9' },
          { stage: 'Visita agendada', count: stage4, color: '#F59E0B' },
          { stage: 'Matrícula realizada', count: stage5, color: '#10B981' }
        ];

    // 7. Atividades Recentes (5 categorias)
    const novosLeadsList = isEmpty
      ? []
      : leads
          .slice()
          .sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime())
          .slice(0, 4)
          .map((l) => ({
            id: l.id,
            route: 'leads',
            search: l.id,
            title: l.nome_responsavel,
            desc: `${l.nome_aluno || 'Aluno não informado'} • ${leadsSvc ? leadsSvc.getStageLabel(l.etapa_codigo) : l.etapa_codigo} (${leadsSvc ? leadsSvc.getOriginLabel(l.origem) : l.origem})`,
            time: formatRelativeOrDate(l.criado_em),
            dot: 'blue'
          }));

    const atendimentosRecentesList = isEmpty
      ? []
      : atends
          .slice()
          .sort((a, b) => new Date(b.ultima_atualizacao || b.data_hora).getTime() - new Date(a.ultima_atualizacao || a.data_hora).getTime())
          .slice(0, 4)
          .map((a) => ({
            id: a.id,
            route: 'atendimentos',
            search: a.id,
            title: `${a.nome_responsavel} (${atendSvc ? atendSvc.getChannelLabel(a.canal) : a.canal})`,
            desc: `${a.responsavel_atendimento} • ${atendSvc ? atendSvc.getStatusLabel(a.status) : a.status}`,
            time: formatRelativeOrDate(a.ultima_atualizacao || a.data_hora),
            dot: 'sky'
          }));

    const visitasProximasList = isEmpty
      ? []
      : visitas
          .filter((v) => v.status === 'agendada' || v.status === 'confirmada')
          .slice()
          .sort((a, b) => {
            const aKey = `${a.data || a.data_visita || ''} ${a.horario || a.horario_visita || ''}`;
            const bKey = `${b.data || b.data_visita || ''} ${b.horario || b.horario_visita || ''}`;
            return aKey.localeCompare(bKey);
          })
          .slice(0, 4)
          .map((v) => ({
            id: v.id,
            route: 'visitas',
            search: v.id,
            title: `${v.nome_responsavel} — ${v.nome_aluno || 'Visita escolar'}`,
            desc: `${v.responsavel_interno} • ${visitasSvc ? visitasSvc.getStatusLabel(v.status) : v.status}`,
            time: `${formatDateBr(v.data || v.data_visita)} ${v.horario || v.horario_visita || ''}`.trim(),
            dot: 'amber'
          }));

    const tarefasPendentesList = isEmpty
      ? []
      : tarefas
          .filter((t) => t.status === 'pendente' || t.status === 'em_andamento')
          .slice()
          .sort((a, b) => `${a.data_vencimento} ${a.horario}`.localeCompare(`${b.data_vencimento} ${b.horario}`))
          .slice(0, 4)
          .map((t) => ({
            id: t.id,
            route: 'tarefas',
            search: t.id,
            title: t.titulo,
            desc: `${t.responsavel_tarefa} • Prioridade ${tarefasSvc ? tarefasSvc.getPriorityLabel(t.prioridade) : t.prioridade}`,
            time: `${formatDateBr(t.data_vencimento)} ${t.horario || ''}`.trim(),
            dot: tarefasSvc && tarefasSvc.isTaskOverdue(t) ? 'red' : 'amber'
          }));

    const matriculasRecentesList = isEmpty
      ? []
      : leads
          .filter((l) => l.status === 'concluido')
          .slice()
          .sort((a, b) => new Date(b.atualizado_em || b.criado_em).getTime() - new Date(a.atualizado_em || a.criado_em).getTime())
          .slice(0, 4)
          .map((l) => ({
            id: l.id,
            route: 'leads',
            search: l.id,
            title: `${l.nome_aluno || l.nome_responsavel}`,
            desc: `Resp.: ${l.nome_responsavel} • ${l.atendente}`,
            time: formatRelativeOrDate(l.atualizado_em || l.criado_em),
            dot: 'green'
          }));

    // 8. Listas Operacionais do Atendente (Agenda do dia, Próximos retornos, Tarefas atrasadas)
    const agendaDoDia = isEmpty
      ? []
      : [
          ...visitas
            .filter(
              (v) =>
                (v.data || v.data_visita) === todayStr &&
                (v.status === 'agendada' || v.status === 'confirmada')
            )
            .map((v) => ({
              id: v.id,
              route: 'visitas',
              search: v.id,
              title: `Visita: ${v.nome_responsavel}`,
              desc: `${v.nome_aluno || 'Visita ao campus'} • ${visitasSvc ? visitasSvc.getStatusLabel(v.status) : v.status}`,
              time: `Hoje ${v.horario || v.horario_visita || '10:00'}`,
              dot: 'amber'
            })),
          ...tarefas
            .filter(
              (t) =>
                t.data_vencimento === todayStr &&
                t.status !== 'concluida' &&
                t.status !== 'cancelada'
            )
            .map((t) => ({
              id: t.id,
              route: 'tarefas',
              search: t.id,
              title: `Tarefa: ${t.titulo}`,
              desc: `${t.nome_responsavel || 'Sem lead vinculado'} • ${tarefasSvc ? tarefasSvc.getPriorityLabel(t.prioridade) : t.prioridade}`,
              time: `Hoje ${t.horario || '10:00'}`,
              dot: 'sky'
            }))
        ].sort((a, b) => a.time.localeCompare(b.time));

    const proximosRetornos = isEmpty
      ? []
      : atends
          .filter((a) => a.status !== 'concluido' && a.status !== 'cancelado' && a.data_retorno)
          .slice()
          .sort((a, b) => new Date(a.data_retorno).getTime() - new Date(b.data_retorno).getTime())
          .slice(0, 5)
          .map((a) => {
            const overdue =
              atendSvc && typeof atendSvc.isReturnOverdue === 'function'
                ? atendSvc.isReturnOverdue(a)
                : false;
            return {
              id: a.id,
              route: 'atendimentos',
              search: a.id,
              title: `${a.nome_responsavel}${overdue ? ' (Atrasado)' : ''}`,
              desc: `${a.proxima_acao || 'Retorno programado'} • ${atendSvc ? atendSvc.getChannelLabel(a.canal) : a.canal}`,
              time: formatDateBr(a.data_retorno),
              dot: overdue ? 'red' : 'amber'
            };
          });

    const tarefasAtrasadasLista = isEmpty
      ? []
      : tarefasAtrasadasListRaw
          .slice()
          .sort((a, b) => `${a.data_vencimento} ${a.horario}`.localeCompare(`${b.data_vencimento} ${b.horario}`))
          .slice(0, 5)
          .map((t) => ({
            id: t.id,
            route: 'tarefas',
            search: t.id,
            title: t.titulo,
            desc: `${t.nome_responsavel || 'Tarefa interna'} • Prioridade ${tarefasSvc ? tarefasSvc.getPriorityLabel(t.prioridade) : t.prioridade}`,
            time: `Venceu ${formatDateBr(t.data_vencimento)}`,
            dot: 'red'
          }));

    // 9. Painel de Atenção Gerencial (Gestor Escolar)
    const leadsSemResponsavelLista = isEmpty
      ? []
      : leadsSemResponsavel.slice(0, 5).map((l) => ({
          id: l.id,
          route: 'leads',
          search: l.id,
          title: l.nome_responsavel,
          desc: `${l.nome_aluno || 'Aluno não informado'} • ${leadsSvc ? leadsSvc.getOriginLabel(l.origem) : l.origem}`,
          time: formatRelativeOrDate(l.criado_em),
          dot: 'red'
        }));

    const leadIdsWithAttendance = new Set(rawAtends.map((a) => a.lead_id));
    const leadsSemAtendimentoLista = isEmpty
      ? []
      : rawLeads
          .filter((l) => l.status !== 'concluido' && l.status !== 'perdido' && !leadIdsWithAttendance.has(l.id))
          .slice(0, 5)
          .map((l) => ({
            id: l.id,
            route: 'leads',
            search: l.id,
            title: l.nome_responsavel,
            desc: `${l.atendente || 'Aguardando atribuição'} • ${leadsSvc ? leadsSvc.getStatusLabel(l.status) : l.status}`,
            time: formatRelativeOrDate(l.criado_em),
            dot: 'amber'
          }));

    const agendaGeralVisitasLista = isEmpty
      ? []
      : rawVisitas
          .filter((v) => v.status === 'agendada' || v.status === 'confirmada')
          .slice()
          .sort((a, b) => {
            const aKey = `${a.data || a.data_visita || ''} ${a.horario || a.horario_visita || ''}`;
            const bKey = `${b.data || b.data_visita || ''} ${b.horario || b.horario_visita || ''}`;
            return aKey.localeCompare(bKey);
          })
          .slice(0, 5)
          .map((v) => ({
            id: v.id,
            route: 'visitas',
            search: v.id,
            title: `${v.nome_responsavel} (${v.nome_aluno || 'Campus'})`,
            desc: `Resp.: ${v.responsavel_interno} • ${visitasSvc ? visitasSvc.getStatusLabel(v.status) : v.status}`,
            time: `${formatDateBr(v.data || v.data_visita)} ${v.horario || v.horario_visita || ''}`.trim(),
            dot: (v.data || v.data_visita) === todayStr ? 'green' : 'sky'
          }));

    const ownerOptions = Array.from(
      new Set([
        ...rawMembers.map((m) => m.nome),
        ...(leadsSvc && leadsSvc.CATALOGS ? leadsSvc.CATALOGS.attendants.filter((n) => n !== 'Aguardando atribuição') : [])
      ])
    );

    return {
      isEmpty,
      isAtendente,
      monthsCount,
      ownerFilter,
      ownerOptions,
      kpis,
      monthlySeries,
      originsStats,
      statusDistribution,
      attendantStats,
      funnel,
      operational: {
        agendaDoDia,
        proximosRetornos,
        tarefasAtrasadas: tarefasAtrasadasLista
      },
      managerialAlerts: {
        semResponsavel: leadsSemResponsavelLista,
        semAtendimento: leadsSemAtendimentoLista,
        agendaGeralVisitas: agendaGeralVisitasLista
      },
      activities: {
        novosLeads: novosLeadsList,
        atendimentosRecentes: atendimentosRecentesList,
        visitasProximas: visitasProximasList,
        tarefasPendentes: tarefasPendentesList,
        matriculasRecentes: matriculasRecentesList
      }
    };
  }

  function buildEvolutionChartSvg(series) {
    const width = 560;
    const height = 228;
    const padLeft = 36;
    const padRight = 16;
    const padTop = 20;
    const padBottom = 34;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const maxVal = Math.max(
      12,
      ...series.map((item) => Math.max(item.leads, item.atendimentos))
    );
    const yMax = Math.ceil(maxVal / 5) * 5;
    const stepX = chartW / Math.max(1, series.length);

    const gridLines = [0, 0.25, 0.5, 0.75, 1]
      .map((ratio) => {
        const y = padTop + chartH - ratio * chartH;
        const val = Math.round(ratio * yMax);
        return `
          <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3 3" />
          <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="#64748B">${val}</text>
        `;
      })
      .join('');

    const bars = series
      .map((item, idx) => {
        const barW = Math.min(18, Math.max(8, stepX * 0.24));
        const gap = Math.min(5, stepX * 0.08);
        const totalPairW = barW * 2 + gap;
        const groupX = padLeft + idx * stepX + (stepX - totalPairW) / 2;

        const leadsH = (item.leads / yMax) * chartH;
        const leadsY = padTop + chartH - leadsH;

        const atendH = (item.atendimentos / yMax) * chartH;
        const atendY = padTop + chartH - atendH;

        const labelX = padLeft + idx * stepX + stepX / 2;

        return `
          <g>
            <rect x="${groupX}" y="${leadsY}" width="${barW}" height="${leadsH}" rx="3" fill="#1E3A8A">
              <title>${escapeHtml(item.month)}: ${item.leads} leads</title>
            </rect>
            <text x="${groupX + barW / 2}" y="${Math.max(11, leadsY - 4)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#1E3A8A">${item.leads}</text>

            <rect x="${groupX + barW + gap}" y="${atendY}" width="${barW}" height="${atendH}" rx="3" fill="#0EA5E9">
              <title>${escapeHtml(item.month)}: ${item.atendimentos} atendimentos</title>
            </rect>
            <text x="${groupX + barW + gap + barW / 2}" y="${Math.max(11, atendY - 4)}" text-anchor="middle" font-size="9.5" font-weight="700" fill="#0369A1">${item.atendimentos}</text>

            <text x="${labelX}" y="${height - 10}" text-anchor="middle" font-size="10.5" font-weight="${item.isCurrent ? '800' : '600'}" fill="${item.isCurrent ? '#1E3A8A' : '#475569'}">${escapeHtml(item.month)}</text>
          </g>
        `;
      })
      .join('');

    return `
      <svg
        class="crm-evolution-svg"
        viewBox="0 0 ${width} ${height}"
        role="img"
        aria-label="Gráfico de evolução de leads e atendimentos"
      >
        ${gridLines}
        <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" stroke="#CBD5E1" />
        ${bars}
      </svg>
    `;
  }

  function buildEnrollmentsPeriodSvg(series) {
    const width = 560;
    const height = 228;
    const padLeft = 36;
    const padRight = 18;
    const padTop = 22;
    const padBottom = 34;
    const chartW = width - padLeft - padRight;
    const chartH = height - padTop - padBottom;

    const maxVal = Math.max(8, ...series.map((s) => s.matriculas));
    const yMax = Math.ceil(maxVal / 4) * 4;
    const stepX = chartW / Math.max(1, series.length);

    const gridLines = [0, 0.25, 0.5, 0.75, 1]
      .map((ratio) => {
        const y = padTop + chartH - ratio * chartH;
        const val = Math.round(ratio * yMax);
        return `
          <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#E2E8F0" stroke-dasharray="3 3" />
          <text x="${padLeft - 8}" y="${y + 4}" text-anchor="end" font-size="10.5" fill="#64748B">${val}</text>
        `;
      })
      .join('');

    const points = series.map((item, idx) => {
      const cx = padLeft + idx * stepX + stepX / 2;
      const cy = padTop + chartH - (item.matriculas / yMax) * chartH;
      return { cx, cy, ...item };
    });

    const polylinePoints = points.map((p) => `${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ');
    const areaPoints = points.length
      ? `${points[0].cx.toFixed(1)},${padTop + chartH} ${polylinePoints} ${points[points.length - 1].cx.toFixed(1)},${padTop + chartH}`
      : '';

    const barsAndDots = points
      .map((p) => {
        const barW = Math.min(26, Math.max(12, stepX * 0.34));
        const barH = (p.matriculas / yMax) * chartH;
        return `
          <g>
            <rect x="${p.cx - barW / 2}" y="${p.cy}" width="${barW}" height="${barH}" rx="4" fill="#10B981" fill-opacity="0.22" />
            <circle cx="${p.cx}" cy="${p.cy}" r="4.5" fill="#047857" stroke="#FFFFFF" stroke-width="2">
              <title>${escapeHtml(p.month)}: ${p.matriculas} matrículas</title>
            </circle>
            <text x="${p.cx}" y="${Math.max(12, p.cy - 9)}" text-anchor="middle" font-size="10" font-weight="800" fill="#047857">${p.matriculas}</text>
            <text x="${p.cx}" y="${height - 10}" text-anchor="middle" font-size="10.5" font-weight="${p.isCurrent ? '800' : '600'}" fill="${p.isCurrent ? '#047857' : '#475569'}">${escapeHtml(p.month)}</text>
          </g>
        `;
      })
      .join('');

    return `
      <svg
        class="crm-evolution-svg crm-enrollment-svg"
        viewBox="0 0 ${width} ${height}"
        role="img"
        aria-label="Gráfico de matrículas por período"
      >
        ${gridLines}
        <line x1="${padLeft}" y1="${padTop + chartH}" x2="${width - padRight}" y2="${padTop + chartH}" stroke="#CBD5E1" />
        ${areaPoints ? `<polygon points="${areaPoints}" fill="#10B981" fill-opacity="0.1" />` : ''}
        ${polylinePoints ? `<polyline points="${polylinePoints}" fill="none" stroke="#047857" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />` : ''}
        ${barsAndDots}
      </svg>
    `;
  }

  function buildStatusDonutSvg(statuses) {
    const total = statuses.reduce((acc, item) => acc + item.count, 0) || 1;
    const size = 156;
    const cx = size / 2;
    const cy = size / 2;
    const r = 56;
    const circumference = 2 * Math.PI * r;
    let offset = 0;

    const slices = statuses
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
      <svg class="crm-origin-donut-svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Distribuição de leads por status">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="transparent" stroke="#E2E8F0" stroke-width="20" />
        ${slices}
        <text x="${cx}" y="${cy - 4}" text-anchor="middle" font-size="20" font-weight="800" fill="#172554">${total}</text>
        <text x="${cx}" y="${cy + 14}" text-anchor="middle" font-size="10.5" font-weight="600" fill="#64748B">Leads</text>
      </svg>
    `;
  }

  function renderActivityPanel(title, subtitle, route, items, emptyTitle, emptyDesc, badgeLabel) {
    const bodyHtml =
      items.length === 0
        ? renderEmptyBox(emptyTitle, emptyDesc)
        : `<ul class="crm-activity-list">${items
            .map(
              (item) => `
                <li class="crm-activity-item">
                  <button
                    type="button"
                    class="crm-activity-item-btn"
                    data-dashboard-detail-title="${escapeHtml(item.title)}"
                    data-dashboard-detail-desc="${escapeHtml(item.desc)}"
                    data-dashboard-detail-time="${escapeHtml(item.time)}"
                    data-dashboard-detail-route="${escapeHtml(item.route)}"
                    data-dashboard-detail-search="${escapeHtml(item.search || '')}"
                  >
                    <div class="crm-activity-left">
                      <span class="crm-status-dot ${escapeHtml(item.dot)}" aria-hidden="true"></span>
                      <div class="crm-activity-copy">
                        <strong>${escapeHtml(item.title)}</strong>
                        <p>${escapeHtml(item.desc)}</p>
                      </div>
                    </div>
                    <span class="crm-activity-time">${escapeHtml(item.time)}</span>
                  </button>
                </li>
              `
            )
            .join('')}</ul>`;

    return `
      <article class="crm-panel crm-activity-panel">
        <div class="crm-panel-header">
          <div>
            <h3 class="crm-panel-title">${escapeHtml(title)}</h3>
            <p class="crm-panel-subtitle">${escapeHtml(subtitle)}</p>
          </div>
          <button type="button" class="crm-link-btn" data-quick-route="${escapeHtml(route)}">
            ${escapeHtml(badgeLabel)}
          </button>
        </div>
        ${bodyHtml}
      </article>
    `;
  }

  function renderDashboard(container, options = {}) {
    if (!container) return;

    const comp = getComponents();
    const session = options.session || { role: 'gestor', name: 'Coordenação Demo', roleLabel: 'Gestor Escolar' };
    const snapshot = collectManagerialSnapshot(options);
    const {
      isEmpty,
      isAtendente,
      monthsCount,
      ownerFilter,
      ownerOptions,
      kpis,
      monthlySeries,
      originsStats,
      statusDistribution,
      attendantStats,
      funnel,
      operational,
      managerialAlerts,
      activities
    } = snapshot;

    const kpiCardsHtml = kpis
      .map((kpi) =>
        comp
          ? comp.renderKpiCard(kpi)
          : `<article class="crm-kpi-card accent-${escapeHtml(kpi.accent)}" id="${escapeHtml(kpi.id)}"><span class="crm-kpi-label">${escapeHtml(kpi.label)}</span><strong class="crm-kpi-value">${escapeHtml(kpi.value)}</strong><span class="crm-kpi-foot ${escapeHtml(kpi.footTone)}">${escapeHtml(kpi.foot)}</span></article>`
      )
      .join('');

    // Gráfico 1: Evolução de leads
    const evolutionContentHtml = isEmpty
      ? renderEmptyBox('Sem histórico no período', 'Nenhum dado de evolução disponível no estado vazio.')
      : `
        <div class="crm-chart-legend">
          <span class="crm-legend-item"><span class="crm-legend-swatch leads"></span> ${isAtendente ? 'Meus leads' : 'Leads recebidos'}</span>
          <span class="crm-legend-item"><span class="crm-legend-swatch atendimentos"></span> ${isAtendente ? 'Meus atendimentos' : 'Atendimentos'}</span>
        </div>
        <div class="crm-chart-box">
          ${buildEvolutionChartSvg(monthlySeries)}
        </div>
      `;

    // Gráfico 2: Matrículas por período
    const enrollmentsContentHtml = isEmpty
      ? renderEmptyBox('Sem matrículas no período', 'Nenhuma matrícula demonstrativa registrada no estado vazio.')
      : `
        <div class="crm-chart-legend">
          <span class="crm-legend-item"><span class="crm-legend-swatch matriculas"></span> ${isAtendente ? 'Minhas matrículas (mês atual ao vivo + histórico demo)' : 'Matrículas efetivadas (mês atual ao vivo + histórico demo)'}</span>
        </div>
        <div class="crm-chart-box">
          ${buildEnrollmentsPeriodSvg(monthlySeries)}
        </div>
      `;

    // Gráfico 3: Conversão por origem
    const originsConvHtml = isEmpty || originsStats.length === 0
      ? renderEmptyBox('Sem dados por origem', 'Nenhuma origem de captação disponível para o filtro atual.')
      : `<div class="crm-origin-conv-list">
          ${originsStats
            .map((orig) => {
              const barPct = Math.max(4, Math.round(orig.rate));
              return `
                <div class="crm-origin-conv-row">
                  <div class="crm-origin-conv-head">
                    <span class="crm-origin-name">
                      <span class="crm-origin-dot" style="background-color: ${escapeHtml(orig.color)};" aria-hidden="true"></span>
                      ${escapeHtml(orig.label)}
                    </span>
                    <span class="crm-origin-conv-nums">
                      <strong>${orig.matriculas}/${orig.total}</strong>
                      <span class="crm-conv-rate-pill">${escapeHtml(orig.rateLabel)}</span>
                    </span>
                  </div>
                  <div class="crm-funnel-track" role="progressbar" aria-valuenow="${Math.round(orig.rate)}" aria-valuemin="0" aria-valuemax="100" aria-label="Conversão em ${escapeHtml(orig.label)}">
                    <div class="crm-funnel-bar" style="width: ${barPct}%; background-color: ${escapeHtml(orig.color)};"></div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>`;

    // Gráfico 4: Distribuição por status
    const totalStatusCount = statusDistribution.reduce((s, item) => s + item.count, 0) || 1;
    const statusDistHtml = isEmpty || statusDistribution.length === 0
      ? renderEmptyBox('Sem distribuição de status', 'Nenhum lead disponível para exibir por status.')
      : `
        <div class="crm-origin-layout">
          <div class="crm-origin-donut">
            ${buildStatusDonutSvg(statusDistribution)}
          </div>
          <ul class="crm-origin-list">
            ${statusDistribution
              .map((st) => {
                const pct = Math.round((st.count / totalStatusCount) * 100);
                return `
                  <li class="crm-origin-row">
                    <span class="crm-origin-name">
                      <span class="crm-origin-dot" style="background-color: ${escapeHtml(st.color)};" aria-hidden="true"></span>
                      ${escapeHtml(st.label)}
                    </span>
                    <span class="crm-origin-meta">
                      <strong>${st.count}</strong>
                      <small>${pct}%</small>
                    </span>
                  </li>
                `;
              })
              .join('')}
          </ul>
        </div>
      `;

    // Gráfico 5: Atendimentos por atendente (exclusivo Gestor Escolar)
    const maxAtendCount = Math.max(1, ...attendantStats.map((a) => a.total));
    const attendantChartHtml = isEmpty || attendantStats.length === 0
      ? renderEmptyBox('Sem atendimentos por atendente', 'Nenhum atendimento registrado para os colaboradores.')
      : `<div class="crm-attendant-chart-list">
          ${attendantStats
            .map((row) => {
              const widthPct = Math.round((row.total / maxAtendCount) * 100);
              const donePct = row.total > 0 ? Math.round((row.concluidos / row.total) * 100) : 0;
              return `
                <div class="crm-attendant-bar-row">
                  <div class="crm-attendant-bar-head">
                    <strong>${escapeHtml(row.name)}</strong>
                    <span>${row.total} atend. &bull; ${row.concluidos} concl. (${donePct}%) &bull; ${row.matriculas} matr.</span>
                  </div>
                  <div class="crm-funnel-track" role="progressbar" aria-valuenow="${row.total}" aria-valuemin="0" aria-valuemax="${maxAtendCount}">
                    <div class="crm-funnel-bar" style="width: ${Math.max(4, widthPct)}%; background-color: #1E3A8A;"></div>
                  </div>
                </div>
              `;
            })
            .join('')}
        </div>`;

    // Funil de conversão (5 etapas exatas)
    const maxFunnel = Math.max(1, ...funnel.map((f) => f.count));
    const funnelHtml = isEmpty || funnel.length === 0
      ? renderEmptyBox('Funil sem registros', 'Quando houver leads cadastrados, as 5 etapas de conversão aparecerão aqui.')
      : `<div class="crm-funnel-list">${funnel
          .map((stage, idx) => {
            const pct = Math.round((stage.count / maxFunnel) * 100);
            return `
              <div class="crm-funnel-row">
                <div class="crm-funnel-meta">
                  <span>${idx + 1}. ${escapeHtml(stage.stage)}</span>
                  <strong>${stage.count} <small>(${pct}%)</small></strong>
                </div>
                <div class="crm-funnel-track" role="progressbar" aria-valuenow="${stage.count}" aria-valuemin="0" aria-valuemax="${maxFunnel}" aria-label="${escapeHtml(stage.stage)}">
                  <div class="crm-funnel-bar" style="width: ${pct}%; background-color: ${escapeHtml(stage.color)};"></div>
                </div>
              </div>
            `;
          })
          .join('')}</div>`;

    const ownerOptionsHtml = [
      `<option value="todos"${ownerFilter === 'todos' ? ' selected' : ''}>Toda a equipe escolar</option>`,
      ...ownerOptions.map(
        (name) =>
          `<option value="${escapeHtml(name)}"${ownerFilter === name ? ' selected' : ''}>${escapeHtml(name)}</option>`
      )
    ].join('');

    const modalHtml = comp
      ? comp.renderModal({
          id: 'crm-dashboard-detail-modal',
          titleId: 'crm-dash-modal-title',
          title: 'Detalhes do Registro (Demonstração)',
          subtitle: 'Prévia rápida vinculada aos módulos locais do CRM',
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

    const bannerHtml = isAtendente
      ? `
        <section class="crm-demo-banner crm-role-scope-banner is-atendente" id="crm-dash-role-banner" aria-label="Meu Dashboard operacional">
          <div class="crm-demo-banner-copy">
            <strong>Meu Dashboard — Visão operacional individual (${escapeHtml(session.name)})</strong>
            <span>Indicadores filtrados exclusivamente para sua carteira de atendimentos, tarefas e visitas (simulação front-end).</span>
          </div>
          <div class="crm-demo-banner-actions">
            <button type="button" class="btn btn-outline btn-sm" id="btn-toggle-dashboard-empty">
              ${isEmpty ? 'Restaurar dados demo' : 'Simular estado vazio'}
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-quick-route="leads">
              Meus Leads
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-quick-route="atendimentos">
              Meus Atendimentos
            </button>
            <button type="button" class="btn btn-primary btn-sm" data-quick-route="visitas">
              Minhas Visitas
            </button>
          </div>
        </section>
      `
      : `
        <section class="crm-demo-banner crm-role-scope-banner is-gestor" id="crm-dash-role-banner" aria-label="Dashboard Geral gerencial">
          <div class="crm-demo-banner-copy">
            <strong>Dashboard Geral ENSINA AÍ — Visão gerencial (${escapeHtml(session.roleLabel)})</strong>
            <span>Indicadores consolidados da escola, gargalos de distribuição e comparativo da equipe (simulação front-end).</span>
          </div>
          <div class="crm-demo-banner-actions">
            <label for="dash-filter-owner" class="sr-only">Filtrar por colaborador</label>
            <select id="dash-filter-owner" class="form-control crm-input-compact crm-dash-owner-select" aria-label="Filtrar indicadores por colaborador">
              ${ownerOptionsHtml}
            </select>
            <button type="button" class="btn btn-outline btn-sm" id="btn-toggle-dashboard-empty">
              ${isEmpty ? 'Restaurar dados demo' : 'Simular estado vazio'}
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-quick-route="leads">
              Gestão de Leads
            </button>
            <button type="button" class="btn btn-outline btn-sm" data-quick-route="visitas">
              Agenda de Visitas
            </button>
            <button type="button" class="btn btn-primary btn-sm" data-quick-route="equipe">
              Equipe
            </button>
          </div>
        </section>
      `;

    const focusSectionHtml = isAtendente
      ? `
        <section class="crm-attention-grid" id="crm-dash-atendente-focus" aria-label="Agenda e prioridades do dia">
          ${renderActivityPanel(
            'Agenda do dia',
            'Visitas e tarefas programadas para hoje',
            'visitas',
            operational.agendaDoDia,
            'Agenda livre hoje',
            'Nenhuma visita ou tarefa com vencimento marcado para hoje.',
            'Abrir Visitas'
          )}
          ${renderActivityPanel(
            'Próximos retornos',
            'Contatos com data de retorno programada',
            'atendimentos',
            operational.proximosRetornos,
            'Sem retornos pendentes',
            'Todos os retornos da sua carteira estão em dia.',
            'Meus Atendimentos'
          )}
          ${renderActivityPanel(
            'Tarefas atrasadas',
            'Follow-ups com prazo vencido que pedem ação imediata',
            'tarefas',
            operational.tarefasAtrasadas,
            'Nenhuma tarefa atrasada',
            'Parabéns! Você não possui tarefas vencidas na sua fila.',
            'Minhas Tarefas'
          )}
        </section>
      `
      : `
        <section class="crm-attention-grid" id="crm-dash-gestor-alerts" aria-label="Atenção gerencial da coordenação">
          ${renderActivityPanel(
            'Leads sem responsável',
            'Aguardando atribuição na Gestão de Leads',
            'leads',
            managerialAlerts.semResponsavel,
            'Carteira 100% distribuída',
            'Todos os leads recebidos já possuem um responsável designado.',
            'Distribuir Leads'
          )}
          ${renderActivityPanel(
            'Leads sem atendimento',
            'Contatos ativos sem registro de interação',
            'leads',
            managerialAlerts.semAtendimento,
            'Todos atendidos',
            'Todos os leads ativos já contam com ao menos um atendimento.',
            'Ver Leads'
          )}
          ${renderActivityPanel(
            'Agenda geral de visitas',
            'Próximas visitas programadas de toda a escola',
            'visitas',
            managerialAlerts.agendaGeralVisitas,
            'Sem visitas futuras',
            'Nenhuma visita agendada ou confirmada no momento.',
            'Agenda Completa'
          )}
        </section>
      `;

    const teamComparisonSectionHtml = isAtendente
      ? ''
      : `
        <!-- Linha 3: Atendimentos por Atendente (visão gerencial) -->
        <section class="crm-dashboard-single" id="crm-dash-team-comparison" aria-label="Desempenho de atendimentos por atendente">
          <article class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Atendimentos por atendente</h2>
                <p class="crm-panel-subtitle">Volume de atendimentos, conclusões e matrículas por membro da equipe</p>
              </div>
              <button type="button" class="crm-link-btn" data-quick-route="equipe">Gerenciar Equipe</button>
            </div>
            ${attendantChartHtml}
          </article>
        </section>
      `;

    container.innerHTML = `
      <div class="crm-dashboard-module" id="crm-dashboard-module" data-role="${escapeHtml(session.role || 'gestor')}">
        ${bannerHtml}

        <!-- Indicadores -->
        <section class="crm-kpi-grid" aria-label="${isAtendente ? 'Indicadores individuais do atendente' : 'Indicadores gerenciais da operação escolar'}">
          ${kpiCardsHtml}
        </section>

        ${focusSectionHtml}

        <!-- Gráficos: Evolução + Matrículas por período -->
        <section class="crm-dashboard-lower-grid" aria-label="Evolução temporal de leads e matrículas">
          <article class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">${isAtendente ? 'Evolução do meu desempenho' : 'Evolução de leads'}</h2>
                <p class="crm-panel-subtitle">${isAtendente ? 'Sua captação e seus atendimentos no período' : 'Captação mensal e atendimentos no período'}</p>
              </div>
              <div class="crm-filter-pills" role="group" aria-label="Selecionar período de evolução">
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
                <button
                  type="button"
                  class="crm-filter-pill${monthsCount === 12 ? ' is-active' : ''}"
                  data-evolution-months="12"
                  aria-pressed="${monthsCount === 12 ? 'true' : 'false'}"
                >
                  12 meses
                </button>
              </div>
            </div>
            ${evolutionContentHtml}
          </article>

          <article class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">${isAtendente ? 'Minhas matrículas por período' : 'Matrículas por período'}</h2>
                <p class="crm-panel-subtitle">${isAtendente ? `Efetivações da sua carteira nos últimos ${monthsCount} meses` : `Efetivações nos últimos ${monthsCount} meses (dados demo)`}</p>
              </div>
              <button type="button" class="crm-link-btn" data-quick-route="leads">${isAtendente ? 'Meus Leads' : 'Abrir Leads'}</button>
            </div>
            ${enrollmentsContentHtml}
          </article>
        </section>

        <!-- Funil + Status + Origem -->
        <section class="crm-dashboard-3col" aria-label="Funil, status e conversão por origem">
          <article class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">${isAtendente ? 'Meu funil de conversão' : 'Funil de conversão'}</h2>
                <p class="crm-panel-subtitle">5 etapas da jornada escolar</p>
              </div>
            </div>
            ${funnelHtml}
          </article>

          <article class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">${isAtendente ? 'Status da minha carteira' : 'Distribuição por status'}</h2>
                <p class="crm-panel-subtitle">${isAtendente ? 'Leads atribuídos a você' : 'Carteira atual de leads'}</p>
              </div>
            </div>
            ${statusDistHtml}
          </article>

          <article class="crm-panel">
            <div class="crm-panel-header">
              <div>
                <h2 class="crm-panel-title">Conversão por origem</h2>
                <p class="crm-panel-subtitle">Matrículas sobre leads por canal</p>
              </div>
            </div>
            ${originsConvHtml}
          </article>
        </section>

        ${teamComparisonSectionHtml}

        <!-- Atividades Recentes (5 categorias) -->
        <section class="crm-dashboard-activities-section" aria-label="Atividades recentes">
          <div class="crm-section-heading-row">
            <div>
              <h2 class="crm-panel-title">${isAtendente ? 'Atividades recentes da minha carteira' : 'Atividades recentes da equipe'}</h2>
              <p class="crm-panel-subtitle">${isAtendente ? 'Últimas movimentações dos leads e atendimentos sob sua responsabilidade' : 'Acompanhamento consolidado das movimentações recentes em todos os módulos'}</p>
            </div>
          </div>

          <div class="crm-activity-grid-5">
            ${renderActivityPanel(
              isAtendente ? 'Meus novos leads' : 'Novos leads',
              'Cadastros mais recentes',
              'leads',
              activities.novosLeads,
              'Sem novos leads',
              'Nenhum lead recente encontrado para o filtro selecionado.',
              'Ver Leads'
            )}
            ${renderActivityPanel(
              isAtendente ? 'Meus atendimentos recentes' : 'Atendimentos recentes',
              'Últimas interações registradas',
              'atendimentos',
              activities.atendimentosRecentes,
              'Sem atendimentos recentes',
              'Nenhum atendimento registrado para o filtro atual.',
              'Ver Atendimentos'
            )}
            ${renderActivityPanel(
              isAtendente ? 'Minhas visitas próximas' : 'Visitas próximas',
              'Agenda confirmada ou agendada',
              'visitas',
              activities.visitasProximas,
              'Sem visitas próximas',
              'Nenhuma visita agendada para os próximos dias.',
              'Ver Visitas'
            )}
            ${renderActivityPanel(
              isAtendente ? 'Minhas tarefas pendentes' : 'Tarefas pendentes',
              'Follow-ups e pendências em aberto',
              'tarefas',
              activities.tarefasPendentes,
              'Sem tarefas pendentes',
              'Nenhuma pendência aberta no momento.',
              'Ver Tarefas'
            )}
            ${renderActivityPanel(
              isAtendente ? 'Minhas matrículas recentes' : 'Matrículas recentes',
              isAtendente ? 'Conversões realizadas por você' : 'Conversões concluídas na escola',
              'leads',
              activities.matriculasRecentes,
              'Sem matrículas recentes',
              'Nenhuma matrícula efetivada para o filtro atual.',
              'Ver Matriculados'
            )}
          </div>
        </section>

        ${modalHtml}
      </div>
    `;

    // Bindings
    const ownerSelect = container.querySelector('#dash-filter-owner');
    if (ownerSelect) {
      ownerSelect.addEventListener('change', () => {
        renderDashboard(container, { ...options, ownerFilter: ownerSelect.value });
      });
    }

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
    let selectedDetailSearch = '';

    if (modalCtrl && detailModalEl) {
      const goBtn = detailModalEl.querySelector('#crm-dash-modal-go-btn');
      if (goBtn) {
        goBtn.addEventListener('click', () => {
          modalCtrl.close(false);
          if (typeof options.onNavigateModule === 'function' && selectedDetailSearch) {
            options.onNavigateModule(selectedDetailRoute, { search: selectedDetailSearch });
          } else if (typeof options.onNavigate === 'function') {
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
          selectedDetailSearch = btn.getAttribute('data-dashboard-detail-search') || '';

          const titleEl = detailModalEl.querySelector('#crm-dash-modal-item-title');
          const descEl = detailModalEl.querySelector('#crm-dash-modal-item-desc');
          const timeEl = detailModalEl.querySelector('#crm-dash-modal-item-time');
          if (titleEl) titleEl.textContent = itemTitle;
          if (descEl) descEl.textContent = itemDesc;
          if (timeEl) timeEl.textContent = `Registro / Data: ${itemTime}`;

          modalCtrl.open(btn);
        });
      });
    }
  }

  globalScope.EnsinaAiCrmDashboard = Object.freeze({
    collectManagerialSnapshot,
    renderDashboard
  });
})(window);
