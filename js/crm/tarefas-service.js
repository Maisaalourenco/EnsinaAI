/**
 * ENSINA AÍ — CRM Escolar
 * Camada de Serviços de Tarefas (js/crm/tarefas-service.js)
 * Gerencia tarefas operacionais, prioridades, prazos, atrasos e responsáveis
 * com persistência local demonstrativa em localStorage.
 */

(function initCrmTarefasService(globalScope) {
  'use strict';

  const STORAGE_KEY = 'ensina_ai_crm_tarefas_demo_v1';

  /**
   * ATENÇÃO: Catálogos e registros abaixo são dados demonstrativos locais (localStorage).
   * A integração definitiva com banco de dados e back-end será realizada posteriormente.
   */
  const CATALOGS = Object.freeze({
    priorities: [
      { codigo: 'baixa', label: 'Baixa' },
      { codigo: 'media', label: 'Média' },
      { codigo: 'alta', label: 'Alta' },
      { codigo: 'urgente', label: 'Urgente' }
    ],
    statuses: [
      { codigo: 'pendente', label: 'Pendente' },
      { codigo: 'em_andamento', label: 'Em andamento' },
      { codigo: 'concluida', label: 'Concluída' },
      { codigo: 'cancelada', label: 'Cancelada' }
    ],
    attendants: [
      'Secretaria Demo',
      'Ana Paula Mendes (Demo)',
      'Rafael Costa (Demo)',
      'Coordenação Demo'
    ]
  });

  function formatDateInputFromDate(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function dateOffsetStr(daysOffset) {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    return formatDateInputFromDate(d);
  }

  function isoOffsetDays(daysOffset, hours = 10, minutes = 0) {
    const now = Date.now();
    const d = new Date(now);
    d.setDate(d.getDate() + daysOffset);
    d.setHours(hours, minutes, 0, 0);
    if (daysOffset === 0 && d.getTime() > now) {
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const elapsedMs = Math.max(0, now - startOfToday.getTime());
      const ratio = Math.min(0.9, (hours * 60 + minutes) / (24 * 60));
      return new Date(startOfToday.getTime() + Math.floor(elapsedMs * ratio)).toISOString();
    }
    return d.toISOString();
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getLabel(list, codigo, fallback = 'Não informado') {
    const found = list.find((item) => item.codigo === codigo);
    return found ? found.label : fallback;
  }

  function getPriorityLabel(codigo) {
    return getLabel(CATALOGS.priorities, codigo, 'Média');
  }

  function getStatusLabel(codigo) {
    return getLabel(CATALOGS.statuses, codigo, 'Pendente');
  }

  function normalizePriority(codigo) {
    const valid = CATALOGS.priorities.some((p) => p.codigo === codigo);
    return valid ? codigo : 'media';
  }

  function normalizeStatus(codigo) {
    if (codigo === 'concluido') return 'concluida';
    if (codigo === 'cancelado') return 'cancelada';
    const valid = CATALOGS.statuses.some((s) => s.codigo === codigo);
    return valid ? codigo : 'pendente';
  }

  function getLeadsService() {
    return globalScope.EnsinaAiLeadsService || null;
  }

  function getAtendimentosService() {
    return globalScope.EnsinaAiAtendimentosService || null;
  }

  function resolveRelatedContext(leadId = '', atendimentoId = '', fallback = {}) {
    const leadsSvc = getLeadsService();
    const atendSvc = getAtendimentosService();

    let resolvedLeadId = String(leadId || fallback.lead_id || '').trim();
    const resolvedAtendId = String(atendimentoId || fallback.atendimento_id || '').trim();

    const liveAtend =
      resolvedAtendId && atendSvc && typeof atendSvc.getAtendimentoById === 'function'
        ? atendSvc.getAtendimentoById(resolvedAtendId)
        : null;

    if (!resolvedLeadId && liveAtend && liveAtend.lead_id) {
      resolvedLeadId = liveAtend.lead_id;
    }

    const liveLead =
      resolvedLeadId && leadsSvc && typeof leadsSvc.getLeadById === 'function'
        ? leadsSvc.getLeadById(resolvedLeadId)
        : null;

    return {
      lead_id: resolvedLeadId,
      atendimento_id: resolvedAtendId,
      nome_responsavel:
        (liveLead && liveLead.nome_responsavel) ||
        (liveAtend && liveAtend.nome_responsavel) ||
        fallback.nome_responsavel ||
        '',
      nome_aluno:
        (liveLead && liveLead.nome_aluno) ||
        (liveAtend && liveAtend.nome_aluno) ||
        fallback.nome_aluno ||
        ''
    };
  }

  function buildDueIso(dateStr, timeStr) {
    const cleanDate = String(dateStr || '').trim();
    if (!cleanDate) return '';
    const cleanTime = /^\d{2}:\d{2}$/.test(String(timeStr || '').trim())
      ? String(timeStr).trim()
      : '23:59';
    const parsed = new Date(`${cleanDate}T${cleanTime}:00`);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString();
  }

  function isTaskOverdue(task) {
    if (!task) return false;
    if (task.status === 'concluida' || task.status === 'cancelada') return false;
    const dueIso = buildDueIso(task.data_vencimento, task.horario);
    if (!dueIso) return false;
    return new Date(dueIso).getTime() < Date.now();
  }

  function createSeedTarefas() {
    return [
      {
        id: 'TSK-3001',
        titulo: 'Retorno telefônico sobre período integral',
        descricao: 'Ligar para Eduardo Ferreira após as 17h com a grade de horários e valores do Período Integral.',
        lead_id: 'LD-1002',
        atendimento_id: 'ATD-2002',
        nome_responsavel: 'Eduardo Ferreira Santos',
        nome_aluno: 'Pedro Henrique Santos',
        responsavel_tarefa: 'Ana Paula Mendes (Demo)',
        data_vencimento: dateOffsetStr(-2),
        horario: '17:30',
        prioridade: 'urgente',
        status: 'pendente',
        criado_em: isoOffsetDays(-3, 14, 0),
        atualizado_em: isoOffsetDays(-2, 18, 0),
        concluida_em: '',
        historico: [
          {
            id: 'HT-3001-1',
            tipo: 'criacao',
            titulo: 'Tarefa criada',
            descricao: 'Follow-up agendado a partir do atendimento ATD-2002.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-3, 14, 0)
          }
        ]
      },
      {
        id: 'TSK-3002',
        titulo: 'Follow-up de proposta pedagógica (Ensino Médio)',
        descricao: 'Confirmar se Ricardo Nogueira analisou o PDF com a matriz curricular e convidar para visita.',
        lead_id: 'LD-1004',
        atendimento_id: 'ATD-2004',
        nome_responsavel: 'Ricardo Nogueira Silva',
        nome_aluno: 'Matheus Silva',
        responsavel_tarefa: 'Rafael Costa (Demo)',
        data_vencimento: dateOffsetStr(-1),
        horario: '11:00',
        prioridade: 'alta',
        status: 'em_andamento',
        criado_em: isoOffsetDays(-2, 17, 0),
        atualizado_em: isoOffsetDays(-1, 10, 15),
        concluida_em: '',
        historico: [
          {
            id: 'HT-3002-1',
            tipo: 'criacao',
            titulo: 'Tarefa criada',
            descricao: 'Criada para acompanhar retorno de e-mail enviado no atendimento ATD-2004.',
            autor: 'Rafael Costa (Demo)',
            criado_em: isoOffsetDays(-2, 17, 0)
          }
        ]
      },
      {
        id: 'TSK-3003',
        titulo: 'Confirmar horário de visita da família Oliveira',
        descricao: 'Enviar opções de horário para visita guiada ao Ensino Fundamental I via WhatsApp.',
        lead_id: 'LD-1001',
        atendimento_id: 'ATD-2001',
        nome_responsavel: 'Mariana Oliveira Lima',
        nome_aluno: 'Sofia Oliveira',
        responsavel_tarefa: 'Secretaria Demo',
        data_vencimento: dateOffsetStr(0),
        horario: '16:30',
        prioridade: 'alta',
        status: 'em_andamento',
        criado_em: isoOffsetDays(0, 9, 50),
        atualizado_em: isoOffsetDays(0, 10, 10),
        concluida_em: '',
        historico: [
          {
            id: 'HT-3003-1',
            tipo: 'criacao',
            titulo: 'Tarefa criada',
            descricao: 'Vinculada ao atendimento ATD-2001 para confirmar visita da semana.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(0, 9, 50)
          }
        ]
      },
      {
        id: 'TSK-3004',
        titulo: 'Enviar lista de documentos para matrícula',
        descricao: 'Encaminhar checklist de documentos obrigatórios e ficha médica após visita ao berçário.',
        lead_id: 'LD-1003',
        atendimento_id: 'ATD-2003',
        nome_responsavel: 'Patricia Souza Almeida',
        nome_aluno: 'Helena Souza',
        responsavel_tarefa: 'Secretaria Demo',
        data_vencimento: dateOffsetStr(-1),
        horario: '10:00',
        prioridade: 'media',
        status: 'pendente',
        criado_em: isoOffsetDays(-1, 16, 25),
        atualizado_em: isoOffsetDays(-1, 16, 25),
        concluida_em: '',
        historico: [
          {
            id: 'HT-3004-1',
            tipo: 'criacao',
            titulo: 'Tarefa criada',
            descricao: 'Próximo passo definido após visita presencial ATD-2003.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(-1, 16, 25)
          }
        ]
      },
      {
        id: 'TSK-3005',
        titulo: 'Verificar rota de transporte escolar parceiro',
        descricao: 'Confirmar se a linha credenciada atende o endereço informado por Juliana Martins.',
        lead_id: 'LD-1006',
        atendimento_id: 'ATD-2006',
        nome_responsavel: 'Juliana Martins Pereira',
        nome_aluno: 'Beatriz Martins',
        responsavel_tarefa: 'Secretaria Demo',
        data_vencimento: dateOffsetStr(2),
        horario: '14:30',
        prioridade: 'media',
        status: 'pendente',
        criado_em: isoOffsetDays(-4, 16, 20),
        atualizado_em: isoOffsetDays(-4, 16, 20),
        concluida_em: '',
        historico: [
          {
            id: 'HT-3005-1',
            tipo: 'criacao',
            titulo: 'Tarefa criada',
            descricao: 'Solicitada pela família no atendimento ATD-2006.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(-4, 16, 20)
          }
        ]
      },
      {
        id: 'TSK-3006',
        titulo: 'Preparar sala modelo para visita da Educação Infantil',
        descricao: 'Alinhar equipe pedagógica e materiais lúdicos para recepção da família Campos.',
        lead_id: 'LD-1008',
        atendimento_id: 'ATD-2007',
        nome_responsavel: 'Larissa Campos Melo',
        nome_aluno: 'Davi Campos',
        responsavel_tarefa: 'Coordenação Demo',
        data_vencimento: dateOffsetStr(1),
        horario: '14:00',
        prioridade: 'baixa',
        status: 'em_andamento',
        criado_em: isoOffsetDays(-5, 14, 15),
        atualizado_em: isoOffsetDays(-3, 9, 0),
        concluida_em: '',
        historico: [
          {
            id: 'HT-3006-1',
            tipo: 'criacao',
            titulo: 'Tarefa criada',
            descricao: 'Organização interna para acolhimento da visita.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-5, 14, 15)
          }
        ]
      },
      {
        id: 'TSK-3007',
        titulo: 'Conferir histórico escolar e assinar guia de matrícula',
        descricao: 'Conferência documental concluída presencialmente na secretaria.',
        lead_id: 'LD-1005',
        atendimento_id: 'ATD-2005',
        nome_responsavel: 'Camila Andrade Ribeiro',
        nome_aluno: 'Lucas Andrade',
        responsavel_tarefa: 'Ana Paula Mendes (Demo)',
        data_vencimento: dateOffsetStr(-3),
        horario: '11:30',
        prioridade: 'alta',
        status: 'concluida',
        criado_em: isoOffsetDays(-4, 9, 0),
        atualizado_em: isoOffsetDays(-3, 11, 20),
        concluida_em: isoOffsetDays(-3, 11, 20),
        historico: [
          {
            id: 'HT-3007-2',
            tipo: 'conclusao',
            titulo: 'Tarefa concluída',
            descricao: 'Matrícula formalizada com documentação completa.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-3, 11, 20)
          },
          {
            id: 'HT-3007-1',
            tipo: 'criacao',
            titulo: 'Tarefa criada',
            descricao: 'Conferência programada para entrega na secretaria.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-4, 9, 0)
          }
        ]
      },
      {
        id: 'TSK-3008',
        titulo: 'Enviar boas-vindas e calendário de adaptação',
        descricao: 'Mensagem de acolhimento encaminhada após confirmação de vaga no 1º ano.',
        lead_id: 'LD-1010',
        atendimento_id: 'ATD-2008',
        nome_responsavel: 'Renata Azevedo Gomes',
        nome_aluno: 'Rafael Gomes',
        responsavel_tarefa: 'Secretaria Demo',
        data_vencimento: dateOffsetStr(-7),
        horario: '15:00',
        prioridade: 'baixa',
        status: 'concluida',
        criado_em: isoOffsetDays(-8, 13, 10),
        atualizado_em: isoOffsetDays(-7, 15, 0),
        concluida_em: isoOffsetDays(-7, 15, 0),
        historico: [
          {
            id: 'HT-3008-1',
            tipo: 'conclusao',
            titulo: 'Tarefa concluída',
            descricao: 'Guia de adaptação entregue à família.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(-7, 15, 0)
          }
        ]
      },
      {
        id: 'TSK-3009',
        titulo: 'Reagendar apresentação após cancelamento de viagem',
        descricao: 'Lead optou por adiar matrícula para o próximo ano letivo.',
        lead_id: 'LD-1009',
        atendimento_id: '',
        nome_responsavel: 'Thiago Barbosa Alves',
        nome_aluno: 'Miguel Alves',
        responsavel_tarefa: 'Rafael Costa (Demo)',
        data_vencimento: dateOffsetStr(-5),
        horario: '10:00',
        prioridade: 'baixa',
        status: 'cancelada',
        criado_em: isoOffsetDays(-9, 10, 0),
        atualizado_em: isoOffsetDays(-6, 14, 0),
        concluida_em: '',
        historico: [
          {
            id: 'HT-3009-1',
            tipo: 'status',
            titulo: 'Tarefa cancelada',
            descricao: 'Cancelada porque a família mudou de cidade.',
            autor: 'Rafael Costa (Demo)',
            criado_em: isoOffsetDays(-6, 14, 0)
          }
        ]
      }
    ];
  }

  function normalizeTarefaRecord(item) {
    if (!item || typeof item !== 'object') return null;
    const rel = resolveRelatedContext(item.lead_id, item.atendimento_id, item);
    return {
      id: String(item.id || ''),
      titulo: String(item.titulo || '').trim(),
      descricao: String(item.descricao || '').trim(),
      lead_id: rel.lead_id,
      atendimento_id: rel.atendimento_id,
      nome_responsavel: rel.nome_responsavel,
      nome_aluno: rel.nome_aluno,
      responsavel_tarefa: String(item.responsavel_tarefa || 'Secretaria Demo').trim(),
      data_vencimento: String(item.data_vencimento || dateOffsetStr(0)).trim(),
      horario: String(item.horario || '10:00').trim(),
      prioridade: normalizePriority(item.prioridade),
      status: normalizeStatus(item.status),
      criado_em: item.criado_em || new Date().toISOString(),
      atualizado_em: item.atualizado_em || item.criado_em || new Date().toISOString(),
      concluida_em: item.concluida_em || '',
      historico: Array.isArray(item.historico) ? item.historico : []
    };
  }

  function readFromStorage() {
    try {
      const raw = globalScope.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        const seeded = createSeedTarefas();
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeTarefaRecord).filter(Boolean) : [];
    } catch {
      return createSeedTarefas();
    }
  }

  function writeToStorage(items) {
    try {
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sem impacto caso localStorage esteja bloqueado
    }
  }

  function getLeadOptions() {
    const leadsSvc = getLeadsService();
    if (leadsSvc && typeof leadsSvc.listLeads === 'function') {
      return (leadsSvc.listLeads({ page: 1, pageSize: 500 }).items || []).map((l) => ({
        id: l.id,
        label: `${l.id} — ${l.nome_responsavel}${l.nome_aluno ? ` (Aluno: ${l.nome_aluno})` : ''}`
      }));
    }
    return [];
  }

  function getAtendimentoOptions(leadIdFilter = '') {
    const atendSvc = getAtendimentosService();
    if (atendSvc && typeof atendSvc.listAtendimentos === 'function') {
      const items = atendSvc.listAtendimentos({ page: 1, pageSize: 500 }).items || [];
      const filtered = leadIdFilter
        ? items.filter((a) => a.lead_id === leadIdFilter)
        : items;
      return filtered.map((a) => ({
        id: a.id,
        lead_id: a.lead_id,
        label: `${a.id} — ${a.nome_responsavel} (${a.lead_id})`
      }));
    }
    return [];
  }

  function matchOwner(a, b) {
    const eqSvc = globalScope.EnsinaAiEquipeService;
    if (eqSvc && typeof eqSvc.matchOwnerName === 'function') {
      return eqSvc.matchOwnerName(a, b);
    }
    const cleanA = String(a || '').replace(/\s*\(demo\)\s*/gi, '').trim().toLowerCase();
    const cleanB = String(b || '').replace(/\s*\(demo\)\s*/gi, '').trim().toLowerCase();
    return Boolean(cleanA && cleanB && cleanA === cleanB);
  }

  function listTarefas(filters = {}) {
    const all = readFromStorage();
    const searchRaw = String(filters.search || '').trim().toLowerCase();

    const filtered = all.filter((item) => {
      if (filters.leadId && item.lead_id !== filters.leadId) return false;
      if (filters.atendimentoId && item.atendimento_id !== filters.atendimentoId) return false;
      if (filters.priority && filters.priority !== 'todos' && item.prioridade !== filters.priority) {
        return false;
      }
      if (
        filters.attendant &&
        filters.attendant !== 'todos' &&
        !matchOwner(item.responsavel_tarefa, filters.attendant)
      ) {
        return false;
      }
      if (filters.status && filters.status !== 'todos') {
        if (filters.status === 'atrasadas') {
          if (!isTaskOverdue(item)) return false;
        } else if (item.status !== filters.status) {
          return false;
        }
      }
      if (searchRaw) {
        const hay = [
          item.id,
          item.titulo,
          item.descricao,
          item.lead_id,
          item.atendimento_id,
          item.nome_responsavel,
          item.nome_aluno,
          item.responsavel_tarefa
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(searchRaw)) return false;
      }
      return true;
    });

    // Ordenação: atrasadas no topo, depois por vencimento mais próximo e atualização recente
    filtered.sort((a, b) => {
      const aOver = isTaskOverdue(a) ? 1 : 0;
      const bOver = isTaskOverdue(b) ? 1 : 0;
      if (aOver !== bOver) return bOver - aOver;

      const aDue = buildDueIso(a.data_vencimento, a.horario) || a.atualizado_em;
      const bDue = buildDueIso(b.data_vencimento, b.horario) || b.atualizado_em;
      return new Date(aDue).getTime() - new Date(bDue).getTime();
    });

    const pageSize = Number(filters.pageSize) > 0 ? Number(filters.pageSize) : 6;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(1, Number(filters.page) || 1), totalPages);
    const startIdx = (page - 1) * pageSize;

    return {
      items: clone(filtered.slice(startIdx, startIdx + pageSize)),
      total,
      page,
      pageSize,
      totalPages,
      allStoredCount: all.length
    };
  }

  function getStats(filters = {}) {
    const all = readFromStorage();
    const scoped =
      filters && filters.attendant && filters.attendant !== 'todos'
        ? all.filter((t) => matchOwner(t.responsavel_tarefa, filters.attendant))
        : all;
    return {
      total: scoped.length,
      pendentes: scoped.filter((t) => t.status === 'pendente').length,
      emAndamento: scoped.filter((t) => t.status === 'em_andamento').length,
      concluidas: scoped.filter((t) => t.status === 'concluida').length,
      atrasadas: scoped.filter((t) => isTaskOverdue(t)).length
    };
  }

  function getTarefaById(id) {
    const all = readFromStorage();
    const found = all.find((item) => item.id === id);
    return found ? clone(found) : null;
  }

  function generateNextId(existing) {
    const maxNum = existing.reduce((max, item) => {
      const m = String(item.id || '').match(/(\d+)$/);
      return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
    }, 3000);
    return `TSK-${maxNum + 1}`;
  }

  function createTarefa(input, actorName = 'Equipe CRM (Demo)') {
    const all = readFromStorage();
    const nowIso = new Date().toISOString();
    const id = generateNextId(all);
    const rel = resolveRelatedContext(input.lead_id, input.atendimento_id);
    const status = normalizeStatus(input.status || 'pendente');
    const priority = normalizePriority(input.prioridade || 'media');
    const owner = String(input.responsavel_tarefa || actorName || 'Secretaria Demo').trim();

    const newItem = {
      id,
      titulo: String(input.titulo || '').trim(),
      descricao: String(input.descricao || '').trim(),
      lead_id: rel.lead_id,
      atendimento_id: rel.atendimento_id,
      nome_responsavel: rel.nome_responsavel,
      nome_aluno: rel.nome_aluno,
      responsavel_tarefa: owner,
      data_vencimento: String(input.data_vencimento || dateOffsetStr(0)).trim(),
      horario: String(input.horario || '10:00').trim(),
      prioridade: priority,
      status,
      criado_em: nowIso,
      atualizado_em: nowIso,
      concluida_em: status === 'concluida' ? nowIso : '',
      historico: [
        {
          id: `HT-${id}-${Date.now()}`,
          tipo: 'criacao',
          titulo: 'Tarefa criada',
          descricao: `Tarefa "${String(input.titulo || '').trim()}" atribuída para ${owner}.`,
          autor: actorName,
          criado_em: nowIso
        }
      ]
    };

    all.unshift(newItem);
    writeToStorage(all);
    return clone(newItem);
  }

  function updateTarefa(id, input, actorName = 'Equipe CRM (Demo)') {
    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const nowIso = new Date().toISOString();
    const rel = resolveRelatedContext(
      input.lead_id !== undefined ? input.lead_id : current.lead_id,
      input.atendimento_id !== undefined ? input.atendimento_id : current.atendimento_id,
      current
    );
    const nextStatus = normalizeStatus(input.status || current.status);
    const nextPriority = normalizePriority(input.prioridade || current.prioridade);

    const updated = {
      ...current,
      titulo: String(input.titulo ?? current.titulo).trim(),
      descricao: String(input.descricao ?? current.descricao).trim(),
      lead_id: rel.lead_id,
      atendimento_id: rel.atendimento_id,
      nome_responsavel: rel.nome_responsavel,
      nome_aluno: rel.nome_aluno,
      responsavel_tarefa: String(input.responsavel_tarefa ?? current.responsavel_tarefa).trim(),
      data_vencimento: String(input.data_vencimento ?? current.data_vencimento).trim(),
      horario: String(input.horario ?? current.horario).trim(),
      prioridade: nextPriority,
      status: nextStatus,
      atualizado_em: nowIso,
      concluida_em:
        nextStatus === 'concluida'
          ? current.concluida_em || nowIso
          : '',
      historico: [
        {
          id: `HT-${id}-${Date.now()}`,
          tipo: 'edicao',
          titulo: 'Tarefa atualizada',
          descricao: `Dados atualizados (${getPriorityLabel(nextPriority)} • ${getStatusLabel(nextStatus)}).`,
          autor: actorName,
          criado_em: nowIso
        },
        ...(Array.isArray(current.historico) ? current.historico : [])
      ]
    };

    all[idx] = updated;
    writeToStorage(all);
    return clone(updated);
  }

  function changeTarefaStatus(id, newStatus, actorName = 'Equipe CRM (Demo)') {
    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const normalized = normalizeStatus(newStatus);
    if (current.status === normalized) return clone(current);

    const nowIso = new Date().toISOString();
    const updated = {
      ...current,
      status: normalized,
      atualizado_em: nowIso,
      concluida_em: normalized === 'concluida' ? nowIso : '',
      historico: [
        {
          id: `HT-${id}-${Date.now()}`,
          tipo: normalized === 'concluida' ? 'conclusao' : 'status',
          titulo: normalized === 'concluida' ? 'Tarefa concluída' : 'Alteração de status',
          descricao: `Status alterado de "${getStatusLabel(current.status)}" para "${getStatusLabel(normalized)}".`,
          autor: actorName,
          criado_em: nowIso
        },
        ...(Array.isArray(current.historico) ? current.historico : [])
      ]
    };

    all[idx] = updated;
    writeToStorage(all);
    return clone(updated);
  }

  function completeTarefa(id, actorName = 'Equipe CRM (Demo)') {
    return changeTarefaStatus(id, 'concluida', actorName);
  }

  function changeTarefaOwner(id, newOwner, actorName = 'Equipe CRM (Demo)') {
    const cleanOwner = String(newOwner || '').trim();
    if (!cleanOwner) return null;

    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    if (current.responsavel_tarefa === cleanOwner) return clone(current);

    const nowIso = new Date().toISOString();
    const updated = {
      ...current,
      responsavel_tarefa: cleanOwner,
      atualizado_em: nowIso,
      historico: [
        {
          id: `HT-${id}-${Date.now()}`,
          tipo: 'responsavel',
          titulo: 'Responsável alterado',
          descricao: `Responsável alterado de "${current.responsavel_tarefa}" para "${cleanOwner}".`,
          autor: actorName,
          criado_em: nowIso
        },
        ...(Array.isArray(current.historico) ? current.historico : [])
      ]
    };

    all[idx] = updated;
    writeToStorage(all);
    return clone(updated);
  }

  function deleteTarefa(id) {
    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    const removed = all[idx];
    all.splice(idx, 1);
    writeToStorage(all);
    return clone(removed);
  }

  function restoreDemoTarefas() {
    const seeded = createSeedTarefas();
    writeToStorage(seeded);
    return clone(seeded);
  }

  globalScope.EnsinaAiTarefasService = Object.freeze({
    STORAGE_KEY,
    CATALOGS,
    getPriorityLabel,
    getStatusLabel,
    isTaskOverdue,
    getLeadOptions,
    getAtendimentoOptions,
    listTarefas,
    getStats,
    getTarefaById,
    createTarefa,
    updateTarefa,
    changeTarefaStatus,
    completeTarefa,
    changeTarefaOwner,
    deleteTarefa,
    restoreDemoTarefas
  });
})(window);
