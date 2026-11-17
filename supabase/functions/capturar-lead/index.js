/**
 * ENSINA AÍ — Supabase Edge Function: capturar-lead
 * Runtime: Deno 2 (JavaScript ES6+ Vanilla)
 * Objetivo: Receber manifestações de interesse da Landing Page pública com
 * validação estrita, proteção anti-spam, CORS controlado e gravação segura em `public.leads`.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const DEFAULT_ALLOWED_ORIGINS = [
  'https://maisaalourenco.github.io',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const RATE_LIMIT_MAX_REQUESTS = 5;
const DEDUP_WINDOW_MS = 10 * 60 * 1000; // 10 minutos
const MAX_PAYLOAD_BYTES = 8192;

// Armazenamento em memória por instância isolada (complementado por deduplicação no banco)
const ipRequestLog = new Map();

function getAllowedOrigins() {
  const extra = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  return new Set([...DEFAULT_ALLOWED_ORIGINS, ...extra]);
}

function buildCorsHeaders(origin, allowedOrigins) {
  const allowOrigin = origin && allowedOrigins.has(origin) ? origin : '';
  const headers = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff'
  };

  if (allowOrigin) {
    headers['Access-Control-Allow-Origin'] = allowOrigin;
  }

  return headers;
}

function jsonResponse(status, body, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders
  });
}

function getClientIp(req) {
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = req.headers.get('x-real-ip');
  return realIp ? realIp.trim() : 'unknown';
}

function checkRateLimit(ip) {
  const now = Date.now();
  const timestamps = (ipRequestLog.get(ip) ?? []).filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);

  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    ipRequestLog.set(ip, timestamps);
    return false;
  }

  timestamps.push(now);
  ipRequestLog.set(ip, timestamps);

  // Limpeza simples para evitar crescimento indefinido em instâncias aquecidas
  if (ipRequestLog.size > 500) {
    for (const [key, list] of ipRequestLog.entries()) {
      if (!list.some((ts) => now - ts < RATE_LIMIT_WINDOW_MS)) {
        ipRequestLog.delete(key);
      }
    }
  }

  return true;
}

function sanitizeText(value, maxLength) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

function validatePayload(rawBody) {
  if (!rawBody || typeof rawBody !== 'object' || Array.isArray(rawBody)) {
    return { valid: false, message: 'Formato de requisição inválido.' };
  }

  // Honeypot anti-bot: campo invisível deve permanecer vazio
  const honeypot = typeof rawBody.website === 'string' ? rawBody.website.trim() : '';
  if (honeypot.length > 0) {
    return { valid: true, isBot: true };
  }

  const nomeResponsavel = sanitizeText(rawBody.nome_responsavel, 120);
  const etapaCodigo = sanitizeText(rawBody.etapa_codigo, 40).toLowerCase();
  const turnoCodigo = sanitizeText(rawBody.turno_codigo, 40).toLowerCase();
  const telefoneDigitos = typeof rawBody.telefone === 'string' ? rawBody.telefone.replace(/\D/g, '') : '';
  const email = sanitizeText(rawBody.email, 160).toLowerCase();
  const nomeAlunoRaw = sanitizeText(rawBody.nome_aluno, 120);
  const mensagemRaw = sanitizeText(rawBody.mensagem_inicial, 500);
  const consentimento = rawBody.consentimento_contato === true;
  const versaoAviso = sanitizeText(rawBody.versao_aviso_privacidade, 40) || 'v1-2026-11';
  const turnstileToken = typeof rawBody.turnstile_token === 'string' ? rawBody.turnstile_token.trim() : '';

  if (nomeResponsavel.length < 3 || !/^[\p{L}\s'-]{3,120}$/u.test(nomeResponsavel)) {
    return { valid: false, message: 'Informe um nome de responsável válido (mínimo de 3 letras).' };
  }

  if (!/^[a-z][a-z0-9_]{1,39}$/.test(etapaCodigo)) {
    return { valid: false, message: 'Selecione uma etapa ou série de interesse válida.' };
  }

  if (!/^[a-z][a-z0-9_]{1,39}$/.test(turnoCodigo)) {
    return { valid: false, message: 'Selecione um turno desejado válido.' };
  }

  if (!/^\d{10,11}$/.test(telefoneDigitos)) {
    return { valid: false, message: 'Informe um WhatsApp brasileiro válido com DDD (10 ou 11 dígitos).' };
  }

  const ddd = Number.parseInt(telefoneDigitos.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) {
    return { valid: false, message: 'Informe um DDD brasileiro válido.' };
  }

  if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
    return { valid: false, message: 'Informe um endereço de e-mail válido.' };
  }

  if (nomeAlunoRaw && (nomeAlunoRaw.length < 2 || !/^[\p{L}\s'-]{2,120}$/u.test(nomeAlunoRaw))) {
    return { valid: false, message: 'O nome do aluno(a), quando preenchido, deve conter ao menos 2 letras.' };
  }

  if (!consentimento) {
    return { valid: false, message: 'É necessário autorizar o contato para concluir o envio.' };
  }

  return {
    valid: true,
    isBot: false,
    turnstileToken,
    data: {
      nome_responsavel: nomeResponsavel,
      etapa_codigo: etapaCodigo,
      turno_codigo: turnoCodigo,
      telefone: telefoneDigitos,
      email,
      nome_aluno: nomeAlunoRaw || null,
      mensagem_inicial: mensagemRaw || null,
      versao_aviso_privacidade: versaoAviso
    }
  };
}

async function verifyTurnstileIfConfigured(token, ip) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return true;
  if (!token) return false;

  const formData = new URLSearchParams({
    secret,
    response: token,
    remoteip: ip
  });

  const resp = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData
  });

  if (!resp.ok) return false;
  const result = await resp.json();
  return Boolean(result?.success);
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin') ?? '';
  const allowedOrigins = getAllowedOrigins();
  const corsHeaders = buildCorsHeaders(origin, allowedOrigins);

  if (req.method === 'OPTIONS') {
    if (origin && !allowedOrigins.has(origin)) {
      return jsonResponse(403, { sucesso: false, mensagem: 'Origem não autorizada.' }, corsHeaders);
    }
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse(405, { sucesso: false, mensagem: 'Método não permitido.' }, corsHeaders);
  }

  // Em navegadores, exige origem permitida quando o cabeçalho Origin estiver presente
  if (origin && !allowedOrigins.has(origin)) {
    return jsonResponse(403, { sucesso: false, mensagem: 'Origem não autorizada.' }, corsHeaders);
  }

  const contentType = req.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return jsonResponse(415, { sucesso: false, mensagem: 'Conteúdo deve ser application/json.' }, corsHeaders);
  }

  const clientIp = getClientIp(req);
  if (!checkRateLimit(clientIp)) {
    return jsonResponse(
      429,
      { sucesso: false, mensagem: 'Muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente.' },
      corsHeaders
    );
  }

  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return jsonResponse(400, { sucesso: false, mensagem: 'Não foi possível ler os dados enviados.' }, corsHeaders);
  }

  if (!rawText || rawText.length > MAX_PAYLOAD_BYTES) {
    return jsonResponse(400, { sucesso: false, mensagem: 'Tamanho da requisição inválido.' }, corsHeaders);
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(rawText);
  } catch {
    return jsonResponse(400, { sucesso: false, mensagem: 'JSON inválido na requisição.' }, corsHeaders);
  }

  const validation = validatePayload(parsedBody);
  if (!validation.valid) {
    return jsonResponse(400, { sucesso: false, mensagem: validation.message }, corsHeaders);
  }

  // Resposta neutra para preenchimentos capturados pelo honeypot
  if (validation.isBot) {
    return jsonResponse(
      200,
      { sucesso: true, protocolo: 'SOL-OK', mensagem: 'Solicitação recebida com sucesso.' },
      corsHeaders
    );
  }

  const turnstileOk = await verifyTurnstileIfConfigured(validation.turnstileToken, clientIp);
  if (!turnstileOk) {
    return jsonResponse(400, { sucesso: false, mensagem: 'Falha na verificação anti-spam. Tente novamente.' }, corsHeaders);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Variáveis SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes na Edge Function.');
    return jsonResponse(500, { sucesso: false, mensagem: 'Serviço temporariamente indisponível.' }, corsHeaders);
  }

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });

  const payload = validation.data;

  try {
    // 1. Validar se etapa e turno existem e estão ativos no catálogo
    const [
      { data: serie, error: erroSerie },
      { data: turno, error: erroTurno }
    ] = await Promise.all([
      supabaseAdmin
        .from('series_escolares')
        .select('id')
        .eq('codigo', payload.etapa_codigo)
        .eq('ativo', true)
        .maybeSingle(),
      supabaseAdmin
        .from('turnos')
        .select('id')
        .eq('codigo', payload.turno_codigo)
        .eq('ativo', true)
        .maybeSingle()
    ]);

    if (erroSerie || erroTurno) {
      console.error('Erro ao consultar catálogos:', erroSerie?.code ?? erroTurno?.code);
      return jsonResponse(502, { sucesso: false, mensagem: 'Não foi possível validar as opções escolares.' }, corsHeaders);
    }

    if (!serie || !turno) {
      return jsonResponse(
        422,
        { sucesso: false, mensagem: 'A etapa ou o turno selecionado ainda não está disponível para matrícula.' },
        corsHeaders
      );
    }

    // 2. Deduplicação no banco em janela de 10 minutos para evitar duplicidades acidentais/bots
    const sinceIso = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();
    const { data: recente, error: erroDedup } = await supabaseAdmin
      .from('leads')
      .select('id')
      .eq('telefone', payload.telefone)
      .gte('criado_em', sinceIso)
      .limit(1)
      .maybeSingle();

    if (erroDedup) {
      console.error('Erro na verificação de duplicidade:', erroDedup.code);
      return jsonResponse(502, { sucesso: false, mensagem: 'Erro ao processar sua solicitação.' }, corsHeaders);
    }

    if (recente) {
      return jsonResponse(
        429,
        {
          sucesso: false,
          mensagem: 'Já recebemos uma solicitação com este WhatsApp recentemente. Nossa equipe entrará em contato em breve.'
        },
        corsHeaders
      );
    }

    // 3. Inserção segura em `public.leads` (dispara distribuição automática via trigger do banco)
    const nowIso = new Date().toISOString();
    const { data: leadCriado, error: erroInsert } = await supabaseAdmin
      .from('leads')
      .insert({
        nome_responsavel: payload.nome_responsavel,
        telefone: payload.telefone,
        email: payload.email,
        nome_aluno: payload.nome_aluno,
        serie_interesse_id: serie.id,
        turno_interesse_id: turno.id,
        canal: 'site',
        mensagem_inicial: payload.mensagem_inicial,
        consentimento_contato: true,
        consentimento_em: nowIso,
        versao_aviso_privacidade: payload.versao_aviso_privacidade
      })
      .select('id')
      .single();

    if (erroInsert || !leadCriado) {
      console.error('Erro ao inserir lead:', erroInsert?.code);
      return jsonResponse(500, { sucesso: false, mensagem: 'Não foi possível registrar seu interesse agora.' }, corsHeaders);
    }

    const protocolo = `EA-${leadCriado.id.slice(0, 8).toUpperCase()}`;

    return jsonResponse(
      201,
      {
        sucesso: true,
        protocolo,
        mensagem: 'Interesse em matrícula registrado com sucesso!'
      },
      corsHeaders
    );
  } catch (err) {
    console.error('Erro inesperado em capturar-lead:', err?.message ?? 'desconhecido');
    return jsonResponse(500, { sucesso: false, mensagem: 'Erro interno ao processar solicitação.' }, corsHeaders);
  }
});
