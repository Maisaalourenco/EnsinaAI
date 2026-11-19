
/**
 * ENSINA AÍ — Autenticação real do CRM
 * Ambiente: Supabase Staging
 */

(function (window) {
  'use strict';

  const config = window.EnsinaAiSupabaseConfig;

  if (!config || !window.supabase) {
    console.error('Supabase não foi carregado corretamente.');
    return;
  }

  const client = window.supabase.createClient(
    config.url,
    config.publishableKey
  );

  async function buscarPerfil(userId) {
    const { data, error } = await client
      .from('perfis')
      .select('id, nome, papel, ativo')
      .eq('id', userId)
      .single();

    if (error || !data || !data.ativo) {
      throw new Error(
        'Usuário sem perfil ativo no CRM.'
      );
    }

    if (!['gestor', 'atendente'].includes(data.papel)) {
      throw new Error('Perfil sem permissão de acesso.');
    }

    return data;
  }

  async function entrar(email, senha) {
    const { data, error } =
      await client.auth.signInWithPassword({
        email: email.trim(),
        password: senha
      });

    if (error) {
      throw new Error(
        'Não foi possível autenticar. Verifique suas credenciais.'
      );
    }

    try {
      const perfil = await buscarPerfil(data.user.id);

      return {
        usuario: data.user,
        perfil
      };
    } catch (erro) {
      await client.auth.signOut();
      throw erro;
    }
  }

  async function usuarioAtual() {
    const { data, error } = await client.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    try {
      const perfil = await buscarPerfil(data.user.id);

      return {
        usuario: data.user,
        perfil
      };
    } catch {
      await client.auth.signOut();
      return null;
    }
  }

  async function sair() {
    const { error } = await client.auth.signOut();

    if (error) {
      throw new Error('Não foi possível encerrar a sessão.');
    }
  }

  window.EnsinaAiCrmAuth = Object.freeze({
    client,
    entrar,
    usuarioAtual,
    sair
  });

})(window);
