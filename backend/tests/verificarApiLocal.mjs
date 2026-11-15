
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

const env = dotenv.parse(
  readFileSync(".env.test.local")
);

const usuarios = dotenv.parse(
  readFileSync(".env.test.users.local")
);

// Garantir que estamos usando somente o Supabase local.
assert.match(
  env.API_URL ?? "",
  /^http:\/\/(127\.0\.0\.1|localhost):54321\/?$/
);

assert.ok(env.ANON_KEY);

async function consultarApi(perfil) {
  const supabase = createClient(
    env.API_URL,
    env.ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  const { data: login, error: erroLogin } =
    await supabase.auth.signInWithPassword({
      email: usuarios[`${perfil}_EMAIL`],
      password: usuarios[`${perfil}_PASSWORD`]
    });

  assert.ifError(erroLogin);
  assert.ok(login.session);

  // Enviar o token à nossa API Express.
  const resposta = await fetch(
    "http://127.0.0.1:3002/api/atendimentos",
    {
      headers: {
        Authorization:
          `Bearer ${login.session.access_token}`
      }
    }
  );

  assert.equal(
    resposta.status,
    200,
    `HTTP inesperado para ${perfil}`
  );

  const resultado = await resposta.json();

  assert.equal(resultado.sucesso, true);
  assert.ok(Array.isArray(resultado.atendimentos));

  return {
    id: login.user.id,
    registros: resultado.atendimentos
  };
}

async function executar() {
  const a = await consultarApi("ATENDENTE_A");
  const b = await consultarApi("ATENDENTE_B");
  const gestora = await consultarApi("GESTORA");

  // Verificar isolamento da Atendente A.
  assert.equal(a.registros.length, 1);
  assert.equal(a.registros[0].atendente_id, a.id);

  console.log("✅ HTTP Atendente A: acesso correto.");

  // Verificar isolamento da Atendente B.
  assert.equal(b.registros.length, 1);
  assert.equal(b.registros[0].atendente_id, b.id);

  assert.notEqual(
    a.registros[0].id,
    b.registros[0].id
  );

  console.log("✅ HTTP Atendente B: acesso correto.");

  // Gestora deve visualizar exatamente os dois registros.
  assert.equal(gestora.registros.length, 2);

  assert.deepEqual(
    new Set(gestora.registros.map(r => r.id)),
    new Set([
      a.registros[0].id,
      b.registros[0].id
    ])
  );

  console.log("✅ HTTP Gestora: acesso correto.");
  console.log("✅ Isolamento da API Express validado!");
}

executar().catch(erro => {
  console.error("❌ Teste falhou:", erro.message);
  process.exitCode = 1;
});
