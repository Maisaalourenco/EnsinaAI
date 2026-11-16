
import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizarMensagemIntegracao
} from "../src/services/normalizarMensagemIntegracao.js";

const mensagem = {
  versao: 1,
  canal: "telegram",
  integracao_id: "bot_demo",
  evento_id: "123456",
  conversa_id: "987654321",
  mensagem_id: "42",
  texto: "Gostaria de saber sobre as matrículas."
};

test("Aceita mensagem válida do Telegram", () => {
  const resultado = normalizarMensagemIntegracao(mensagem);

  assert.equal(resultado.canal, "telegram");
  assert.equal(resultado.conversa_id, "987654321");
  assert.equal(
    resultado.chave_idempotencia,
    "telegram:bot_demo:123456"
  );
});

test("Rejeita mensagem sem conteúdo", () => {
  const resultado = normalizarMensagemIntegracao({
    ...mensagem,
    texto: "   "
  });

  assert.equal(resultado, null);
});

test("Rejeita evento com identificador inválido", () => {
  const resultado = normalizarMensagemIntegracao({
    ...mensagem,
    evento_id: ""
  });

  assert.equal(resultado, null);
});
