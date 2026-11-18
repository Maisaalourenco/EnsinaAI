/**
 * ENSINA AÍ — CRM Escolar
 * Camada de Serviços de Visitas (js/crm/visitas-service.js)
 * Gerencia agendamentos, confirmações, realizações, cancelamentos e faltas
 * com persistência local demonstrativa em localStorage.
 */

(function initCrmVisitasService(globalScope) {
  'use strict';

  const STORAGE_KEY = 'ensina_ai_crm_visitas_demo_v1';

  /**
   * ATENÇÃO: Catálogos e registros abaixo são dados demonstrativos locais (localStorage).
   * A integração definitiva com banco de dados e back-end será realizada posteriormente.
   */
  const CATALOGS = Object.freeze({
    statuses: [
      { codigo: 'agendada', label: 'Agendada' },
      { codigo: 'confirmada', label: 'Confirmada' },
      { codigo: 'realizada', label: 'Realizada' },
      { codigo: 'cancelada', label: 'Cancelada' },
      { codigo: 'nao_compareceu', label: 'Não compareceu' }
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

  function getLabel(list, codigo, fallback = 'Agendada') {
    const found = list.find((item) => item.codigo === codigo);
    return found ? found.label : fallback;
  }

  function getStatusLabel(codigo) {
    return getLabel(CATALOGS.statuses, codigo, 'Agendada');
  }

  function normalizeStatus(codigo) {
    const valid = CATALOGS.statuses.some((s) => s.codigo === codigo);
    return valid ? codigo : 'agendada';
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
        String(fallback.nome_responsavel || '').trim() ||
        (liveLead && liveLead.nome_responsavel) ||
        (liveAtend && liveAtend.nome_responsavel) ||
        '',
      nome_aluno:
        String(fallback.nome_aluno || '').trim() ||
        (liveLead && liveLead.nome_aluno) ||
        (liveAtend && liveAtend.nome_aluno) ||
        ''
    };
  }

  function buildVisitIso(dateStr, timeStr) {
    const cleanDate = String(dateStr || '').trim();
    if (!cleanDate) return new Date().toISOString();
    const cleanTime = /^\d{2}:\d{2}$/.test(String(timeStr || '').trim())
      ? String(timeStr).trim()
      : '10:00';
    const parsed = new Date(`${cleanDate}T${cleanTime}:00`);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  function isVisitToday(visit) {
    if (!visit || !visit.data) return false;
    return visit.data === dateOffsetStr(0);
  }

  function createSeedVisitas() {
    return [
      {
        id: 'VIS-4001',
        nome_responsavel: 'Patricia Souza Almeida',
        nome_aluno: 'Helena Souza',
        lead_id: 'LD-1003',
        atendimento_id: 'ATD-2003',
        data: dateOffsetStr(0),
        horario: '14:30',
        responsavel_interno: 'Secretaria Demo',
        observacoes: 'Visita ao berçário e apresentação da equipe de nutrição.',
        status: 'confirmada',
        criado_em: isoOffsetDays(-2, 11, 0),
        atualizado_em: isoOffsetDays(0, 8, 45),
        historico: [
          {
            id: 'HV-4001-2',
            tipo: 'status',
            titulo: 'Visita confirmada',
            descricao: 'Família confirmou presença pelo WhatsApp.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(0, 8, 45)
          },
          {
            id: 'HV-4001-1',
            tipo: 'agendamento',
            titulo: 'Visita agendada',
            descricao: 'Agendada para apresentação da Educação Infantil.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(-2, 11, 0)
          }
        ]
      },
      {
        id: 'VIS-4002',
        nome_responsavel: 'Mariana Oliveira Lima',
        nome_aluno: 'Sofia Oliveira',
        lead_id: 'LD-1001',
        atendimento_id: 'ATD-2001',
        data: dateOffsetStr(0),
        horario: '16:00',
        responsavel_interno: 'Coordenação Demo',
        observacoes: 'Família interessada no 2º ano do Ensino Fundamental I (manhã).',
        status: 'agendada',
        criado_em: isoOffsetDays(0, 10, 5),
        atualizado_em: isoOffsetDays(0, 10, 5),
        historico: [
          {
            id: 'HV-4002-1',
            tipo: 'agendamento',
            titulo: 'Visita agendada',
            descricao: 'Horário reservado após atendimento inicial ATD-2001.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(0, 10, 5)
          }
        ]
      },
      {
        id: 'VIS-4003',
        nome_responsavel: 'Larissa Campos Melo',
        nome_aluno: 'Davi Campos',
        lead_id: 'LD-1008',
        atendimento_id: 'ATD-2007',
        data: dateOffsetStr(1),
        horario: '09:30',
        responsavel_interno: 'Ana Paula Mendes (Demo)',
        observacoes: 'Sala modelo reservada com coordenação da Educação Infantil.',
        status: 'confirmada',
        criado_em: isoOffsetDays(-4, 15, 0),
        atualizado_em: isoOffsetDays(-1, 16, 20),
        historico: [
          {
            id: 'HV-4003-1',
            tipo: 'agendamento',
            titulo: 'Visita confirmada',
            descricao: 'Presença dos pais confirmada para amanhã às 09:30.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-1, 16, 20)
          }
        ]
      },
      {
        id: 'VIS-4004',
        nome_responsavel: 'Eduardo Ferreira Santos',
        nome_aluno: 'Pedro Henrique Santos',
        lead_id: 'LD-1002',
        atendimento_id: 'ATD-2002',
        data: dateOffsetStr(2),
        horario: '15:00',
        responsavel_interno: 'Ana Paula Mendes (Demo)',
        observacoes: 'Apresentar refeitório, área de descanso e rotina do período integral.',
        status: 'agendada',
        criado_em: isoOffsetDays(-1, 14, 0),
        atualizado_em: isoOffsetDays(-1, 14, 0),
        historico: [
          {
            id: 'HV-4004-1',
            tipo: 'agendamento',
            titulo: 'Visita agendada',
            descricao: 'Pré-agendamento aguardando confirmação final da família.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-1, 14, 0)
          }
        ]
      },
      {
        id: 'VIS-4005',
        nome_responsavel: 'Camila Andrade Ribeiro',
        nome_aluno: 'Lucas Andrade',
        lead_id: 'LD-1005',
        atendimento_id: 'ATD-2005',
        data: dateOffsetStr(-3),
        horario: '10:30',
        responsavel_interno: 'Ana Paula Mendes (Demo)',
        observacoes: 'Visita realizada com excelente avaliação; matrícula efetivada no mesmo dia.',
        status: 'realizada',
        criado_em: isoOffsetDays(-5, 9, 30),
        atualizado_em: isoOffsetDays(-3, 11, 20),
        historico: [
          {
            id: 'HV-4005-2',
            tipo: 'realizada',
            titulo: 'Visita realizada',
            descricao: 'Família conheceu o Ensino Fundamental II e concluiu matrícula.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-3, 11, 20)
          }
        ]
      },
      {
        id: 'VIS-4006',
        nome_responsavel: 'Renata Azevedo Gomes',
        nome_aluno: 'Rafael Gomes',
        lead_id: 'LD-1010',
        atendimento_id: 'ATD-2008',
        data: dateOffsetStr(-8),
        horario: '11:00',
        responsavel_interno: 'Secretaria Demo',
        observacoes: 'Visita realizada; família confirmou vaga no 1º ano vespertino.',
        status: 'realizada',
        criado_em: isoOffsetDays(-10, 14, 0),
        atualizado_em: isoOffsetDays(-8, 12, 30),
        historico: [
          {
            id: 'HV-4006-1',
            tipo: 'realizada',
            titulo: 'Visita realizada',
            descricao: 'Recepção concluída pela secretaria.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(-8, 12, 30)
          }
        ]
      },
      {
        id: 'VIS-4007',
        nome_responsavel: 'Thiago Barbosa Alves',
        nome_aluno: 'Miguel Alves',
        lead_id: 'LD-1009',
        atendimento_id: '',
        data: dateOffsetStr(-4),
        horario: '14:00',
        responsavel_interno: 'Rafael Costa (Demo)',
        observacoes: 'Responsável informou mudança de cidade e solicitou cancelamento.',
        status: 'cancelada',
        criado_em: isoOffsetDays(-7, 10, 0),
        atualizado_em: isoOffsetDays(-5, 16, 0),
        historico: [
          {
            id: 'HV-4007-1',
            tipo: 'cancelada',
            titulo: 'Visita cancelada',
            descricao: 'Cancelamento registrado a pedido do responsável.',
            autor: 'Rafael Costa (Demo)',
            criado_em: isoOffsetDays(-5, 16, 0)
          }
        ]
      },
      {
        id: 'VIS-4008',
        nome_responsavel: 'Gustavo Teixeira Dias',
        nome_aluno: 'Laura Dias',
        lead_id: 'LD-1011',
        atendimento_id: 'ATD-2009',
        data: dateOffsetStr(-6),
        horario: '16:30',
        responsavel_interno: 'Rafael Costa (Demo)',
        observacoes: 'Imprevisto de viagem; reagendar quando retornar na próxima semana.',
        status: 'nao_compareceu',
        criado_em: isoOffsetDays(-9, 15, 0),
        atualizado_em: isoOffsetDays(-6, 17, 15),
        historico: [
          {
            id: 'HV-4008-1',
            tipo: 'nao_compareceu',
            titulo: 'Não compareceu',
            descricao: 'Família avisou posteriormente sobre imprevisto de trabalho.',
            autor: 'Rafael Costa (Demo)',
            criado_em: isoOffsetDays(-6, 17, 15)
          }
        ]
      }
    ];
  }

  function normalizeVisitaRecord(item) {
    if (!item || typeof item !== 'object') return null;
    const rel = resolveRelatedContext(item.lead_id, item.atendimento_id, item);
    return {
      id: String(item.id || ''),
      nome_responsavel: rel.nome_responsavel || 'Responsável não informado',
      nome_aluno: rel.nome_aluno,
      lead_id: rel.lead_id,
      atendimento_id: rel.atendimento_id,
      data: String(item.data || dateOffsetStr(0)).trim(),
      horario: String(item.horario || '10:00').trim(),
      responsavel_interno: String(item.responsavel_interno || 'Secretaria Demo').trim(),
      observacoes: String(item.observacoes || '').trim(),
      status: normalizeStatus(item.status),
      criado_em: item.criado_em || new Date().toISOString(),
      atualizado_em: item.atualizado_em || item.criado_em || new Date().toISOString(),
      historico: Array.isArray(item.historico) ? item.historico : []
    };
  }

  function readFromStorage() {
    try {
      const raw = globalScope.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        const seeded = createSeedVisitas();
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeVisitaRecord).filter(Boolean) : [];
    } catch {
      return createSeedVisitas();
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

  function matchesDatePeriod(dateStr, period) {
    if (!period || period === 'todos') return true;
    const today = dateOffsetStr(0);
    if (period === 'hoje') return dateStr === today;
    if (period === 'futuras') return dateStr >= today;

    const target = new Date(`${dateStr}T12:00:00`);
    if (Number.isNaN(target.getTime())) return false;
    const now = new Date();
    const diffDays = (now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
    if (period === '7d') return diffDays >= -7 && diffDays <= 7;
    if (period === '30d') return diffDays >= -30 && diffDays <= 30;
    return true;
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

  function listVisitas(filters = {}) {
    const all = readFromStorage();
    const searchRaw = String(filters.search || '').trim().toLowerCase();

    const filtered = all.filter((item) => {
      if (filters.leadId && item.lead_id !== filters.leadId) return false;
      if (filters.atendimentoId && item.atendimento_id !== filters.atendimentoId) return false;
      if (filters.date && item.data !== filters.date) return false;
      if (filters.period && filters.period !== 'todos' && !matchesDatePeriod(item.data, filters.period)) {
        return false;
      }
      if (filters.status && filters.status !== 'todos' && item.status !== filters.status) {
        return false;
      }
      if (
        filters.attendant &&
        filters.attendant !== 'todos' &&
        !matchOwner(item.responsavel_interno, filters.attendant)
      ) {
        return false;
      }
      if (searchRaw) {
        const hay = [
          item.id,
          item.nome_responsavel,
          item.nome_aluno,
          item.lead_id,
          item.atendimento_id,
          item.responsavel_interno,
          item.observacoes
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(searchRaw)) return false;
      }
      return true;
    });

    // Visitas ordenadas pela data/horário mais recente primeiro (com visitas futuras e de hoje em evidência)
    filtered.sort((a, b) => {
      const aTs = new Date(buildVisitIso(a.data, a.horario)).getTime();
      const bTs = new Date(buildVisitIso(b.data, b.horario)).getTime();
      return bTs - aTs;
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
        ? all.filter((v) => matchOwner(v.responsavel_interno, filters.attendant))
        : all;
    return {
      total: scoped.length,
      agendadas: scoped.filter((v) => v.status === 'agendada' || v.status === 'confirmada').length,
      realizadas: scoped.filter((v) => v.status === 'realizada').length,
      canceladas: scoped.filter((v) => v.status === 'cancelada').length,
      hoje: scoped.filter((v) => isVisitToday(v)).length
    };
  }

  function getVisitaById(id) {
    const all = readFromStorage();
    const found = all.find((item) => item.id === id);
    return found ? clone(found) : null;
  }

  function generateNextId(existing) {
    const maxNum = existing.reduce((max, item) => {
      const m = String(item.id || '').match(/(\d+)$/);
      return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
    }, 4000);
    return `VIS-${maxNum + 1}`;
  }

  function createVisita(input, actorName = 'Equipe CRM (Demo)') {
    const all = readFromStorage();
    const nowIso = new Date().toISOString();
    const id = generateNextId(all);
    const rel = resolveRelatedContext(input.lead_id, input.atendimento_id, {
      nome_responsavel: input.nome_responsavel,
      nome_aluno: input.nome_aluno
    });
    const status = normalizeStatus(input.status || 'agendada');
    const internalOwner = String(input.responsavel_interno || actorName || 'Secretaria Demo').trim();

    const newItem = {
      id,
      nome_responsavel: rel.nome_responsavel || String(input.nome_responsavel || '').trim(),
      nome_aluno: rel.nome_aluno || String(input.nome_aluno || '').trim(),
      lead_id: rel.lead_id,
      atendimento_id: rel.atendimento_id,
      data: String(input.data || dateOffsetStr(0)).trim(),
      horario: String(input.horario || '10:00').trim(),
      responsavel_interno: internalOwner,
      observacoes: String(input.observacoes || '').trim(),
      status,
      criado_em: nowIso,
      atualizado_em: nowIso,
      historico: [
        {
          id: `HV-${id}-${Date.now()}`,
          tipo: 'agendamento',
          titulo: 'Visita agendada',
          descricao: `Visita marcada para ${String(input.data || '').split('-').reverse().join('/')} às ${String(
            input.horario || '10:00'
          )} com ${internalOwner}.`,
          autor: actorName,
          criado_em: nowIso
        }
      ]
    };

    all.unshift(newItem);
    writeToStorage(all);
    return clone(newItem);
  }

  function updateVisita(id, input, actorName = 'Equipe CRM (Demo)') {
    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const nowIso = new Date().toISOString();
    const rel = resolveRelatedContext(
      input.lead_id !== undefined ? input.lead_id : current.lead_id,
      input.atendimento_id !== undefined ? input.atendimento_id : current.atendimento_id,
      {
        nome_responsavel: input.nome_responsavel ?? current.nome_responsavel,
        nome_aluno: input.nome_aluno ?? current.nome_aluno
      }
    );
    const nextStatus = normalizeStatus(input.status || current.status);

    const updated = {
      ...current,
      nome_responsavel: String(input.nome_responsavel ?? rel.nome_responsavel ?? current.nome_responsavel).trim(),
      nome_aluno: String(input.nome_aluno ?? rel.nome_aluno ?? current.nome_aluno ?? '').trim(),
      lead_id: rel.lead_id,
      atendimento_id: rel.atendimento_id,
      data: String(input.data ?? current.data).trim(),
      horario: String(input.horario ?? current.horario).trim(),
      responsavel_interno: String(input.responsavel_interno ?? current.responsavel_interno).trim(),
      observacoes: String(input.observacoes ?? current.observacoes ?? '').trim(),
      status: nextStatus,
      atualizado_em: nowIso,
      historico: [
        {
          id: `HV-${id}-${Date.now()}`,
          tipo: 'edicao',
          titulo: 'Agendamento atualizado',
          descricao: `Visita atualizada (${getStatusLabel(nextStatus)}).`,
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

  function changeVisitaStatus(id, newStatus, actorName = 'Equipe CRM (Demo)', note = '') {
    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const normalized = normalizeStatus(newStatus);
    if (current.status === normalized) return clone(current);

    const nowIso = new Date().toISOString();
    const oldLabel = getStatusLabel(current.status);
    const newLabel = getStatusLabel(normalized);

    const updated = {
      ...current,
      status: normalized,
      observacoes: note
        ? current.observacoes
          ? `${current.observacoes}\n${note}`
          : note
        : current.observacoes,
      atualizado_em: nowIso,
      historico: [
        {
          id: `HV-${id}-${Date.now()}`,
          tipo: normalized,
          titulo: `Status: ${newLabel}`,
          descricao: note
            ? `Status alterado de "${oldLabel}" para "${newLabel}". ${note}`
            : `Status alterado de "${oldLabel}" para "${newLabel}".`,
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

  function restoreDemoVisitas() {
    const seeded = createSeedVisitas();
    writeToStorage(seeded);
    return clone(seeded);
  }

  globalScope.EnsinaAiVisitasService = Object.freeze({
    STORAGE_KEY,
    CATALOGS,
    getStatusLabel,
    isVisitToday,
    getLeadOptions,
    getAtendimentoOptions,
    listVisitas,
    getStats,
    getVisitaById,
    createVisita,
    updateVisita,
    changeVisitaStatus,
    restoreDemoVisitas
  });
})(window);
