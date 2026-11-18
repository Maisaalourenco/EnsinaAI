/**
 * ENSINA AÍ — CRM Escolar
 * Camada de Serviços de Atendimentos (js/crm/atendimentos-service.js)
 * Gerencia atendimentos, notas internas, próxima ação, linha do tempo e indicadores do atendente
 * com persistência local demonstrativa em localStorage.
 */

(function initCrmAtendimentosService(globalScope) {
  'use strict';

  const STORAGE_KEY = 'ensina_ai_crm_atendimentos_demo_v1';

  /**
   * ATENÇÃO: Catálogos e registros abaixo são dados demonstrativos locais (localStorage).
   * A integração definitiva com banco de dados e back-end será feita em etapa posterior.
   */
  const CATALOGS = Object.freeze({
    channels: [
      { codigo: 'whatsapp', label: 'WhatsApp' },
      { codigo: 'telefone', label: 'Telefone' },
      { codigo: 'email', label: 'E-mail' },
      { codigo: 'presencial', label: 'Presencial' },
      { codigo: 'outro', label: 'Outro' }
    ],
    statuses: [
      { codigo: 'pendente', label: 'Pendente' },
      { codigo: 'em_andamento', label: 'Em andamento' },
      { codigo: 'concluido', label: 'Concluído' },
      { codigo: 'cancelado', label: 'Cancelado' }
    ],
    attendants: [
      'Secretaria Demo',
      'Ana Paula Mendes (Demo)',
      'Rafael Costa (Demo)',
      'Coordenação Demo'
    ]
  });

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

  function normalizeChannelCode(code) {
    if (code === 'nota_interna') return 'outro';
    return code || 'whatsapp';
  }

  function normalizeStatusCode(code) {
    if (code === 'aguardando_retorno') return 'pendente';
    return code || 'pendente';
  }

  function getLabel(list, codigo, fallback = 'Não informado') {
    const found = list.find((item) => item.codigo === codigo);
    return found ? found.label : fallback;
  }

  function getChannelLabel(codigo) {
    if (codigo === 'nota_interna') return 'Nota interna';
    return getLabel(CATALOGS.channels, normalizeChannelCode(codigo));
  }

  function getStatusLabel(codigo) {
    return getLabel(CATALOGS.statuses, normalizeStatusCode(codigo));
  }

  function getLeadsService() {
    return globalScope.EnsinaAiLeadsService || null;
  }

  function resolveLeadSnapshot(leadId, fallback = {}) {
    const leadsSvc = getLeadsService();
    const liveLead = leadsSvc && typeof leadsSvc.getLeadById === 'function' ? leadsSvc.getLeadById(leadId) : null;

    if (liveLead) {
      return {
        lead_id: liveLead.id,
        nome_responsavel: liveLead.nome_responsavel || fallback.nome_responsavel || 'Responsável não informado',
        nome_aluno: liveLead.nome_aluno || fallback.nome_aluno || '',
        idade_aluno: liveLead.idade_aluno ?? fallback.idade_aluno ?? null,
        telefone: liveLead.telefone || fallback.telefone || '',
        email: liveLead.email || fallback.email || '',
        etapa_codigo: liveLead.etapa_codigo || fallback.etapa_codigo || 'fundamental_1',
        turno_codigo: liveLead.turno_codigo || fallback.turno_codigo || 'matutino',
        origem: liveLead.origem || fallback.origem || 'site'
      };
    }

    return {
      lead_id: leadId || fallback.lead_id || 'LD-0000',
      nome_responsavel: fallback.nome_responsavel || 'Responsável (Demo)',
      nome_aluno: fallback.nome_aluno || '',
      idade_aluno: fallback.idade_aluno ?? null,
      telefone: fallback.telefone || '',
      email: fallback.email || '',
      etapa_codigo: fallback.etapa_codigo || 'fundamental_1',
      turno_codigo: fallback.turno_codigo || 'matutino',
      origem: fallback.origem || 'site'
    };
  }

  function createSeedAtendimentos() {
    const seeds = [
      {
        id: 'ATD-2001',
        lead_id: 'LD-1001',
        nome_responsavel: 'Mariana Oliveira Lima',
        nome_aluno: 'Sofia Oliveira',
        idade_aluno: 7,
        telefone: '11987651001',
        email: 'mariana.oliveira@exemplo.com',
        etapa_codigo: 'fundamental_1',
        turno_codigo: 'matutino',
        origem: 'site',
        canal: 'whatsapp',
        responsavel_atendimento: 'Secretaria Demo',
        data_hora: isoOffsetDays(0, 9, 40),
        descricao: 'Contato inicial via WhatsApp para apresentar a proposta pedagógica do 2º ano e enviar calendário de visitas.',
        resultado: 'Família interessada em visita guiada nesta semana',
        proxima_acao: 'Confirmar horário de visita ao campus',
        observacoes: 'Família prefere visita no período da manhã.',
        data_retorno: isoOffsetDays(-1, 16, 0),
        status: 'em_andamento',
        ultima_atualizacao: isoOffsetDays(0, 10, 5),
        historico: [
          {
            id: 'HA-2001-2',
            tipo: 'whatsapp',
            titulo: 'Atendimento via WhatsApp',
            descricao: 'Enviado material institucional e disponibilidade de horários para o turno da manhã.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(0, 10, 5)
          },
          {
            id: 'HA-2001-1',
            tipo: 'registro',
            titulo: 'Atendimento aberto',
            descricao: 'Atendimento iniciado a partir do cadastro do lead LD-1001.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(0, 9, 40)
          }
        ]
      },
      {
        id: 'ATD-2002',
        lead_id: 'LD-1002',
        nome_responsavel: 'Eduardo Ferreira Santos',
        nome_aluno: 'Pedro Henrique Santos',
        idade_aluno: 4,
        telefone: '11976541002',
        email: 'eduardo.ferreira@exemplo.com',
        etapa_codigo: 'educacao_infantil',
        turno_codigo: 'integral',
        origem: 'whatsapp',
        canal: 'telefone',
        responsavel_atendimento: 'Ana Paula Mendes (Demo)',
        data_hora: isoOffsetDays(0, 11, 45),
        descricao: 'Ligação realizada para detalhar alimentação, rotina de descanso e valores do Período Integral.',
        resultado: 'Responsável vai alinhar decisão em família',
        proxima_acao: 'Retornar ligação para confirmar agendamento de visita',
        observacoes: 'Solicitou retorno após as 17h.',
        data_retorno: isoOffsetDays(-2, 14, 0),
        status: 'pendente',
        ultima_atualizacao: isoOffsetDays(0, 12, 10),
        historico: [
          {
            id: 'HA-2002-2',
            tipo: 'nota_interna',
            titulo: 'Nota interna',
            descricao: 'Responsável solicitou que o próximo contato seja após as 17h.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(0, 12, 10)
          },
          {
            id: 'HA-2002-1',
            tipo: 'telefone',
            titulo: 'Ligação telefônica',
            descricao: 'Apresentada grade horária do Período Integral para Educação Infantil.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(0, 11, 45)
          }
        ]
      },
      {
        id: 'ATD-2003',
        lead_id: 'LD-1003',
        nome_responsavel: 'Patricia Souza Almeida',
        nome_aluno: 'Helena Souza',
        idade_aluno: 1,
        telefone: '11991231003',
        email: 'patricia.souza@exemplo.com',
        etapa_codigo: 'infantil_1',
        turno_codigo: 'matutino',
        origem: 'instagram',
        canal: 'presencial',
        responsavel_atendimento: 'Secretaria Demo',
        data_hora: isoOffsetDays(-1, 15, 0),
        descricao: 'Acolhimento presencial com os pais para visitação ao berçário e apresentação da equipe de enfermagem e nutrição.',
        resultado: 'Visita confirmada e elogio à estrutura do berçário',
        proxima_acao: 'Enviar lista de documentos para efetivação de matrícula',
        data_retorno: isoOffsetDays(1, 10, 0),
        status: 'em_andamento',
        ultima_atualizacao: isoOffsetDays(-1, 16, 15),
        historico: [
          {
            id: 'HA-2003-2',
            tipo: 'presencial',
            titulo: 'Visita presencial acompanhada',
            descricao: 'Pais conheceram o espaço de estimulação e lactário.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(-1, 16, 15)
          },
          {
            id: 'HA-2003-1',
            tipo: 'whatsapp',
            titulo: 'Confirmação prévia',
            descricao: 'Lembrete de visita enviado por WhatsApp.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(-1, 15, 0)
          }
        ]
      },
      {
        id: 'ATD-2004',
        lead_id: 'LD-1004',
        nome_responsavel: 'Ricardo Nogueira Silva',
        nome_aluno: 'Matheus Silva',
        idade_aluno: 15,
        telefone: '11982341004',
        email: 'ricardo.nogueira@exemplo.com',
        etapa_codigo: 'medio',
        turno_codigo: 'matutino',
        origem: 'site',
        canal: 'email',
        responsavel_atendimento: 'Rafael Costa (Demo)',
        data_hora: isoOffsetDays(-2, 16, 30),
        descricao: 'Envio por e-mail da matriz curricular do Ensino Médio, cronograma de simulados e projetos de orientação profissional.',
        resultado: 'Material recebido; aguardando confirmação de leitura',
        proxima_acao: 'Fazer follow-up via WhatsApp sobre o plano de estudos',
        data_retorno: isoOffsetDays(-1, 11, 0),
        status: 'pendente',
        observacoes: 'Responsável avaliando cronograma de simulados.',
        ultima_atualizacao: isoOffsetDays(-2, 16, 45),
        historico: [
          {
            id: 'HA-2004-1',
            tipo: 'email',
            titulo: 'Envio de proposta pedagógica',
            descricao: 'Encaminhado PDF com matriz curricular do Ensino Médio.',
            autor: 'Rafael Costa (Demo)',
            criado_em: isoOffsetDays(-2, 16, 30)
          }
        ]
      },
      {
        id: 'ATD-2005',
        lead_id: 'LD-1005',
        nome_responsavel: 'Camila Andrade Ribeiro',
        nome_aluno: 'Lucas Andrade',
        idade_aluno: 12,
        telefone: '11993451005',
        email: 'camila.andrade@exemplo.com',
        etapa_codigo: 'fundamental_2',
        turno_codigo: 'vespertino',
        origem: 'presencial',
        canal: 'presencial',
        responsavel_atendimento: 'Ana Paula Mendes (Demo)',
        data_hora: isoOffsetDays(-3, 10, 30),
        descricao: 'Atendimento conclusivo na secretaria para conferência de histórico escolar e assinatura de contrato de matrícula.',
        resultado: 'Matrícula efetivada',
        proxima_acao: 'Nenhuma pendência operacional',
        data_retorno: '',
        status: 'concluido',
        ultima_atualizacao: isoOffsetDays(-3, 11, 20),
        historico: [
          {
            id: 'HA-2005-2',
            tipo: 'status',
            titulo: 'Atendimento concluído',
            descricao: 'Documentação conferida e matrícula registrada pela secretaria.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-3, 11, 20)
          },
          {
            id: 'HA-2005-1',
            tipo: 'presencial',
            titulo: 'Recepção na secretaria',
            descricao: 'Responsável compareceu com documentos originais do aluno.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-3, 10, 30)
          }
        ]
      },
      {
        id: 'ATD-2006',
        lead_id: 'LD-1006',
        nome_responsavel: 'Juliana Martins Pereira',
        nome_aluno: 'Beatriz Martins',
        idade_aluno: 9,
        telefone: '11984561006',
        email: 'juliana.martins@exemplo.com',
        etapa_codigo: 'fundamental_1',
        turno_codigo: 'integral',
        origem: 'whatsapp',
        canal: 'whatsapp',
        responsavel_atendimento: 'Secretaria Demo',
        data_hora: isoOffsetDays(-4, 15, 50),
        descricao: 'Conversa pelo WhatsApp sobre rotas de transporte escolar parceiro e horários de entrada e saída.',
        resultado: 'Aguardando contato com empresa de transporte indicada',
        proxima_acao: 'Confirmar se a rota atende o endereço da família',
        observacoes: 'Enviar telefones das duas linhas de transporte escolar.',
        data_retorno: isoOffsetDays(2, 14, 30),
        status: 'pendente',
        ultima_atualizacao: isoOffsetDays(-4, 16, 15),
        historico: [
          {
            id: 'HA-2006-1',
            tipo: 'whatsapp',
            titulo: 'Atendimento via WhatsApp',
            descricao: 'Compartilhados contatos de vans credenciadas que atendem a região.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(-4, 15, 50)
          }
        ]
      },
      {
        id: 'ATD-2007',
        lead_id: 'LD-1008',
        nome_responsavel: 'Larissa Campos Melo',
        nome_aluno: 'Davi Campos',
        idade_aluno: 3,
        telefone: '11976781008',
        email: 'larissa.campos@exemplo.com',
        etapa_codigo: 'educacao_infantil',
        turno_codigo: 'tarde',
        origem: 'instagram',
        canal: 'outro',
        responsavel_atendimento: 'Ana Paula Mendes (Demo)',
        data_hora: isoOffsetDays(-5, 14, 0),
        descricao: 'Alinhamento via aplicativo escolar com coordenação da Educação Infantil para preparar sala modelo durante a visita.',
        resultado: 'Sala e equipe pedagógica reservadas para visita',
        proxima_acao: 'Recepcionar família na visita guiada',
        observacoes: 'Confirmar presença da coordenadora pedagógica.',
        data_retorno: isoOffsetDays(1, 15, 0),
        status: 'em_andamento',
        ultima_atualizacao: isoOffsetDays(-5, 14, 10),
        historico: [
          {
            id: 'HA-2007-1',
            tipo: 'nota_interna',
            titulo: 'Nota interna',
            descricao: 'Coordenação confirmou disponibilidade para acolher os pais na sexta-feira.',
            autor: 'Ana Paula Mendes (Demo)',
            criado_em: isoOffsetDays(-5, 14, 0)
          }
        ]
      },
      {
        id: 'ATD-2008',
        lead_id: 'LD-1010',
        nome_responsavel: 'Renata Azevedo Gomes',
        nome_aluno: 'Rafael Gomes',
        idade_aluno: 6,
        telefone: '11998901010',
        email: 'renata.azevedo@exemplo.com',
        etapa_codigo: 'fundamental_1',
        turno_codigo: 'vespertino',
        origem: 'whatsapp',
        canal: 'whatsapp',
        responsavel_atendimento: 'Secretaria Demo',
        data_hora: isoOffsetDays(-8, 11, 20),
        descricao: 'Acompanhamento pós-visita e envio de guia de matrícula com confirmação de vaga no 1º ano.',
        resultado: 'Matrícula confirmada após visita',
        proxima_acao: 'Enviar mensagem de boas-vindas',
        data_retorno: '',
        status: 'concluido',
        ultima_atualizacao: isoOffsetDays(-8, 13, 0),
        historico: [
          {
            id: 'HA-2008-1',
            tipo: 'whatsapp',
            titulo: 'Confirmação de matrícula',
            descricao: 'Família confirmou adesão ao turno vespertino.',
            autor: 'Secretaria Demo',
            criado_em: isoOffsetDays(-8, 11, 20)
          }
        ]
      },
      {
        id: 'ATD-2009',
        lead_id: 'LD-1011',
        nome_responsavel: 'Gustavo Teixeira Dias',
        nome_aluno: 'Laura Dias',
        idade_aluno: 14,
        telefone: '11989011011',
        email: 'gustavo.teixeira@exemplo.com',
        etapa_codigo: 'fundamental_2',
        turno_codigo: 'matutino',
        origem: 'site',
        canal: 'telefone',
        responsavel_atendimento: 'Rafael Costa (Demo)',
        data_hora: isoOffsetDays(-12, 17, 15),
        descricao: 'Contato telefônico com o pai para verificar disponibilidade de visita no 9º ano.',
        resultado: 'Pai pediu retorno na próxima semana por viagem a trabalho',
        proxima_acao: 'Ligar novamente para fechar horário de visita',
        observacoes: 'Pai retornará de viagem na próxima segunda-feira.',
        data_retorno: isoOffsetDays(-3, 9, 30),
        status: 'pendente',
        ultima_atualizacao: isoOffsetDays(-12, 17, 30),
        historico: [
          {
            id: 'HA-2009-1',
            tipo: 'telefone',
            titulo: 'Ligação realizada',
            descricao: 'Conversa breve; família interessada em transferência para o próximo semestre.',
            autor: 'Rafael Costa (Demo)',
            criado_em: isoOffsetDays(-12, 17, 15)
          }
        ]
      },
      {
        id: 'ATD-2010',
        lead_id: 'LD-1012',
        nome_responsavel: 'Vanessa Cardoso Pinto',
        nome_aluno: 'Enzo Cardoso',
        idade_aluno: 2,
        telefone: '11970121012',
        email: 'vanessa.cardoso@exemplo.com',
        etapa_codigo: 'infantil_2_5',
        turno_codigo: 'integral',
        origem: 'presencial',
        canal: 'presencial',
        responsavel_atendimento: 'Coordenação Demo',
        data_hora: isoOffsetDays(-19, 10, 45),
        descricao: 'Atendimento presencial pela coordenação com apresentação completa do projeto bilíngue e contrato finalizado.',
        resultado: 'Matrícula realizada no atendimento presencial',
        proxima_acao: 'Concluído — integrar à agenda de adaptação',
        data_retorno: '',
        status: 'concluido',
        ultima_atualizacao: isoOffsetDays(-19, 12, 0),
        historico: [
          {
            id: 'HA-2010-1',
            tipo: 'presencial',
            titulo: 'Atendimento concluído',
            descricao: 'Matrícula formalizada no mesmo dia da visita.',
            autor: 'Coordenação Demo',
            criado_em: isoOffsetDays(-19, 10, 45)
          }
        ]
      }
    ];

    return seeds;
  }

  function normalizeAtendimentoRecord(item) {
    if (!item || typeof item !== 'object') return null;
    const snap = resolveLeadSnapshot(item.lead_id, item);
    return {
      ...snap,
      id: String(item.id || ''),
      nome_responsavel: String(item.nome_responsavel || snap.nome_responsavel).trim(),
      nome_aluno: String(item.nome_aluno ?? snap.nome_aluno ?? '').trim(),
      canal: normalizeChannelCode(String(item.canal || 'whatsapp')),
      responsavel_atendimento: String(item.responsavel_atendimento || 'Secretaria Demo'),
      data_hora: item.data_hora || new Date().toISOString(),
      descricao: String(item.descricao || '').trim(),
      resultado: String(item.resultado || '').trim(),
      proxima_acao: String(item.proxima_acao || '').trim(),
      observacoes: String(item.observacoes || '').trim(),
      data_retorno: item.data_retorno || '',
      status: normalizeStatusCode(String(item.status || 'pendente')),
      ultima_atualizacao: item.ultima_atualizacao || item.data_hora || new Date().toISOString(),
      historico: Array.isArray(item.historico) ? item.historico : []
    };
  }

  function readFromStorage() {
    try {
      const raw = globalScope.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        const seeded = createSeedAtendimentos();
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeAtendimentoRecord).filter(Boolean) : [];
    } catch {
      return createSeedAtendimentos();
    }
  }

  function writeToStorage(items) {
    try {
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sem impacto caso localStorage esteja bloqueado
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

  function isReturnOverdue(item) {
    if (!item || !item.data_retorno) return false;
    if (item.status === 'concluido' || item.status === 'cancelado') return false;
    const returnDate = new Date(item.data_retorno);
    if (Number.isNaN(returnDate.getTime())) return false;
    return returnDate.getTime() < Date.now();
  }

  function getLeadOptions() {
    const leadsSvc = getLeadsService();
    if (leadsSvc && typeof leadsSvc.listLeads === 'function') {
      const res = leadsSvc.listLeads({ page: 1, pageSize: 500 });
      return (res.items || []).map((l) => ({
        id: l.id,
        label: `${l.id} — ${l.nome_responsavel}${l.nome_aluno ? ` (Aluno: ${l.nome_aluno})` : ''}`
      }));
    }
    const existing = readFromStorage();
    const map = new Map();
    existing.forEach((a) => {
      if (!map.has(a.lead_id)) {
        map.set(a.lead_id, {
          id: a.lead_id,
          label: `${a.lead_id} — ${a.nome_responsavel}`
        });
      }
    });
    return Array.from(map.values());
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

  function listAtendimentos(filters = {}) {
    const all = readFromStorage();
    const searchRaw = String(filters.search || '').trim().toLowerCase();
    const searchDigits = searchRaw.replace(/\D/g, '');

    const filtered = all.filter((item) => {
      if (filters.leadId && item.lead_id !== filters.leadId) {
        return false;
      }
      if (filters.status && filters.status !== 'todos' && item.status !== filters.status) {
        return false;
      }
      if (filters.channel && filters.channel !== 'todos' && item.canal !== filters.channel) {
        return false;
      }
      if (
        filters.attendant &&
        filters.attendant !== 'todos' &&
        !matchOwner(item.responsavel_atendimento, filters.attendant)
      ) {
        return false;
      }
      if (!matchesPeriod(item.data_hora, filters.period)) {
        return false;
      }

      if (searchRaw) {
        const hay = [
          item.id,
          item.lead_id,
          item.nome_responsavel,
          item.nome_aluno,
          item.responsavel_atendimento,
          item.descricao,
          item.proxima_acao,
          item.resultado,
          item.observacoes,
          item.email
        ]
          .join(' ')
          .toLowerCase();
        const phoneDigits = String(item.telefone || '').replace(/\D/g, '');
        const matchesText = hay.includes(searchRaw);
        const matchesPhone = searchDigits.length >= 3 && phoneDigits.includes(searchDigits);
        if (!matchesText && !matchesPhone) {
          return false;
        }
      }

      return true;
    });

    filtered.sort((a, b) => new Date(b.ultima_atualizacao).getTime() - new Date(a.ultima_atualizacao).getTime());

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
        ? all.filter((a) => matchOwner(a.responsavel_atendimento, filters.attendant))
        : all;
    const total = scoped.length;
    const realizadosHoje = scoped.filter((a) => matchesPeriod(a.data_hora, 'hoje')).length;
    const pendentes = scoped.filter((a) => a.status === 'pendente').length;
    const emAndamento = scoped.filter((a) => a.status === 'em_andamento').length;
    const concluidos = scoped.filter((a) => a.status === 'concluido').length;

    return { total, realizadosHoje, pendentes, emAndamento, concluidos };
  }

  function getAttendantSummary(attendantName, session = { role: 'gestor', roleLabel: 'Gestor Escolar' }) {
    const all = readFromStorage();
    const targetName = String(attendantName || 'Secretaria Demo').trim();
    const myAtendimentos = all.filter((a) => a.responsavel_atendimento === targetName);

    const leadsSvc = getLeadsService();
    let leadsResponsavel = 0;
    let visitasAgendadas = 0;

    if (leadsSvc && typeof leadsSvc.listLeads === 'function') {
      const allLeads = leadsSvc.listLeads({ page: 1, pageSize: 500 }).items || [];
      const matchingLeads = allLeads.filter((l) => {
        const atendente = String(l.atendente || '');
        return atendente === targetName || atendente.startsWith(targetName);
      });
      leadsResponsavel = matchingLeads.length;
      visitasAgendadas = matchingLeads.filter((l) => l.status === 'visita_agendada').length;
    } else {
      const leadIds = new Set(myAtendimentos.map((a) => a.lead_id));
      leadsResponsavel = leadIds.size;
    }

    // Somar atendimentos presenciais programados se não contabilizados
    const presencialEmAberto = myAtendimentos.filter(
      (a) => a.canal === 'presencial' && a.status !== 'concluido' && a.status !== 'cancelado'
    ).length;
    if (visitasAgendadas === 0 && presencialEmAberto > 0) {
      visitasAgendadas = presencialEmAberto;
    }

    const atendimentosRealizados = myAtendimentos.length;
    const atendimentosPendentes = myAtendimentos.filter((a) =>
      ['em_andamento', 'pendente'].includes(a.status)
    ).length;
    const retornosAtrasados = myAtendimentos.filter((a) => isReturnOverdue(a)).length;

    const recentEvents = [];
    myAtendimentos.forEach((atd) => {
      (atd.historico || []).forEach((h) => {
        recentEvents.push({
          atendimentoId: atd.id,
          leadId: atd.lead_id,
          responsavelLead: atd.nome_responsavel,
          titulo: h.titulo || getChannelLabel(h.tipo),
          descricao: h.descricao,
          criado_em: h.criado_em
        });
      });
    });

    recentEvents.sort((a, b) => new Date(b.criado_em).getTime() - new Date(a.criado_em).getTime());

    return {
      attendantName: targetName,
      leadsResponsavel,
      atendimentosRealizados,
      atendimentosPendentes,
      retornosAtrasados,
      visitasAgendadas,
      ultimasAtividades: recentEvents.slice(0, 5),
      permissionContext: {
        role: session.role || 'gestor',
        roleLabel: session.roleLabel || 'Gestor Escolar',
        canSelectOtherAttendants: session.role !== 'atendente'
      }
    };
  }

  function getAtendimentoById(id) {
    const all = readFromStorage();
    const found = all.find((item) => item.id === id);
    return found ? clone(found) : null;
  }

  function generateNextId(existing) {
    const maxNum = existing.reduce((max, item) => {
      const m = String(item.id || '').match(/(\d+)$/);
      return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
    }, 2000);
    return `ATD-${maxNum + 1}`;
  }

  function toIsoSafe(raw) {
    if (!raw) return new Date().toISOString();
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
  }

  function buildDateTimeIso(input) {
    if (input.data && input.horario) {
      return toIsoSafe(`${input.data}T${input.horario}`);
    }
    if (input.data) {
      return toIsoSafe(`${input.data}T10:00`);
    }
    return toIsoSafe(input.data_hora);
  }

  function createAtendimento(input, actorName = 'Equipe CRM (Demo)') {
    const all = readFromStorage();
    const nowIso = new Date().toISOString();
    const id = generateNextId(all);
    const leadSnap = resolveLeadSnapshot(input.lead_id);
    const channel = normalizeChannelCode(String(input.canal || 'whatsapp'));
    const status = normalizeStatusCode(String(input.status || 'pendente'));
    const attendant = String(input.responsavel_atendimento || actorName || 'Secretaria Demo').trim();
    const eventIso = buildDateTimeIso(input);

    const newItem = {
      ...leadSnap,
      id,
      nome_responsavel: String(input.nome_responsavel || leadSnap.nome_responsavel).trim(),
      nome_aluno: String(input.nome_aluno ?? leadSnap.nome_aluno ?? '').trim(),
      canal: channel,
      responsavel_atendimento: attendant,
      data_hora: eventIso,
      descricao: String(input.descricao || '').trim(),
      resultado: String(input.resultado || '').trim(),
      proxima_acao: String(input.proxima_acao || '').trim(),
      observacoes: String(input.observacoes || '').trim(),
      data_retorno: input.data_retorno ? toIsoSafe(input.data_retorno) : '',
      status,
      ultima_atualizacao: nowIso,
      historico: [
        {
          id: `HA-${id}-${Date.now()}`,
          tipo: channel,
          titulo: `Atendimento via ${getChannelLabel(channel)}`,
          descricao: String(input.descricao || '').trim(),
          autor: attendant,
          criado_em: nowIso
        }
      ]
    };

    all.unshift(newItem);
    writeToStorage(all);
    return clone(newItem);
  }

  function updateAtendimento(id, input, actorName = 'Equipe CRM (Demo)') {
    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const nowIso = new Date().toISOString();
    const targetLeadId = input.lead_id || current.lead_id;
    const leadSnap = resolveLeadSnapshot(targetLeadId, current);
    const channel = normalizeChannelCode(String(input.canal || current.canal));
    const status = normalizeStatusCode(String(input.status || current.status));
    const hasSplitDate = Boolean(input.data);
    const eventIso = hasSplitDate
      ? buildDateTimeIso(input)
      : input.data_hora
        ? toIsoSafe(input.data_hora)
        : current.data_hora;

    const updated = {
      ...current,
      ...leadSnap,
      nome_responsavel: String(input.nome_responsavel || leadSnap.nome_responsavel || current.nome_responsavel).trim(),
      nome_aluno: String(input.nome_aluno ?? leadSnap.nome_aluno ?? current.nome_aluno ?? '').trim(),
      canal: channel,
      responsavel_atendimento: String(
        input.responsavel_atendimento || current.responsavel_atendimento
      ).trim(),
      data_hora: eventIso,
      descricao: String(input.descricao ?? current.descricao).trim(),
      resultado: String(input.resultado ?? current.resultado ?? '').trim(),
      proxima_acao: String(input.proxima_acao ?? current.proxima_acao ?? '').trim(),
      observacoes: String(input.observacoes ?? current.observacoes ?? '').trim(),
      data_retorno:
        input.data_retorno !== undefined
          ? input.data_retorno
            ? toIsoSafe(input.data_retorno)
            : ''
          : current.data_retorno,
      status,
      ultima_atualizacao: nowIso,
      historico: [
        {
          id: `HA-${id}-${Date.now()}`,
          tipo: 'edicao',
          titulo: 'Atendimento atualizado',
          descricao: `Registro editado (${getChannelLabel(channel)} • ${getStatusLabel(status)}).`,
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

  function addInternalNote(id, noteText, actorName = 'Equipe CRM (Demo)') {
    const cleanNote = String(noteText || '').trim();
    if (!cleanNote) return null;

    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const nowIso = new Date().toISOString();

    const updated = {
      ...current,
      ultima_atualizacao: nowIso,
      historico: [
        {
          id: `HA-${id}-${Date.now()}`,
          tipo: 'nota_interna',
          titulo: 'Nota interna',
          descricao: cleanNote,
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

  function changeAtendimentoStatus(id, newStatus, actorName = 'Equipe CRM (Demo)') {
    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const normalizedNext = normalizeStatusCode(newStatus);
    if (current.status === normalizedNext) return clone(current);

    const nowIso = new Date().toISOString();
    const oldLabel = getStatusLabel(current.status);
    const newLabel = getStatusLabel(normalizedNext);

    const updated = {
      ...current,
      status: normalizedNext,
      ultima_atualizacao: nowIso,
      historico: [
        {
          id: `HA-${id}-${Date.now()}`,
          tipo: 'status',
          titulo: 'Alteração de status',
          descricao: `Status alterado de "${oldLabel}" para "${newLabel}".`,
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

  function updateNextAction(id, nextAction, returnDate = '', actorName = 'Equipe CRM (Demo)') {
    const cleanAction = String(nextAction || '').trim();
    if (!cleanAction) return null;

    const all = readFromStorage();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const nowIso = new Date().toISOString();
    const resolvedReturn = returnDate ? toIsoSafe(returnDate) : '';

    const updated = {
      ...current,
      proxima_acao: cleanAction,
      data_retorno: resolvedReturn,
      ultima_atualizacao: nowIso,
      historico: [
        {
          id: `HA-${id}-${Date.now()}`,
          tipo: 'proxima_acao',
          titulo: 'Próxima ação definida',
          descricao: resolvedReturn
            ? `${cleanAction} (retorno previsto para ${new Date(resolvedReturn).toLocaleDateString('pt-BR')}).`
            : cleanAction,
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

  function restoreDemoAtendimentos() {
    const seeded = createSeedAtendimentos();
    writeToStorage(seeded);
    return clone(seeded);
  }

  globalScope.EnsinaAiAtendimentosService = Object.freeze({
    STORAGE_KEY,
    CATALOGS,
    getChannelLabel,
    getStatusLabel,
    getLeadOptions,
    isReturnOverdue,
    listAtendimentos,
    getStats,
    getAttendantSummary,
    getAtendimentoById,
    createAtendimento,
    updateAtendimento,
    addInternalNote,
    changeAtendimentoStatus,
    updateNextAction,
    restoreDemoAtendimentos
  });
})(window);
