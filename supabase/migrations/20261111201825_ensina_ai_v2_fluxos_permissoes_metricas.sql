
-- ENSINA AI V2 / Parte 2: horarios operacionais, controle de colunas e outbox.
-- Registros nao sao enviados ao n8n ate existir consumidor autenticado.

-- Permissoes somente para colunas operacionalmente editaveis.
-- A autorizacao da linha permanece sob RLS e funcoes de verificacao.
grant update (disponivel) on public.perfis to authenticated;
grant update (nome_responsavel,telefone,email,serie_interesse_id,turno_interesse_id,mensagem_inicial)
  on public.leads to authenticated;
grant update (status,observacoes,atendente_id) on public.atendimentos to authenticated;
grant update (agendada_para,status,observacoes) on public.visitas to authenticated;
grant update (titulo,descricao,vencimento_em,status) on public.tarefas to authenticated;

-- Primeira resposta: somente quando uma interacao de saida humana for registrada.
-- Tempo gerado pelo banco para nao depender de relogios do cliente.
create or replace function private.marcar_primeira_resposta_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.direcao = 'saida'
     and new.tipo in ('mensagem','ligacao')
     and new.autor_id is not null
     and new.canal <> 'chat_ia'
  then
    update public.atendimentos
       set primeira_resposta_em = clock_timestamp()
     where id = new.atendimento_id
       and primeira_resposta_em is null;
  end if;
  return new;
end;
$$;
revoke all on function private.marcar_primeira_resposta_v2() from public,anon,authenticated;
create trigger interacoes_primeira_resposta_v2
after insert on public.interacoes
for each row execute function private.marcar_primeira_resposta_v2();

-- Carimbo de encerramento governado pelo banco.
create or replace function private.marcar_conclusao_atendimento_v2()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if new.status in ('concluido','perdido') then
      new.concluido_em := clock_timestamp();
    else
      new.concluido_em := null;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function private.marcar_conclusao_atendimento_v2() from public,anon,authenticated;
create trigger atendimentos_conclusao_v2
before update of status on public.atendimentos
for each row execute function private.marcar_conclusao_atendimento_v2();

-- Registrar o evento de lead ao criar seu atendimento automatico.
-- Sem nome, telefone ou email no payload de integracao.
create or replace function private.gerar_evento_atendimento_v2()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.eventos_integracao
    (lead_id,atendimento_id,tipo,payload,chave_idempotencia)
  values
    (new.lead_id,new.id,'novo_lead',
     jsonb_build_object('lead_id',new.lead_id,'atendimento_id',new.id),
     'novo_lead:' || new.lead_id::text)
  on conflict (chave_idempotencia) do nothing;
  return new;
end;
$$;
revoke all on function private.gerar_evento_atendimento_v2() from public,anon,authenticated;
create trigger atendimentos_evento_novo_v2
after insert on public.atendimentos
for each row execute function private.gerar_evento_atendimento_v2();

comment on column public.atendimentos.primeira_resposta_em is
  'Registrada automaticamente pelo gatilho de interacoes para contato humano de saida.';
comment on column public.atendimentos.concluido_em is
  'Registrada automaticamente ao alterar status para concluido ou perdido.';
comment on column public.series_escolares.codigo is
  'Identificador estavel da opcao mostrada na LP; nao usar ID hardcoded no Node.js.';
comment on column public.turnos.codigo is
  'Identificador estavel do turno mostrado na LP.';
;
