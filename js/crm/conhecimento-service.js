/**
 * ENSINA AÍ — CRM Escolar
 * Camada de Serviços da Base de Conhecimento (js/crm/conhecimento-service.js)
 * Gerencia artigos e orientações internas demonstrativas em localStorage.
 */

(function initCrmConhecimentoService(globalScope) {
  'use strict';

  const STORAGE_KEY = 'ensina_ai_crm_conhecimento_demo_v1';

  /**
   * ATENÇÃO: Artigos e categorias abaixo são conteúdos demonstrativos locais (localStorage).
   */
  const CATALOGS = Object.freeze({
    categories: [
      { codigo: 'atendimento', label: 'Atendimento' },
      { codigo: 'matriculas', label: 'Matrículas' },
      { codigo: 'processos_escolares', label: 'Processos escolares' },
      { codigo: 'comunicacao', label: 'Comunicação' },
      { codigo: 'orientacoes_gerais', label: 'Orientações gerais' }
    ],
    authors: [
      'Coordenação Pedagógica (Demo)',
      'Secretaria Escolar (Demo)',
      'Direção Administrativa (Demo)',
      'Ana Paula Mendes (Demo)'
    ]
  });

  function isoDaysAgo(daysAgo, hours = 10, minutes = 0) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    d.setHours(hours, minutes, 0, 0);
    return d.toISOString();
  }

  function createSeedArticles() {
    return [
      {
        id: 'ART-001',
        titulo: 'Roteiro de Primeiro Atendimento via WhatsApp e Telefone',
        categoria: 'atendimento',
        resumo: 'Passo a passo acolhedor para receber famílias interessadas, identificar a etapa escolar e agendar visita ao campus.',
        conteudo:
          '1. Cumprimente o responsável pelo nome e confirme a etapa de ensino desejada (Educação Infantil, Fundamental ou Médio).\n' +
          '2. Pergunte a idade do estudante e o turno de preferência (Manhã, Tarde ou Integral).\n' +
          '3. Apresente brevemente os diferenciais pedagógicos da série e convide para uma visita presencial guiada.\n' +
          '4. Registre imediatamente o retorno esperado e a próxima ação no módulo de Atendimentos.',
        autor: 'Secretaria Escolar (Demo)',
        atualizado_em: isoDaysAgo(1, 14, 20)
      },
      {
        id: 'ART-002',
        titulo: 'Documentação Obrigatória e Fluxo de Matrícula',
        categoria: 'matriculas',
        resumo: 'Checklist completo de documentos do aluno e dos responsáveis financeiros para efetivação da matrícula escolar.',
        conteudo:
          'Documentos do estudante:\n' +
          '- Certidão de nascimento ou RG; CPF do aluno;\n' +
          '- Cartão de vacinação atualizado (para Educação Infantil e Fundamental I);\n' +
          '- Declaração de escolaridade ou Histórico Escolar (para transferências).\n\n' +
          'Documentos do responsável:\n' +
          '- RG, CPF e comprovante de residência atualizado;\n' +
          '- Assinatura do termo de matrícula na secretaria após conferência completa.',
        autor: 'Secretaria Escolar (Demo)',
        atualizado_em: isoDaysAgo(2, 11, 10)
      },
      {
        id: 'ART-003',
        titulo: 'Protocolo de Acolhimento em Visitas Guiadas ao Campus',
        categoria: 'processos_escolares',
        resumo: 'Orientações de recepção, roteiro de salas e condução pedagógica durante visitas agendadas das famílias.',
        conteudo:
          '1. Confirme a visita com 24h de antecedência pelo módulo de Visitas.\n' +
          '2. Prepare a pasta institucional com proposta pedagógica da série de interesse.\n' +
          '3. Percorra recepção, salas de aula, biblioteca, pátio e espaços de convivência respeitando o horário das turmas.\n' +
          '4. Ao término, registre se a visita foi realizada, observações da família e crie uma tarefa de retorno em até 48h.',
        autor: 'Coordenação Pedagógica (Demo)',
        atualizado_em: isoDaysAgo(3, 16, 0)
      },
      {
        id: 'ART-004',
        titulo: 'Modelos de Mensagens de Retorno para Famílias em Negociação',
        categoria: 'comunicacao',
        resumo: 'Textos padronizados e empáticos para follow-up após envio de proposta ou realização de visita escolar.',
        conteudo:
          'Modelo pós-visita:\n' +
          '"Olá, [Nome]! Foi uma alegria receber sua família no ENSINA AÍ. Ficou alguma dúvida sobre a rotina ou proposta pedagógica para [Nome do Aluno]? Seguimos à disposição."\n\n' +
          'Modelo de retomada:\n' +
          '"Olá, [Nome]! Passando para confirmar se conseguiram avaliar as opções de turno para o próximo semestre. Posso auxiliar com algum detalhe?"',
        autor: 'Ana Paula Mendes (Demo)',
        atualizado_em: isoDaysAgo(4, 9, 45)
      },
      {
        id: 'ART-005',
        titulo: 'Boas Práticas de Registro no CRM e Cuidado com Dados (LGPD)',
        categoria: 'orientacoes_gerais',
        resumo: 'Diretrizes internas para preenchimento objetivo, ético e padronizado de observações nos perfis das famílias.',
        conteudo:
          '- Utilize linguagem respeitosa e estritamente profissional nas observações internas.\n' +
          '- Confirme se o consentimento de contato foi marcado ao cadastrar novos interessados.\n' +
          '- Mantenha telefone e e-mail atualizados para evitar contatos duplicados pela equipe.\n' +
          '- Nunca compartilhe dados de famílias em canais externos não oficiais da escola.',
        autor: 'Direção Administrativa (Demo)',
        atualizado_em: isoDaysAgo(5, 15, 30)
      },
      {
        id: 'ART-006',
        titulo: 'Critérios Demonstrativos para Desconto de Irmãos e Transferências',
        categoria: 'matriculas',
        resumo: 'Referência rápida para a secretaria responder dúvidas iniciais sobre condições especiais entre irmãos.',
        conteudo:
          'As condições comerciais demonstrativas prevêem avaliação de desconto progressivo a partir do segundo filho matriculado simultaneamente na instituição.\n' +
          'Para famílias oriundas de transferência no meio do ano letivo, agendar conversa com a Coordenação Pedagógica para análise de adaptação curricular antes do fechamento.',
        autor: 'Direção Administrativa (Demo)',
        atualizado_em: isoDaysAgo(7, 10, 15)
      },
      {
        id: 'ART-007',
        titulo: 'Calendário de Adaptação e Reuniões de Acolhimento',
        categoria: 'processos_escolares',
        resumo: 'Como explicar às novas famílias o período gradual de adaptação na Educação Infantil e Anos Iniciais.',
        conteudo:
          'O período de adaptação ocorre nas duas primeiras semanas letivas com acompanhamento próximo da coordenação e da professora regente.\n' +
          'Na primeira semana, os horários podem ser gradativos conforme a faixa etária da criança, garantindo segurança emocional e vínculo com a turma.',
        autor: 'Coordenação Pedagógica (Demo)',
        atualizado_em: isoDaysAgo(9, 13, 40)
      },
      {
        id: 'ART-008',
        titulo: 'Guia de Respostas Rápidas sobre o Período Integral',
        categoria: 'atendimento',
        resumo: 'Principais perguntas dos pais sobre alimentação, oficinas contraturno, repouso e horários estendidos.',
        conteudo:
          'O Período Integral atende estudantes da Educação Infantil ao Ensino Fundamental I com grade complementar de oficinas culturais, esportivas e apoio às tarefas.\n' +
          'O cardápio é elaborado por nutricionista e encaminhado mensalmente aos responsáveis. As famílias podem optar pela modalidade completa ou parcial conforme disponibilidade da turma.',
        autor: 'Ana Paula Mendes (Demo)',
        atualizado_em: isoDaysAgo(12, 17, 0)
      }
    ];
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeCategory(codigo) {
    const valid = CATALOGS.categories.some((c) => c.codigo === codigo);
    return valid ? codigo : 'orientacoes_gerais';
  }

  function getCategoryLabel(codigo) {
    const found = CATALOGS.categories.find((c) => c.codigo === codigo);
    return found ? found.label : 'Orientações gerais';
  }

  function normalizeArticle(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const titulo = String(raw.titulo || '').trim();
    if (!titulo) return null;
    return {
      id: String(raw.id || ''),
      titulo,
      categoria: normalizeCategory(raw.categoria),
      resumo: String(raw.resumo || '').trim(),
      conteudo: String(raw.conteudo || '').trim(),
      autor: String(raw.autor || 'Secretaria Escolar (Demo)').trim(),
      atualizado_em: raw.atualizado_em || new Date().toISOString()
    };
  }

  function readFromStorage() {
    try {
      const raw = globalScope.localStorage.getItem(STORAGE_KEY);
      if (raw === null) {
        const seeded = createSeedArticles();
        globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
        return seeded;
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(normalizeArticle).filter(Boolean) : [];
    } catch {
      return createSeedArticles();
    }
  }

  function writeToStorage(items) {
    try {
      globalScope.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Sem impacto caso localStorage esteja bloqueado
    }
  }

  function listArticles(filters = {}) {
    const all = readFromStorage();
    const searchRaw = String(filters.search || '').trim().toLowerCase();
    const category = filters.category || 'todos';

    const filtered = all.filter((art) => {
      if (category !== 'todos' && art.categoria !== category) {
        return false;
      }
      if (searchRaw) {
        const hay = [art.id, art.titulo, art.resumo, art.conteudo, art.autor, getCategoryLabel(art.categoria)]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(searchRaw)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => new Date(b.atualizado_em).getTime() - new Date(a.atualizado_em).getTime());

    return {
      items: clone(filtered),
      total: filtered.length,
      allStoredCount: all.length
    };
  }

  function getCategoryCounts() {
    const all = readFromStorage();
    const counts = { todos: all.length };
    CATALOGS.categories.forEach((cat) => {
      counts[cat.codigo] = all.filter((a) => a.categoria === cat.codigo).length;
    });
    return counts;
  }

  function getArticleById(id) {
    const all = readFromStorage();
    const found = all.find((a) => a.id === id);
    return found ? clone(found) : null;
  }

  function generateNextId(existing) {
    const maxNum = existing.reduce((max, item) => {
      const m = String(item.id || '').match(/(\d+)$/);
      return m ? Math.max(max, Number.parseInt(m[1], 10)) : max;
    }, 0);
    return `ART-${String(maxNum + 1).padStart(3, '0')}`;
  }

  function createArticle(input, actorName = 'Equipe CRM (Demo)') {
    const all = readFromStorage();
    const record = normalizeArticle({
      id: generateNextId(all),
      titulo: input.titulo,
      categoria: normalizeCategory(input.categoria),
      resumo: input.resumo,
      conteudo: input.conteudo,
      autor: String(input.autor || actorName || 'Secretaria Escolar (Demo)').trim(),
      atualizado_em: new Date().toISOString()
    });
    all.unshift(record);
    writeToStorage(all);
    return clone(record);
  }

  function updateArticle(id, updates) {
    const all = readFromStorage();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return null;

    const current = all[idx];
    const updated = normalizeArticle({
      ...current,
      titulo: updates.titulo !== undefined ? String(updates.titulo).trim() || current.titulo : current.titulo,
      categoria: updates.categoria !== undefined ? normalizeCategory(updates.categoria) : current.categoria,
      resumo: updates.resumo !== undefined ? String(updates.resumo).trim() : current.resumo,
      conteudo: updates.conteudo !== undefined ? String(updates.conteudo).trim() : current.conteudo,
      autor: updates.autor !== undefined ? String(updates.autor).trim() || current.autor : current.autor,
      atualizado_em: new Date().toISOString()
    });
    all[idx] = updated;
    writeToStorage(all);
    return clone(updated);
  }

  function deleteArticle(id) {
    const all = readFromStorage();
    const idx = all.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    const removed = all[idx];
    all.splice(idx, 1);
    writeToStorage(all);
    return clone(removed);
  }

  function restoreDemoArticles() {
    const seeded = createSeedArticles();
    writeToStorage(seeded);
    return clone(seeded);
  }

  globalScope.EnsinaAiConhecimentoService = Object.freeze({
    STORAGE_KEY,
    CATALOGS,
    getCategoryLabel,
    listArticles,
    getCategoryCounts,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    restoreDemoArticles
  });
})(window);
