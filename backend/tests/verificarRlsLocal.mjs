
import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

// Carregar somente o ambiente local.
const { parsed: ambiente } = dotenv.config({
  path: ".env.test.local",
  quiet: true
});

const credenciais = dotenv.parse(
  readFileSync(".env.test.users.local")
);

// Impedir acesso acidental ao banco hospedado.
assert.match(
  ambiente?.API_URL ?? "",
  /^http:\/\/(localhost|127\.0\.0\.1):54321\/?$/
);

assert.ok(ambiente?.ANON_KEY, "Chave pública local ausente");

// Consultar atendimentos usando login real.
async function consultar(perfil) {
  const email = credenciais[`${perfil}_EMAIL`];
  const senha = credenciais[`${perfil}_PASSWORD`];

  assert.ok(email && senha, `Credenciais ausentes: ${perfil}`);

  const supabase = createClient(
    ambiente.API_URL,
    ambiente.ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  const { data: login, error: erroLogin } =
    await supabase.auth.signInWithPassword({
      email,
      password: senha
    });

  if (erroLogin || !login.user) {
    throw new Error(`Login falhou: ${perfil}`);
  }

  const { data, error } = await supabase
    .from("atendimentos")
    .select("id, atendente_id, status");

  if (error) {
    throw new Error(`${perfil}: ${error.message}`);
  }

  return {
    usuarioId: login.user.id,
    atendimentos: data ?? []
  };
}

async function executar() {
  const a = await consultar("ATENDENTE_A");
  const b = await consultar("ATENDENTE_B");
  const gestora = await consultar("GESTORA");

  // Atendente A: somente seu atendimento.
  assert.equal(a.atendimentos.length, 1);
  assert.equal(
    a.atendimentos[0].atendente_id,
    a.usuarioId
  );

  // Atendente B: somente seu atendimento.
  assert.equal(b.atendimentos.length, 1);
  assert.equal(
    b.atendimentos[0].atendente_id,
    b.usuarioId
  );

  // Os dois registros devem ser diferentes.
  assert.notEqual(
    a.atendimentos[0].id,
    b.atendimentos[0].id
  );

  // Gestora: deve visualizar ambos.
  assert.equal(gestora.atendimentos.length, 2);

  assert.deepEqual(
    new Set(gestora.atendimentos.map(item => item.id)),
    new Set([
      a.atendimentos[0].id,
      b.atendimentos[0].id
    ])
  );

  console.log("✅ Atendente A: acesso restrito correto.");
  console.log("✅ Atendente B: acesso restrito correto.");
  console.log("✅ Gestora: acesso geral correto.");
  console.log("✅ Isolamento RLS validado!");
}

executar().catch(erro => {
  console.error("❌ Teste falhou:", erro.message);
  process.exitCode = 1;
});
