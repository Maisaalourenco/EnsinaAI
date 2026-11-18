/**
 * ENSINA AÍ — CRM Escolar
 * Camada de Serviços de Leads (js/crm/leads-service.js)
 * Responsável exclusivamente por regras de dados, persistência demonstrativa em localStorage
 * e contrato desacoplado preparatório para futura integração com API real.
 */

(function initCrmLeadsService(globalScope) {
  'use strict';

  const STORAGE_KEY = 'ensina_ai_crm_leads_demo_v1';

  /**
   * ATENÇÃO: Catálogos e registros abaixo são dados demonstrativos em front-end (localStorage).
   * A integração definitiva com banco de dados e APIs será realizada em etapa posterior.
   */
  const CATALOGS = Object.freeze({
    stages: [
      { codigo: 'educacao_infantil', label: 'Educação Infantil' },
      { codigo: 'fundamental_1', label: 'Ensino Fundamental I' },
      { codigo: 'fundamental_2', label: 'Ensino Fundamental II' },
      { codigo: 'medio', label: 'Ensino Médio' },
      { codigo: 'outros', label: 'Outros' }
    ],
    shifts: [
      { codigo: 'manha', label: 'Manhã' },
      { codigo: 'tarde', label: 'Tarde' },
      { codigo: 'integral', label: 'Integral' },
      { codigo: 'nao_informado', label: 'Não informado' }
    ],
    origins: [
      { codigo: 'instagram', label: 'Instagram' },
      { codigo: 'facebook', label: 'Facebook' },
      { codigo: 'whatsapp', label: 'WhatsApp' },
      { codigo: 'site', label: 'Site' },
      { codigo: 'indicacao', label: 'Indicação' },
      { codigo: 'telefone', label: 'Telefone' },
      { codigo: 'visita_presencial', label: 'Visita presencial' },
      { codigo: 'outros', label: 'Outros' }
    ],
    statuses: [
      { codigo: 'novo', label: 'Novo' },
      { codigo: 'em_contato', label: 'Em contato' },
      { codigo: 'aguardando_retorno', label: 'Aguardando retorno' },
      { codigo: 'visita_agendada', label: 'Visita agendada' },
      { codigo: 'concluido', label: 'Matriculado' },
      { codigo: 'perdido', label: 'Perdido' }
    ],
    attendants: [
      'Secretaria Demo',
      'Ana Paula Mendes (Demo)',
      'Rafael Costa (Demo)',
      'Coordenação Demo',
      'Aguardando atribuição'
    ]
  });

  function isoDaysAgo(daysAgo, hours = 10, minutes = 0) {
    const now = Date.now();
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    if (daysAgo === 0 && d.getTime() > now) {
      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);
      const elapsedMs = Math.max(0, now - startOfToday.getTime());
      const ratio = Math.min(0.9, (hours * 60 + minutes) / (24 * 60));
      return new Date(startOfToday.getTime() + Math.floor(elapsedMs * ratio)).toISOString();
    }
    return d.toISOString();
  }

  function createSeedLeads() {
    const rawSeeds = [
      {
        id: 'LD-1001',
        nome_responsavel: 'Mariana Oliveira Lima',
        nome_aluno: 'Sofia Oliveira',
        idade_aluno: 7,
        telefone: '11987651001',
        email: 'mariana.oliveira@exemplo.com',
        etapa_codigo: 'fundamental_1',
        turno_codigo: 'manha',
        origem: 'site',
        status: 'novo',
        atendente: 'Secretaria Demo',
        observacoes: 'Interessada em conhecer a proposta pedagógica do 2º ano.',
        criado_em: isoDaysAgo(0, 9, 15)
      },
      {
        id: 'LD-1002',
        nome_responsavel: 'Eduardo Ferreira Santos',
        nome_aluno: 'Pedro Henrique Santos',
        idade_aluno: 4,
        telefone: '11976541002',
        email: 'eduardo.ferreira@exemplo.com',
        etapa_codigo: 'educacao_infantil',
        turno_codigo: 'integral',
        origem: 'whatsapp',
        status: 'aguardando_retorno',
        atendente: 'Ana Paula Mendes (Demo)',
        observacoes: 'Solicitou tabela de horários do período integral.',
        criado_em: isoDaysAgo(0, 11, 30)
      },
      {
        id: 'LD-1003',
        nome_responsavel: 'Patricia Souza Almeida',
        nome_aluno: 'Helena Souza',
        idade_aluno: 2,
        telefone: '11991231003',
        email: 'patricia.souza@exemplo.com',
        etapa_codigo: 'educacao_infantil',
        turno_codigo: 'manha',
        origem: 'instagram',
        status: 'visita_agendada',
        atendente: 'Secretaria Demo',
        observacoes: 'Visita agendada com os dois responsáveis.',
        criado_em: isoDaysAgo(1, 14, 20)
      },
      {
        id: 'LD-1004',
        nome_responsavel: 'Ricardo Nogueira Silva',
        nome_aluno: 'Matheus Silva',
        idade_aluno: 15,
        telefone: '11982341004',
        email: 'ricardo.nogueira@exemplo.com',
        etapa_codigo: 'medio',
        turno_codigo: 'manha',
        origem: 'facebook',
        status: 'em_contato',
        atendente: 'Rafael Costa (Demo)',
        observacoes: 'Perguntou sobre simulados e preparação para vestibulares.',
        criado_em: isoDaysAgo(2, 16, 10)
      },
      {
        id: 'LD-1005',
        nome_responsavel: 'Camila Andrade Ribeiro',
        nome_aluno: 'Lucas Andrade',
        idade_aluno: 12,
        telefone: '11993451005',
        email: 'camila.andrade@exemplo.com',
        etapa_codigo: 'fundamental_2',
        turno_codigo: 'tarde',
        origem: 'visita_presencial',
        status: 'concluido',
        atendente: 'Ana Paula Mendes (Demo)',
        observacoes: 'Documentação entregue na secretaria.',
        criado_em: isoDaysAgo(3, 10, 5)
      },
      {
        id: 'LD-1006',
        nome_responsavel: 'Juliana Martins Pereira',
        nome_aluno: 'Beatriz Martins',
        idade_aluno: 9,
        telefone: '11984561006',
        email: 'juliana.martins@exemplo.com',
        etapa_codigo: 'fundamental_1',
        turno_codigo: 'integral',
        origem: 'indicacao',
        status: 'em_contato',
        atendente: 'Secretaria Demo',
        observacoes: 'Indicada por família já matriculada no 4º ano.',
        criado_em: isoDaysAgo(4, 15, 40)
      },
      {
        id: 'LD-1007',
        nome_responsavel: 'Fernando Costa Rocha',
        nome_aluno: 'Gabriel Costa',
        idade_aluno: 16,
        telefone: '11995671007',
        email: 'fernando.rocha@exemplo.com',
        etapa_codigo: 'medio',
        turno_codigo: 'nao_informado',
        origem: 'site',
        status: 'novo',
        atendente: 'Aguardando atribuição',
        observacoes: 'Cadastro realizado fora do horário comercial.',
        criado_em: isoDaysAgo(5, 20, 15)
      },
      {
        id: 'LD-1008',
        nome_responsavel: 'Larissa Campos Melo',
        nome_aluno: 'Davi Campos',
        idade_aluno: 3,
        telefone: '11976781008',
        email: 'larissa.campos@exemplo.com',
        etapa_codigo: 'educacao_infantil',
        turno_codigo: 'tarde',
        origem: 'instagram',
        status: 'visita_agendada',
        atendente: 'Ana Paula Mendes (Demo)',
        observacoes: 'Quer conhecer o playground e salas de educação infantil.',
        criado_em: isoDaysAgo(6, 13, 25)
      },
      {
        id: 'LD-1009',
        nome_responsavel: 'Bruno Henrique Duarte',
        nome_aluno: 'Alice Duarte',
        idade_aluno: 11,
        telefone: '11987891009',
        email: 'bruno.duarte@exemplo.com',
        etapa_codigo: 'fundamental_2',
        turno_codigo: 'manha',
        origem: 'outros',
        status: 'perdido',
        atendente: 'Rafael Costa (Demo)',
        observacoes: 'Família optou por mudança de bairro.',
        criado_em: isoDaysAgo(10, 9, 50)
      },
      {
        id: 'LD-1010',
        nome_responsavel: 'Renata Azevedo Gomes',
        nome_aluno: 'Rafael Gomes',
        idade_aluno: 6,
        telefone: '11998901010',
        email: 'renata.azevedo@exemplo.com',
        etapa_codigo: 'fundamental_1',
        turno_codigo: 'tarde',
        origem: 'telefone',
        status: 'concluido',
        atendente: 'Secretaria Demo',
        observacoes: 'Matrícula confirmada após visita guiada.',
        criado_em: isoDaysAgo(12, 11, 15)
      },
      {
        id: 'LD-1011',
        nome_responsavel: 'Gustavo Teixeira Dias',
        nome_aluno: 'Laura Dias',
        idade_aluno: 14,
        telefone: '11989011011',
        email: 'gustavo.teixeira@exemplo.com',
        etapa_codigo: 'fundamental_2',
        turno_codigo: 'manha',
        origem: 'telefone',
        status: 'aguardando_retorno',
        atendente: 'Rafael Costa (Demo)',
        observacoes: 'Aguardando disponibilidade de horário dos pais para visita.',
        criado_em: isoDaysAgo(16, 17, 0)
      },
      {
        id: 'LD-1012',
        nome_responsavel: 'Vanessa Cardoso Pinto',
        nome_aluno: 'Enzo Cardoso',
        idade_aluno: 2,
        telefone: '11970121012',
        email: 'vanessa.cardoso@exemplo.com',
        etapa_codigo: 'educacao_infantil',
        turno_codigo: 'integral',
        origem: 'visita_presencial',
        status: 'concluido',
        atendente: 'Coordenação Demo',
        observacoes: 'Atendimento presencial na recepção da escola.',
        criado_em: isoDaysAgo(21, 10, 30)
      },
      {
        id: 'LD-1013',
        nome_responsavel: 'Thiago Moura Carvalho',
        nome_aluno: 'Giovanna Carvalho',
        idade_aluno: 18,
        telefone: '11991231013',
        email: 'thiago.moura@exemplo.com',
        etapa_codigo: 'outros',
        turno_codigo: 'nao_informado',
        origem: 'facebook',
        status: 'novo',
        atendente: 'Secretaria Demo',
        observacoes: 'Consulta sobre curso preparatório e atividades extracurriculares.',
        criado_em: isoDaysAgo(25, 14, 5)
      },
      {
        id: 'LD-1014',
        nome_responsavel: 'Luciana Barros Freitas',
        nome_aluno: 'Miguel Freitas',
        idade_aluno: 8,
        telefone: '1140021014',
        email: 'luciana.barros@exemplo.com',
        etapa_codigo: 'fundamental_1',
        turno_codigo: 'tarde',
        origem: 'whatsapp',
        status: 'perdido',
        atendente: 'Rafael Costa (Demo)',
        observacoes: 'Preferência pelo turno da manhã sem vaga imediata na turma.',
        criado_em: isoDaysAgo(38, 16, 45)
      }
    ];

    return rawSeeds.map((lead) => ({
      ...lead,
      mensagem: lead.mensagem || lead.observacoes || '',
      consentimento_contato: true,
      consentimento_em: lead.criado_em,
      visita_agendada_em: lead.status === 'visita_agendada' ? isoDaysAgo(-2, 10, 30) : null,
      atualizado_em: lead.criado_em,
      historico: [
        {
          id: `H-${lead.id}-1`,
          tipo: 'cadastro',
          descricao: `Lead cadastrado via ${getOriginLabel(lead.origem)}.`,
          autor: 'Sistema (Demo)',
          criado_em: lead.criado_em
        }
      ]
    }));
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeStageCode(code) {
    if (code === 'infantil_1' || code === 'infantil_2_5') return 'educacao_infantil';
    return code || 'fundamental_1';
  }

  function normalizeShiftCode(code) {
    if (code === 'matutino') return 'manha';
    if (code === 'vespertino') return 'tarde';
    return code || 'nao_informado';
  }

  function normalizeOriginCode(code) {
    if (code === 'presencial') return 'visita_presencial';
    if (code === 'outro') return 'outros';
    return code || 'site';
  }

  function getLabel(list, codigo, fallback = 'Não informado') {
    const found = list.find((item) => item.codigo === codigo);
    return found ? found.label : fallback;
  }

  function getStageLabel(codigo) {
    return getLabel(CATALOGS.stages, normalizeStageCode(codigo));
  }

  function getShiftLabel(codigo) {
    return getLabel(CATALOGS.shifts, normalizeShiftCode(codigo));
  }

  function getOriginLabel(codigo) {
    return getLabel(CATALOGS.origins, normalizeOriginCode(codigo));
  }

  function getStatusLabel(codigo) {
    return getLabel(CATALOGS.statuses, codigo);
  }

  function normalizePhoneDigits(raw) {
    let digits = String(raw || '').replace(/\D/g, '');
    if (digits.startsWith('0055') && digits.length >= 14) {
      digits = digits.slice(4);
    } else if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
      digits = digits.slice(1);
    }
    return digits.slice(0, 11);
  }

  function formatPhone(raw) {
    const digits = normalizePhoneDigits(raw);
    if (!digits) return '';
    if (digits.length > 10) {
      return digits.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3');
    }
    if (digits.length > 6) {
      return digits.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    }
    if (digits.length > 2) {
      return digits.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    return digits.replace(/^(\d*)$/, '($1');
  }

  function isValidBrazilianPhone(raw) {
    const digits = normalizePhoneDigits(raw);
    if (!/^\d{10,11}$/.test(digits)) return false;
    const ddd = Number.parseInt(digits.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99 || ddd % 10 === 0) return false;
    const subscriber = digits.slice(2);
    if (/^(\d)\1+$/.test(subscriber)) return false;
    if (digits.length === 11 && subscriber[0] !== '9') return false;
    if (digits.length === 10 && !/^[2-9]/.test(subscriber[0])) return false;
    return true;
  }

  function isValidEmail(raw) {
    const email = String(raw || '').trim();
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
  }

  function normalizeLeadRecord(lead) {
    if (!lead || typeof lead !== 'object') return null;
    return {
      ...lead,
      etapa_codigo: normalizeStageCode(lead.etapa_codigo),
      turno_codigo: normalizeShiftCode(lead.turno_codigo),
      origem: normalizeOriginCode(lead.origem),
      atendente: String(lead.atendente || 'Aguardando atribuição').trim(),
      mensagem: String(lead.mensagem ?? '').trim(),
      observacoes: String(lead.observacoes ?? '').trim(),
      consentimento_contato: lead.consentimento_contato !== false,
      consentimento_em: lead.consentimento_em || lead.criado_em || null,
      visita_agendada_em: lead.visita_agendada_em || null,
      historico: Array.isArray(lead.historico) ? lead.historico : []
    };
  }

  function readLeadsFromStorage() {
    try {
      const raw = globalScope.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        const seeded = createSeedLeads();
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeLeadRecord).filter(Boolean) : [];
    } catch {
      return createSeedLeads();
    }
  }

  function writeLeadsToStorage(leads) {
    try {
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
    } catch {
      // Sem impacto caso localStorage esteja indisponível
    }
  }

  function matchesPeriod(isoDate, periodFilter) {
    if (!periodFilter || periodFilter === 'todos') return true;
    const target = new Date(isoDate);
    if (Number.isNaN(target.getTime())) return false;

    const now = new Date();
    if (periodFilter === 'hoje') {
      return (
        target.getFullYear() === now.getFullYear() &&
        target.getMonth() === now.getMonth() &&
        target.getDate() === now.getDate()
      );
    }

    const diffDays = (now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
    if (periodFilter === '7d') return diffDays >= -0.01 && diffDays <= 7;
    if (periodFilter === '30d') return diffDays >= -0.01 && diffDays <= 30;
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

  function listLeads(filters = {}) {
    const allLeads = readLeadsFromStorage();
    const searchRaw = String(filters.search || '').trim().toLowerCase();
    const searchDigits = searchRaw.replace(/\D/g, '');
    const attendSvc = globalScope.EnsinaAiAtendimentosService;
    let leadIdsWithAttendance = null;
    if (filters.withoutAttendance && attendSvc && typeof attendSvc.listAtendimentos === 'function') {
      const allAtends = attendSvc.listAtendimentos({ page: 1, pageSize: 1000 }).items || [];
      leadIdsWithAttendance = new Set(allAtends.map((a) => a.lead_id));
    }

    const filtered = allLeads.filter((lead) => {
      if (filters.status && filters.status !== 'todos' && lead.status !== filters.status) {
        return false;
      }
      if (filters.stage && filters.stage !== 'todos' && lead.etapa_codigo !== filters.stage) {
        return false;
      }
      if (filters.shift && filters.shift !== 'todos' && lead.turno_codigo !== filters.shift) {
        return false;
      }
      if (filters.origin && filters.origin !== 'todos' && lead.origem !== filters.origin) {
        return false;
      }
      if (filters.unassignedOnly) {
        const owner = String(lead.atendente || 'Aguardando atribuição').trim();
        if (owner !== 'Aguardando atribuição') {
          return false;
        }
      }
      if (leadIdsWithAttendance && leadIdsWithAttendance.has(lead.id)) {
        return false;
      }
      if (
        filters.attendant &&
        filters.attendant !== 'todos' &&
        !matchOwner(lead.atendente || 'Aguardando atribuição', filters.attendant)
      ) {
        return false;
      }
      if (!matchesPeriod(lead.criado_em, filters.period)) {
        return false;
      }

      if (searchRaw) {
        const respName = String(lead.nome_responsavel || '').toLowerCase();
        const studentName = String(lead.nome_aluno || '').toLowerCase();
        const email = String(lead.email || '').toLowerCase();
        const phoneDigits = normalizePhoneDigits(lead.telefone);

        const matchesText =
          respName.includes(searchRaw) ||
          studentName.includes(searchRaw) ||
          email.includes(searchRaw);
        const matchesPhone = searchDigits.length >= 2 && phoneDigits.includes(searchDigits);

        if (!matchesText && !matchesPhone) {
          return false;
        }
      }

      return true;
    });

    filtered.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

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
      allStoredCount: allLeads.length
    };
  }

  function getLeadById(id) {
    const allLeads = readLeadsFromStorage();
    const found = allLeads.find((lead) => lead.id === id);
    return found ? clone(found) : null;
  }

  function getStats(filters = {}) {
    const allLeads = readLeadsFromStorage();
    const scoped =
      filters && filters.attendant && filters.attendant !== 'todos'
        ? allLeads.filter((l) => matchOwner(l.atendente || 'Aguardando atribuição', filters.attendant))
        : allLeads;
    const total = scoped.length;
    const novos = scoped.filter((l) => l.status === 'novo').length;
    const emAtendimento = scoped.filter((l) =>
      ['em_contato', 'aguardando_retorno', 'visita_agendada'].includes(l.status)
    ).length;
    const aguardandoRetorno = scoped.filter((l) => l.status === 'aguardando_retorno').length;
    const concluidos = scoped.filter((l) => l.status === 'concluido').length;
    const perdidos = scoped.filter((l) => l.status === 'perdido').length;
    const semResponsavel = scoped.filter(
      (l) => !l.atendente || l.atendente === 'Aguardando atribuição'
    ).length;

    return { total, novos, emAtendimento, aguardandoRetorno, concluidos, perdidos, semResponsavel };
  }

  function generateNextId(existing) {
    const maxNum = existing.reduce((max, item) => {
      const m = String(item.id || '').match(/(\d+)$/);
      return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
    }, 1000);
    return `LD-${maxNum + 1}`;
  }

  function createLead(input, actorName = 'Equipe CRM (Demo)') {
    const allLeads = readLeadsFromStorage();
    const nowIso = new Date().toISOString();
    const id = generateNextId(allLeads);
    const hasConsent = Boolean(input.consentimento_contato);
    const assignedAttendant =
      String(input.atendente || '').trim() || actorName || 'Secretaria Demo';

    const newLead = {
      id,
      nome_responsavel: String(input.nome_responsavel || '').trim(),
      nome_aluno: String(input.nome_aluno || '').trim(),
      idade_aluno: input.idade_aluno ? Number(input.idade_aluno) : null,
      telefone: normalizePhoneDigits(input.telefone),
      email: String(input.email || '').trim().toLowerCase(),
      etapa_codigo: normalizeStageCode(String(input.etapa_codigo || 'fundamental_1')),
      turno_codigo: normalizeShiftCode(String(input.turno_codigo || 'nao_informado')),
      origem: normalizeOriginCode(String(input.origem || 'site')),
      status: 'novo',
      atendente: assignedAttendant,
      mensagem: String(input.mensagem || '').trim(),
      observacoes: String(input.observacoes || '').trim(),
      consentimento_contato: hasConsent,
      consentimento_em: hasConsent ? nowIso : null,
      visita_agendada_em: null,
      criado_em: nowIso,
      atualizado_em: nowIso,
      historico: [
        {
          id: `H-${id}-${Date.now()}`,
          tipo: 'cadastro',
          descricao: `Lead cadastrado manualmente via ${getOriginLabel(normalizeOriginCode(input.origem || 'site'))}.`,
          autor: actorName,
          criado_em: nowIso
        }
      ]
    };

    allLeads.unshift(newLead);
    writeLeadsToStorage(allLeads);
    return clone(newLead);
  }

  function updateLead(id, input, actorName = 'Equipe CRM (Demo)') {
    const allLeads = readLeadsFromStorage();
    const index = allLeads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const current = allLeads[index];
    const nowIso = new Date().toISOString();
    const hasConsent =
      input.consentimento_contato !== undefined
        ? Boolean(input.consentimento_contato)
        : current.consentimento_contato !== false;

    const nextStatus = input.status ? String(input.status) : current.status;
    const nextAttendant =
      input.atendente !== undefined && String(input.atendente).trim()
        ? String(input.atendente).trim()
        : current.atendente;

    const statusChangedText =
      nextStatus !== current.status
        ? ` Status atualizado para "${getStatusLabel(nextStatus)}".`
        : '';

    const updated = {
      ...current,
      nome_responsavel: String(input.nome_responsavel || current.nome_responsavel).trim(),
      nome_aluno: String(input.nome_aluno ?? current.nome_aluno ?? '').trim(),
      idade_aluno:
        input.idade_aluno !== undefined && input.idade_aluno !== '' && input.idade_aluno !== null
          ? Number(input.idade_aluno)
          : null,
      telefone: normalizePhoneDigits(input.telefone || current.telefone),
      email: String(input.email || current.email).trim().toLowerCase(),
      etapa_codigo: normalizeStageCode(String(input.etapa_codigo || current.etapa_codigo)),
      turno_codigo: normalizeShiftCode(String(input.turno_codigo || current.turno_codigo)),
      origem: normalizeOriginCode(String(input.origem || current.origem)),
      status: nextStatus,
      atendente: nextAttendant,
      mensagem: String(input.mensagem ?? current.mensagem ?? '').trim(),
      observacoes: String(input.observacoes ?? current.observacoes ?? '').trim(),
      consentimento_contato: hasConsent,
      consentimento_em: hasConsent ? current.consentimento_em || nowIso : null,
      atualizado_em: nowIso,
      historico: [
        {
          id: `H-${id}-${Date.now()}`,
          tipo: 'edicao',
          descricao: `Dados cadastrais do lead atualizados.${statusChangedText}`,
          autor: actorName,
          criado_em: nowIso
        },
        ...(Array.isArray(current.historico) ? current.historico : [])
      ]
    };

    allLeads[index] = updated;
    writeLeadsToStorage(allLeads);
    return clone(updated);
  }

  function deleteLead(id) {
    const allLeads = readLeadsFromStorage();
    const index = allLeads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const [removed] = allLeads.splice(index, 1);
    writeLeadsToStorage(allLeads);
    return clone(removed);
  }

  function changeLeadStatus(id, newStatus, actorName = 'Equipe CRM (Demo)') {
    const allLeads = readLeadsFromStorage();
    const index = allLeads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const current = allLeads[index];
    if (current.status === newStatus) return clone(current);

    const nowIso = new Date().toISOString();
    const oldLabel = getStatusLabel(current.status);
    const newLabel = getStatusLabel(newStatus);

    const updated = {
      ...current,
      status: newStatus,
      atualizado_em: nowIso,
      historico: [
        {
          id: `H-${id}-${Date.now()}`,
          tipo: 'status',
          descricao: `Status alterado de "${oldLabel}" para "${newLabel}".`,
          autor: actorName,
          criado_em: nowIso
        },
        ...(Array.isArray(current.historico) ? current.historico : [])
      ]
    };

    allLeads[index] = updated;
    writeLeadsToStorage(allLeads);
    return clone(updated);
  }

  function reassignLead(id, newAttendant, actorName = 'Coordenação Demo') {
    const cleanTarget = String(newAttendant || '').trim();
    if (!cleanTarget) return null;

    const allLeads = readLeadsFromStorage();
    const index = allLeads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const current = allLeads[index];
    const previousOwner = current.atendente || 'Aguardando atribuição';
    if (previousOwner === cleanTarget) return clone(current);

    const nowIso = new Date().toISOString();
    const updated = {
      ...current,
      atendente: cleanTarget,
      atualizado_em: nowIso,
      historico: [
        {
          id: `H-${id}-${Date.now()}`,
          tipo: 'atribuicao',
          descricao: `Responsável alterado de "${previousOwner}" para "${cleanTarget}".`,
          autor: actorName,
          criado_em: nowIso
        },
        ...(Array.isArray(current.historico) ? current.historico : [])
      ]
    };

    allLeads[index] = updated;
    writeLeadsToStorage(allLeads);
    return clone(updated);
  }

  function addLeadObservation(id, observationText, actorName = 'Equipe CRM (Demo)') {
    const cleanText = String(observationText || '').trim();
    if (!cleanText) return null;

    const allLeads = readLeadsFromStorage();
    const index = allLeads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const current = allLeads[index];
    const nowIso = new Date().toISOString();

    const updated = {
      ...current,
      observacoes: cleanText,
      atualizado_em: nowIso,
      historico: [
        {
          id: `H-${id}-${Date.now()}`,
          tipo: 'observacao',
          descricao: `Observação registrada: "${cleanText}"`,
          autor: actorName,
          criado_em: nowIso
        },
        ...(Array.isArray(current.historico) ? current.historico : [])
      ]
    };

    allLeads[index] = updated;
    writeLeadsToStorage(allLeads);
    return clone(updated);
  }

  function registerInteraction(id, channel, summaryText, actorName = 'Equipe CRM (Demo)') {
    const cleanSummary = String(summaryText || '').trim();
    const cleanChannel = String(channel || 'WhatsApp').trim();
    if (!cleanSummary) return null;

    const allLeads = readLeadsFromStorage();
    const index = allLeads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const current = allLeads[index];
    const nowIso = new Date().toISOString();
    const nextStatus = current.status === 'novo' ? 'em_contato' : current.status;

    const updated = {
      ...current,
      status: nextStatus,
      atendente:
        current.atendente && current.atendente !== 'Aguardando atribuição'
          ? current.atendente
          : actorName,
      atualizado_em: nowIso,
      historico: [
        {
          id: `H-${id}-${Date.now()}`,
          tipo: 'atendimento',
          descricao: `Atendimento via ${cleanChannel}: "${cleanSummary}"`,
          autor: actorName,
          criado_em: nowIso
        },
        ...(Array.isArray(current.historico) ? current.historico : [])
      ]
    };

    allLeads[index] = updated;
    writeLeadsToStorage(allLeads);
    return clone(updated);
  }

  function scheduleVisit(id, visitDateTime, noteText = '', actorName = 'Equipe CRM (Demo)') {
    const cleanDate = String(visitDateTime || '').trim();
    if (!cleanDate) return null;

    const parsedDate = new Date(cleanDate);
    if (Number.isNaN(parsedDate.getTime())) return null;

    const allLeads = readLeadsFromStorage();
    const index = allLeads.findIndex((lead) => lead.id === id);
    if (index === -1) return null;

    const current = allLeads[index];
    const nowIso = new Date().toISOString();
    const visitIso = parsedDate.toISOString();
    const cleanNote = String(noteText || '').trim();
    const formattedDate = `${String(parsedDate.getDate()).padStart(2, '0')}/${String(
      parsedDate.getMonth() + 1
    ).padStart(2, '0')}/${parsedDate.getFullYear()} ${String(parsedDate.getHours()).padStart(
      2,
      '0'
    )}:${String(parsedDate.getMinutes()).padStart(2, '0')}`;

    const updated = {
      ...current,
      status: 'visita_agendada',
      visita_agendada_em: visitIso,
      atualizado_em: nowIso,
      historico: [
        {
          id: `H-${id}-${Date.now()}`,
          tipo: 'visita',
          descricao: cleanNote
            ? `Visita agendada para ${formattedDate} (${cleanNote}).`
            : `Visita agendada para ${formattedDate}.`,
          autor: actorName,
          criado_em: nowIso
        },
        ...(Array.isArray(current.historico) ? current.historico : [])
      ]
    };

    allLeads[index] = updated;
    writeLeadsToStorage(allLeads);
    return clone(updated);
  }

  function clearAllDemoLeads() {
    writeLeadsToStorage([]);
  }

  function restoreDemoLeads() {
    const seeded = createSeedLeads();
    writeLeadsToStorage(seeded);
    return clone(seeded);
  }

  globalScope.EnsinaAiLeadsService = Object.freeze({
    STORAGE_KEY,
    CATALOGS,
    getStageLabel,
    getShiftLabel,
    getOriginLabel,
    getStatusLabel,
    normalizePhoneDigits,
    formatPhone,
    isValidBrazilianPhone,
    isValidEmail,
    listLeads,
    getLeadById,
    getStats,
    createLead,
    updateLead,
    deleteLead,
    changeLeadStatus,
    reassignLead,
    addLeadObservation,
    registerInteraction,
    scheduleVisit,
    clearAllDemoLeads,
    restoreDemoLeads
  });
})(window);
