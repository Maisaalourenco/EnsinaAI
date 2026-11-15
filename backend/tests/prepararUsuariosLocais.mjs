
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { existsSync, writeFileSync } from "node:fs";

const { parsed: env } = dotenv.config({
  path: ".env.test.local",
  quiet: true
});

if (
  !/^http:\/\/(localhost|127\.0\.0\.1):54321\/?$/.test(
    env?.API_URL ?? ""
  )
) {
  throw new Error("Operação bloqueada: ambiente não é local.");
}

if (!env?.SERVICE_ROLE_KEY) {
  throw new Error("Chave administrativa local ausente.");
}

const arquivo = ".env.test.users.local";

if (existsSync(arquivo)) {
  throw new Error("As credenciais de teste já existem.");
}

const admin = createClient(
  env.API_URL,
  env.SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

const usuarios = [
  {
    codigo: "ATENDENTE_A",
    nome: "Atendente A Teste",
    email: "atendente.a.teste@example.com",
    papel: "atendente"
  },
  {
    codigo: "ATENDENTE_B",
    nome: "Atendente B Teste",
    email: "atendente.b.teste@example.com",
    papel: "atendente"
  },
  {
    codigo: "GESTORA",
    nome: "Gestora Teste",
    email: "gestora.teste@example.com",
    papel: "gestor"
  }
];

const criados = [];
const credenciais = [];

try {
  for (const usuario of usuarios) {
    const senha = randomBytes(24).toString("base64url");

    const { data, error } =
      await admin.auth.admin.createUser({
        email: usuario.email,
        password: senha,
        email_confirm: true
      });

    if (error || !data.user) {
      throw new Error(
        `Falha no Auth de ${usuario.codigo}: ${error?.message}`
      );
    }

    criados.push(data.user.id);

    const { error: erroPerfil } = await admin
      .from("perfis")
      .insert({
        id: data.user.id,
        nome: usuario.nome,
        papel: usuario.papel,
        ativo: true,
        disponivel: false
      });

    if (erroPerfil) {
      throw new Error(
        `Falha no perfil de ${usuario.codigo}: ${erroPerfil.message}`
      );
    }

    credenciais.push(
      `${usuario.codigo}_EMAIL=${usuario.email}`,
      `${usuario.codigo}_PASSWORD=${senha}`
    );
  }

  writeFileSync(
    arquivo,
    credenciais.join("\n") + "\n",
    { flag: "wx", mode: 0o600 }
  );

  console.log("3 usuários locais criados com sucesso.");
  console.log("2 atendentes e 1 gestora.");
  console.log("Credenciais salvas em arquivo ignorado pelo Git.");

} catch (erro) {
  console.error("Falha:", erro.message);

  for (const id of criados.reverse()) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      console.error("Não foi possível desfazer um usuário de teste.");
    }
  }

  process.exitCode = 1;
}
