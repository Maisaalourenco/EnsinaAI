/**
 * ENSINA AÍ - Camada de Interface de Envio de Leads (js/lead-gateway.js)
 * Desacopla o formulário HTML/JS da implementação específica de back-end.
 * Não contém segredos nem simula matrículas efetivadas em produção.
 */

(function initLeadGateway(globalScope) {
  'use strict';

  function isLocalDevelopmentHost() {
    const host = globalScope.location ? globalScope.location.hostname : '';
    return host === 'localhost' || host === '127.0.0.1';
  }

  function isDevMockRequested(config) {
    if (!isLocalDevelopmentHost()) return false;
    if (config.devMockMode === true) return true;
    try {
      const params = new URLSearchParams(globalScope.location.search || '');
      return params.get('mockLead') === '1';
    } catch {
      return false;
    }
  }

  function mapHttpStatusToErrorType(status) {
    if (status === 400) return 'VALIDATION_ERROR';
    if (status === 422) return 'CATALOG_UNAVAILABLE';
    if (status === 429) return 'RATE_LIMITED';
    if (status === 404 || status === 502 || status === 503 || status === 504) return 'UNAVAILABLE';
    return 'SERVER_ERROR';
  }

  function getDefaultErrorMessage(errorType) {
    switch (errorType) {
      case 'UNCONFIGURED':
      case 'UNAVAILABLE':
        return 'O formulário online está temporariamente indisponível no momento. Seus dados foram mantidos; entre em contato pelo nosso WhatsApp ao lado.';
      case 'TIMEOUT':
        return 'O serviço demorou mais que o esperado para responder. Seus dados foram mantidos; tente novamente em instantes ou fale conosco pelo WhatsApp.';
      case 'NETWORK_ERROR':
        return 'Não foi possível conectar ao serviço de atendimento. Verifique sua conexão e tente novamente.';
      case 'CATALOG_UNAVAILABLE':
        return 'A série ou o turno selecionado ainda está em atualização para matrícula. Fale com nossa secretaria pelo WhatsApp ao lado.';
      case 'RATE_LIMITED':
        return 'Recebemos muitas solicitações em pouco tempo. Aguarde alguns minutos e tente novamente.';
      case 'VALIDATION_ERROR':
        return 'Verifique os dados informados nos campos do formulário e tente novamente.';
      default:
        return 'Não foi possível concluir o envio agora. Seus dados foram mantidos; tente novamente ou utilize o WhatsApp ao lado.';
    }
  }

  async function submitToRemoteEndpoint(payload, config) {
    const endpoint = typeof config.leadCaptureEndpoint === 'string' ? config.leadCaptureEndpoint.trim() : '';
    if (!endpoint) {
      return {
        ok: false,
        errorType: 'UNCONFIGURED',
        message: getDefaultErrorMessage('UNCONFIGURED')
      };
    }

    const timeoutMs = Number(config.requestTimeoutMs) > 0 ? Number(config.requestTimeoutMs) : 12000;
    const controller = new AbortController();
    const timeoutId = globalScope.setTimeout(() => controller.abort(), timeoutMs);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (config.supabasePublishableKey) {
        headers.apikey = config.supabasePublishableKey;
      }

      const response = await globalScope.fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      let result = null;
      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok || !result || result.sucesso !== true) {
        const errorType = mapHttpStatusToErrorType(response.status);
        const serverMessage =
          result && typeof result.mensagem === 'string' && result.mensagem.trim()
            ? result.mensagem.trim()
            : '';

        return {
          ok: false,
          status: response.status,
          errorType,
          message:
            errorType === 'UNAVAILABLE'
              ? getDefaultErrorMessage('UNAVAILABLE')
              : serverMessage || getDefaultErrorMessage(errorType)
        };
      }

      return {
        ok: true,
        isMock: false,
        protocol: typeof result.protocolo === 'string' ? result.protocolo.trim() : '',
        message: typeof result.mensagem === 'string' ? result.mensagem.trim() : ''
      };
    } catch (error) {
      if (error && error.name === 'AbortError') {
        return {
          ok: false,
          errorType: 'TIMEOUT',
          message: getDefaultErrorMessage('TIMEOUT')
        };
      }
      return {
        ok: false,
        errorType: 'NETWORK_ERROR',
        message: getDefaultErrorMessage('NETWORK_ERROR')
      };
    } finally {
      globalScope.clearTimeout(timeoutId);
    }
  }

  async function submitLead(payload) {
    const config = globalScope.ENSINA_AI_CONFIG || {};

    if (isDevMockRequested(config)) {
      await new Promise((resolve) => globalScope.setTimeout(resolve, 450));
      return {
        ok: true,
        isMock: true,
        protocol: 'DEV-LOCAL-SIMULACAO',
        message: 'Simulação concluída exclusivamente em ambiente local de desenvolvimento.'
      };
    }

    return submitToRemoteEndpoint(payload, config);
  }

  globalScope.EnsinaAiLeadGateway = Object.freeze({
    submitLead,
    isDevMockActive: () => isDevMockRequested(globalScope.ENSINA_AI_CONFIG || {})
  });
})(window);
