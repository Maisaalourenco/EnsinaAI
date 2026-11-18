/**
 * ENSINA AÍ — CRM Escolar
 * Camada de Serviços de Equipe (js/crm/equipe-service.js)
 * Gerencia membros demonstrativos da equipe escolar e consolida indicadores
 * individuais integrados aos módulos locais de Leads, Atendimentos, Tarefas e Visitas.
 */

(function initCrmEquipeService(globalScope) {
  'use strict';

  const STORAGE_KEY = 'ensina_ai_crm_equipe_demo_v1';

  /**
   * ATENÇÃO: Papéis (Administrador, Gestor Escolar, Atendente) e dados abaixo
   * são exclusivamente demonstrativos em front-end (localStorage), sem controle real de permissões.
   */
  const CATALOGS = Object.freeze({
    roles: [
      { codigo: 'administrador', label: 'Administrador' },
      { codigo: 'gestor', label: 'Gestor Escolar' },
      { codigo: 'atendente', label: 'Atendente' }
    ],
    statuses: [
      { codigo: 'disponivel', label: 'Disponível' },
      { codigo: 'em_atendimento', label: 'Em atendimento' },
      { codigo: 'ausente', label: 'Pausa / Ausente' },
      { codigo: 'inativo', label: 'Inativo' }
    ],
    avatarColors: ['#1E3A8A', '#0369A1', '#047857', '#B45309', '#6D28D9', '#0F766E']
  });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getLabel(list, codigo, fallback) {
    const found = list.find((item) => item.codigo === codigo);
    return found ? found.label : fallback;
  }

  function getRoleLabel(codigo) {
    return getLabel(CATALOGS.roles, codigo, 'Atendente');
  }

  function getStatusLabel(codigo) {
    return getLabel(CATALOGS.statuses, codigo, 'Disponível');
  }

  function normalizeRole(codigo) {
    const valid = CATALOGS.roles.some((r) => r.codigo === codigo);
    return valid ? codigo : 'atendente';
  }

  function normalizeStatus(codigo) {
    const valid = CATALOGS.statuses.some((s) => s.codigo === codigo);
    return valid ? codigo : 'disponivel';
  }

  function normalizePhoneDigits(phone) {
    return String(phone || '').replace(/\D/g, '').slice(0, 11);
  }

  function formatPhone(phone) {
    const digits = normalizePhoneDigits(phone);
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }
    if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return phone || 'Não informado';
  }

  function computeInitials(name) {
    const parts = String(name || '')
      .replace(/\(demo\)/gi, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (parts.length === 0) return 'EA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  function pickAvatarColor(seedText) {
    let hash = 0;
    const str = String(seedText || 'ensina');
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) % 997;
    }
    return CATALOGS.avatarColors[Math.abs(hash) % CATALOGS.avatarColors.length];
  }

  function isoDaysAgo(daysAgo, hours = 9, minutes = 30) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }

  function createSeedMembers() {
    return [
      {
        id: 'EQP-001',
        nome: 'Coordenação Demo',
        email: 'coordenacao.demo@ensinaai.edu.br',
        cargo: 'gestor',
        telefone: '11988011001',
        status: 'disponivel',
        cor_avatar: '#1E3A8A',
        avatar_url: '',
        observacoes: 'Supervisão do funil de matrículas, visitas pedagógicas e distribuição da carteira escolar.',
        criado_em: isoDaysAgo(60, 8, 30),
        atualizado_em: isoDaysAgo(0, 9, 15)
      },
      {
        id: 'EQP-002',
        nome: 'Secretaria Demo',
        email: 'secretaria.demo@ensinaai.edu.br',
        cargo: 'atendente',
        telefone: '11988011002',
        status: 'em_atendimento',
        cor_avatar: '#0369A1',
        avatar_url: '',
        observacoes: 'Atendimento multicanal pelo site, WhatsApp oficial e recepção presencial de famílias.',
        criado_em: isoDaysAgo(55, 9, 0),
        atualizado_em: isoDaysAgo(0, 10, 0)
      },
      {
        id: 'EQP-003',
        nome: 'Ana Paula Mendes (Demo)',
        email: 'ana.mendes.demo@ensinaai.edu.br',
        cargo: 'atendente',
        telefone: '11988011003',
        status: 'disponivel',
        cor_avatar: '#047857',
        avatar_url: '',
        observacoes: 'Especialista em Educação Infantil e Ensino Fundamental I, foco em agendamentos e retornos.',
        criado_em: isoDaysAgo(48, 10, 0),
        atualizado_em: isoDaysAgo(1, 15, 20)
      },
      {
        id: 'EQP-004',
        nome: 'Rafael Costa (Demo)',
        email: 'rafael.costa.demo@ensinaai.edu.br',
        cargo: 'atendente',
        telefone: '11988011004',
        status: 'ausente',
        cor_avatar: '#B45309',
        avatar_url: '',
        observacoes: 'Atendimento voltado ao Ensino Fundamental II e Ensino Médio, com acompanhamento de propostas.',
        criado_em: isoDaysAgo(40, 11, 0),
        atualizado_em: isoDaysAgo(1, 17, 0)
      },
      {
        id: 'EQP-005',
        nome: 'Helena Vasconcelos (Demo)',
        email: 'helena.admin.demo@ensinaai.edu.br',
        cargo: 'administrador',
        telefone: '11988011005',
        status: 'disponivel',
        cor_avatar: '#6D28D9',
        avatar_url: '',
        observacoes: 'Direção administrativa demonstrativa, revisão de indicadores gerais e cadastros institucionais.',
        criado_em: isoDaysAgo(90, 8, 0),
        atualizado_em: isoDaysAgo(2, 14, 10)
      }
    ];
  }

  function normalizeMember(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const nome = String(raw.nome || '').trim();
    if (!nome) return null;
    return {
      id: String(raw.id || ''),
      nome,
      email: String(raw.email || '').trim().toLowerCase(),
      cargo: normalizeRole(raw.cargo),
      telefone: normalizePhoneDigits(raw.telefone),
      status: normalizeStatus(raw.status),
      cor_avatar: String(raw.cor_avatar || pickAvatarColor(nome)),
      avatar_url: String(raw.avatar_url || '').trim(),
      observacoes: String(raw.observacoes || '').trim(),
      criado_em: raw.criado_em || new Date().toISOString(),
      atualizado_em: raw.atualizado_em || raw.criado_em || new Date().toISOString()
    };
  }

  function readFromStorage() {
    try {
      const raw = globalScope.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        const seeded = createSeedMembers();
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeMember).filter(Boolean) : [];
    } catch {
      return createSeedMembers();
    }
  }

  function writeToStorage(items) {
    try {
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sem impacto caso localStorage esteja bloqueado
    }
  }

  function matchOwnerName(recordOwner, memberName) {
    const a = String(recordOwner || '').trim().toLowerCase();
    const b = String(memberName || '').trim().toLowerCase();
    if (!a || !b) return false;
    if (a === b) return true;
    const cleanA = a.replace(/\s*\(demo\)\s*/g, '').trim();
    const cleanB = b.replace(/\s*\(demo\)\s*/g, '').trim();
    return Boolean(cleanA && cleanA === cleanB);
  }

  function getMemberMetrics(memberName) {
    const leadsSvc = globalScope.EnsinaAiLeadsService || null;
    const atendSvc = globalScope.EnsinaAiAtendimentosService || null;
    const tarefasSvc = globalScope.EnsinaAiTarefasService || null;
    const visitasSvc = globalScope.EnsinaAiVisitasService || null;

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

    const memberLeads = allLeads.filter((l) => matchOwnerName(l.atendente, memberName));
    const memberAtends = allAtends.filter((a) =>
      matchOwnerName(a.responsavel_atendimento, memberName)
    );
    const memberTarefas = allTarefas.filter((t) =>
      matchOwnerName(t.responsavel_tarefa, memberName)
    );
    const memberVisitas = allVisitas.filter((v) =>
      matchOwnerName(v.responsavel_interno, memberName)
    );

    const leadsAtribuidos = memberLeads.length;
    const matriculasRealizadas = memberLeads.filter((l) => l.status === 'concluido').length;
    const atendimentosRealizados = memberAtends.filter(
      (a) => a.status !== 'cancelado'
    ).length;
    const atendimentosConcluidos = memberAtends.filter((a) => a.status === 'concluido').length;
    const tarefasConcluidas = memberTarefas.filter((t) => t.status === 'concluida').length;
    const visitasAcompanhadas = memberVisitas.filter(
      (v) => v.status !== 'cancelada'
    ).length;

    return {
      leadsAtribuidos,
      atendimentosRealizados,
      atendimentosConcluidos,
      tarefasConcluidas,
      visitasAcompanhadas,
      matriculasRealizadas,
      recentLeads: memberLeads.slice(0, 4),
      recentAtendimentos: memberAtends.slice(0, 4),
      recentVisitas: memberVisitas.slice(0, 4)
    };
  }

  function enrichMember(member) {
    return {
      ...member,
      iniciais: computeInitials(member.nome),
      metrics: getMemberMetrics(member.nome)
    };
  }

  function listMembers(filters = {}) {
    const all = readFromStorage().map(enrichMember);
    const searchRaw = String(filters.search || '').trim().toLowerCase();
    const searchDigits = searchRaw.replace(/\D/g, '');

    const filtered = all.filter((m) => {
      if (filters.role && filters.role !== 'todos' && m.cargo !== filters.role) {
        return false;
      }
      if (filters.status && filters.status !== 'todos' && m.status !== filters.status) {
        return false;
      }
      if (searchRaw) {
        const hay = [m.id, m.nome, m.email, getRoleLabel(m.cargo), m.observacoes]
          .join(' ')
          .toLowerCase();
        const phoneMatch =
          searchDigits.length >= 3 && normalizePhoneDigits(m.telefone).includes(searchDigits);
        if (!hay.includes(searchRaw) && !phoneMatch) {
          return false;
        }
      }
      return true;
    });

    const roleOrder = { administrador: 0, gestor: 1, atendente: 2 };
    filtered.sort((a, b) => {
      const rDiff = (roleOrder[a.cargo] ?? 9) - (roleOrder[b.cargo] ?? 9);
      if (rDiff !== 0) return rDiff;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });

    return {
      items: clone(filtered),
      total: filtered.length,
      allStoredCount: all.length
    };
  }

  function getStats() {
    const all = readFromStorage().map(enrichMember);
    const total = all.length;
    const disponiveis = all.filter((m) => m.status === 'disponivel').length;
    const emAtendimento = all.filter((m) => m.status === 'em_atendimento').length;
    const ausentesOuInativos = all.filter(
      (m) => m.status === 'ausente' || m.status === 'inativo'
    ).length;
    const matriculasEquipe = all.reduce(
      (acc, m) => acc + (m.metrics ? m.metrics.matriculasRealizadas : 0),
      0
    );

    return {
      total,
      disponiveis,
      emAtendimento,
      ausentesOuInativos,
      matriculasEquipe
    };
  }

  function getMemberById(id) {
    const all = readFromStorage();
    const found = all.find((m) => m.id === id);
    return found ? clone(enrichMember(found)) : null;
  }

  function generateNextId(existing) {
    const maxNum = existing.reduce((max, item) => {
      const m = String(item.id || '').match(/(\d+)$/);
      return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
    }, 0);
    return `EQP-${String(maxNum + 1).padStart(3, '0')}`;
  }

  function createMember(input) {
    const all = readFromStorage();
    const nowIso = new Date().toISOString();
    const nome = String(input.nome || '').trim();
    const record = normalizeMember({
      id: generateNextId(all),
      nome,
      email: String(input.email || '').trim().toLowerCase(),
      cargo: normalizeRole(input.cargo),
      telefone: normalizePhoneDigits(input.telefone),
      status: normalizeStatus(input.status),
      cor_avatar: pickAvatarColor(nome),
      avatar_url: String(input.avatar_url || '').trim(),
      observacoes: String(input.observacoes || '').trim(),
      criado_em: nowIso,
      atualizado_em: nowIso
    });
    all.unshift(record);
    writeToStorage(all);
    return clone(enrichMember(record));
  }

  function updateMember(id, updates) {
    const all = readFromStorage();
    const idx = all.findIndex((m) => m.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const nextNome =
      updates.nome !== undefined ? String(updates.nome).trim() : current.nome;

    const updated = normalizeMember({
      ...current,
      nome: nextNome || current.nome,
      email:
        updates.email !== undefined
          ? String(updates.email).trim().toLowerCase()
          : current.email,
      cargo: updates.cargo !== undefined ? normalizeRole(updates.cargo) : current.cargo,
      telefone:
        updates.telefone !== undefined
          ? normalizePhoneDigits(updates.telefone)
          : current.telefone,
      status:
        updates.status !== undefined ? normalizeStatus(updates.status) : current.status,
      observacoes:
        updates.observacoes !== undefined
          ? String(updates.observacoes).trim()
          : current.observacoes,
      atualizado_em: new Date().toISOString()
    });

    all[idx] = updated;
    writeToStorage(all);
    return clone(enrichMember(updated));
  }

  function changeMemberStatus(id, nextStatus) {
    return updateMember(id, { status: nextStatus });
  }

  function restoreDemoMembers() {
    const seeded = createSeedMembers();
    writeToStorage(seeded);
    return clone(seeded.map(enrichMember));
  }

  globalScope.EnsinaAiEquipeService = Object.freeze({
    STORAGE_KEY,
    CATALOGS,
    getRoleLabel,
    getStatusLabel,
    formatPhone,
    computeInitials,
    matchOwnerName,
    listMembers,
    getStats,
    getMemberById,
    createMember,
    updateMember,
    changeMemberStatus,
    restoreDemoMembers
  });
})(window);
