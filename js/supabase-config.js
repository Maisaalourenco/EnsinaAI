/**
 * ENSINA AÍ - Configuração Pública do Supabase (js/supabase-config.js)
 * Contém exclusivamente URLs públicas e parâmetros de cliente.
 * NUNCA armazene chaves secretas (service_role / secret key) neste arquivo.
 */

(function initEnsinaAiConfig(globalScope) {
  'use strict';

  const SUPABASE_PROJECT_REF = 'oypdtvqqvbnjulotrxgy';
  const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

  globalScope.ENSINA_AI_CONFIG = Object.freeze({
    projectRef: SUPABASE_PROJECT_REF,
    supabaseUrl: SUPABASE_URL,
    edgeFunctionsBaseUrl: `${SUPABASE_URL}/functions/v1`,
    leadCaptureEndpoint: `${SUPABASE_URL}/functions/v1/capturar-lead`,
    // Opcional: chave pública (publishable / anon) caso seja usada em blocos futuros de Auth.
    // A Edge Function pública capturar-lead aceita requisições sem chave secreta no navegador.
    supabasePublishableKey: '',
    privacyNoticeVersion: 'v1-2026-11',
    requestTimeoutMs: 12000,
    submitCooldownMs: 8000,
    devMockMode: false
  });
})(window);
