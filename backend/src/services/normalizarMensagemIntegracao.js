
export function normalizarMensagemIntegracao(evento) {
  if (
    !evento ||
    typeof evento !== "object" ||
    Array.isArray(evento) ||
    evento.versao !== 1 ||
    evento.canal !== "telegram"
  ) {
    return null;
  }

  const integracaoId = evento.integracao_id;

  if (
    typeof integracaoId !== "string" ||
    !/^[a-z0-9][a-z0-9_-]{1,39}$/.test(integracaoId)
  ) {
    return null;
  }

  if (
    typeof evento.evento_id !== "string" ||
    !/^\d+$/.test(evento.evento_id) ||
    typeof evento.conversa_id !== "string" ||
    !/^-?\d+$/.test(evento.conversa_id) ||
    typeof evento.mensagem_id !== "string" ||
    !/^\d+$/.test(evento.mensagem_id)
  ) {
    return null;
  }

  const texto =
    typeof evento.texto === "string"
      ? evento.texto.trim()
      : "";

  if (!texto || texto.length > 4000) {
    return null;
  }

  return {
    versao: 1,
    canal: "telegram",
    integracao_id: integracaoId,
    evento_id: evento.evento_id,
    conversa_id: evento.conversa_id,
    mensagem_id: evento.mensagem_id,
    texto,
    chave_idempotencia:
      `telegram:${integracaoId}:${evento.evento_id}`
  };
}
