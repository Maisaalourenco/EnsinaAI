
import test from "node:test";
import assert from "node:assert/strict";

import {
  aplicarEscopoAtendimentos
} from "../src/services/escopoAtendimentos.js";

// Registros fictícios, somente em memória.
const registros = [
  { id: "at-01", atendente_id: "funcionario-a" },
  { id: "at-02", atendente_id: "funcionario-b" },
  { id: "at-03", atendente_id: null }
];

// Simula a filtragem de uma consulta ao banco.
function consultarComo(usuario) {
  let dados = [...registros];

  const consulta = {
    eq(campo, valor) {
      dados = dados.filter(
        registro => registro[campo] === valor
      );
      return this;
    },

    resultado() {
      return dados;
    }
  };

  return aplicarEscopoAtendimentos(
    consulta,
    usuario
  ).resultado();
}

test("Atendente A não visualiza registros de B", () => {
  const dados = consultarComo({
    id: "funcionario-a",
    papel: "atendente"
  });

  assert.deepEqual(
    dados.map(item => item.id),
    ["at-01"]
  );
});

test("Atendente B não visualiza registros de A", () => {
  const dados = consultarComo({
    id: "funcionario-b",
    papel: "atendente"
  });

  assert.deepEqual(
    dados.map(item => item.id),
    ["at-02"]
  );
});

test("Gestor visualiza todos os registros", () => {
  const dados = consultarComo({
    id: "gestor-01",
    papel: "gestor"
  });

  assert.deepEqual(
    dados.map(item => item.id),
    ["at-01", "at-02", "at-03"]
  );
});
