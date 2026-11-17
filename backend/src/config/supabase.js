
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

const credenciaisConfiguradas = Boolean(
  supabaseUrl && supabaseKey
);

const ambientePreview =
  process.env.VERCEL_ENV === "preview";

// Fora da prévia, exigimos as credenciais normalmente.
if (!credenciaisConfiguradas && !ambientePreview) {
  throw new Error(
    "Configurações do Supabase não encontradas no ambiente."
  );
}

// Na prévia sem credenciais, o banco fica indisponível.
export const supabaseAdmin = credenciaisConfiguradas
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;
