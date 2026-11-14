
import test from "node:test";
import assert from "node:assert/strict";

import {
  aplicarEscopoAtendimentos
} from "../src/services/escopoAtendimentos.js";

test("Atendente consulta apenas seus registros", () => {
  const chamadas = [];

  const consulta = {
    eq(campo, valor) {
      chamadas.push({ campo, valor });
      return this;
    }
  };

  aplicarEscopoAtendimentos(consulta, {
    id: "funcionario-01",
    papel: "atendente"
  });

  assert.deepEqual(chamadas, [
    {
      campo: "atendente_id",
      valor: "funcionario-01"
    }
  ]);
});

test("Gestor pode consultar todos os atendimentos", () => {
  let filtroAplicado = false;

  const consulta = {
    eq() {
      filtroAplicado = true;
      return this;
    }
  };

  aplicarEscopoAtendimentos(consulta, {
    id: "gestor-01",
    papel: "gestor"
  });

  assert.equal(filtroAplicado, false);
});

test("Perfil desconhecido é bloqueado", () => {
  assert.throws(() => {
    aplicarEscopoAtendimentos({}, {
      id: "usuario-01",
      papel: "visitante"
    });
  });
});
