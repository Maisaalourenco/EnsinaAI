
import { supabaseAdmin } from "../config/supabase.js";

export async function autenticar(req, res, next) {
  // 1. Ler o token enviado pelo usuário
  const authorization = req.headers.authorization;

  const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

  if (!token) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Token de autenticação não informado."
    });
  }

  try {
    // 2. Verificar o token no Supabase Auth
    const { data, error } =
      await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Token inválido ou expirado."
      });
    }

    // 3. Verificar se o funcionário tem perfil ativo
    const { data: perfil, error: erroPerfil } =
      await supabaseAdmin
        .from("perfis")
        .select("id, nome, papel, ativo")
        .eq("id", data.user.id)
        .maybeSingle();

    if (erroPerfil) {
      return res.status(503).json({
        sucesso: false,
        mensagem: "Não foi possível verificar o perfil."
      });
    }

    if (!perfil || !perfil.ativo) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Funcionário sem acesso autorizado."
      });
    }

    // 4. Disponibilizar o usuário para a próxima função
    req.usuario = {
      id: data.user.id,
      email: data.user.email,
      nome: perfil.nome,
      papel: perfil.papel
    };

    next();

  } catch (erro) {
    console.error("Erro na autenticação:", erro.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno de autenticação."
    });
  }
}
