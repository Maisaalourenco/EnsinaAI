
import test from "node:test";
import assert from "node:assert/strict";

import {
  autenticarIntegracao
} from "../src/middlewares/autenticarIntegracao.js";

const tokenTeste = "a".repeat(64);

function simularRequisicao(token) {
  let status;
  let proximo = false;

  const req = {
    get(nome) {
      return nome === "x-integracao-token"
        ? token
        : undefined;
    }
  };

  const res = {
    status(codigo) {
      status = codigo;
      return this;
    },

    json() {
      return this;
    }
  };

  autenticarIntegracao(req, res, () => {
    proximo = true;
  });

  return { status, proximo };
}

test("Bloqueia integração sem configuração", () => {
  const anterior = process.env.N8N_INTEGRATION_TOKEN;

  try {
    delete process.env.N8N_INTEGRATION_TOKEN;

    const resultado = simularRequisicao(tokenTeste);

    assert.equal(resultado.status, 503);
    assert.equal(resultado.proximo, false);
  } finally {
    if (anterior === undefined) {
      delete process.env.N8N_INTEGRATION_TOKEN;
    } else {
      process.env.N8N_INTEGRATION_TOKEN = anterior;
    }
  }
});

test("Bloqueia token incorreto", () => {
  const anterior = process.env.N8N_INTEGRATION_TOKEN;

  try {
    process.env.N8N_INTEGRATION_TOKEN = tokenTeste;

    const resultado = simularRequisicao(
      "b".repeat(64)
    );

    assert.equal(resultado.status, 401);
    assert.equal(resultado.proximo, false);
  } finally {
    if (anterior === undefined) {
      delete process.env.N8N_INTEGRATION_TOKEN;
    } else {
      process.env.N8N_INTEGRATION_TOKEN = anterior;
    }
  }
});

test("Autoriza token correto", () => {
  const anterior = process.env.N8N_INTEGRATION_TOKEN;

  try {
    process.env.N8N_INTEGRATION_TOKEN = tokenTeste;

    const resultado = simularRequisicao(tokenTeste);

    assert.equal(resultado.proximo, true);
  } finally {
    if (anterior === undefined) {
      delete process.env.N8N_INTEGRATION_TOKEN;
    } else {
      process.env.N8N_INTEGRATION_TOKEN = anterior;
    }
  }
});
