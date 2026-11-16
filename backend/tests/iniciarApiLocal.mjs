
import dotenv from "dotenv";

const { parsed: ambiente } = dotenv.config({
  path: ".env.test.local",
  quiet: true
});

// Impede iniciar o teste conectado ao Supabase hospedado.
if (
  !/^http:\/\/(localhost|127\.0\.0\.1):54321\/?$/.test(
    ambiente?.API_URL ?? ""
  )
) {
  throw new Error(
    "Bloqueado: a API de testes exige o Supabase local."
  );
}

if (!ambiente.ANON_KEY || !ambiente.SERVICE_ROLE_KEY) {
  throw new Error("Credenciais locais incompletas.");
}

// Configurar a API antes de importar o servidor.
process.env.SUPABASE_URL = ambiente.API_URL;
process.env.SUPABASE_PUBLISHABLE_KEY = ambiente.ANON_KEY;
process.env.SUPABASE_SECRET_KEY = ambiente.SERVICE_ROLE_KEY;
process.env.PORT = "3002";

if (
  !/^[a-f0-9]{64}$/.test(
    ambiente.N8N_INTEGRATION_TOKEN ?? ""
  )
) {
  throw new Error(
    "Token de integração local ausente ou inválido."
  );
}

process.env.N8N_INTEGRATION_TOKEN =
  ambiente.N8N_INTEGRATION_TOKEN;

console.log("Iniciando API com Supabase local.");

await import("../src/server.js");
