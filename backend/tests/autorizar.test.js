
import test from "node:test";
import assert from "node:assert/strict";

import { permitirPapeis } from "../src/middlewares/autorizar.js";

test("Gestor pode acessar rota administrativa", () => {
  const req = {
    usuario: {
      papel: "gestor"
    }
  };

  const res = {
    status() {
      throw new Error("Gestor não deveria ser bloqueado");
    }
  };

  let acessoPermitido = false;

  permitirPapeis("gestor")(req, res, () => {
    acessoPermitido = true;
  });

  assert.equal(acessoPermitido, true);
});
