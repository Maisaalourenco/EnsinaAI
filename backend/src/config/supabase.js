
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// Configurações armazenadas no arquivo .env
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

// Verifica se as variáveis existem
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Configurações do Supabase não encontradas no .env"
  );
}

// Exporta a conexão para outros arquivos
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);
