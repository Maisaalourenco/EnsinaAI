
-- ENSINA AI V2 / Parte 1: compatibilidade com a LP e novas estruturas.
alter table public.series_escolares
  add column if not exists codigo text;
create unique index if not exists series_escolares_codigo_uk
  on public.series_escolares(codigo);
alter table public.turnos
  add column if not exists codigo text;
create unique index if not exists turnos_codigo_uk
  on public.turnos(codigo);

-- Registros de demonstracao derivados das opcoes atualmente exibidas na LP.
-- Ativar turnos/etapas somente apos confirmacao da escola.
insert into public.series_escolares(codigo,nome,nivel,ordem,ativo)
values
('infantil_1','Berçário (a partir de 1 ano)','educacao_infantil',1,false),
('infantil_2_5','Maternal e Pré-Escola (2 a 5 anos)','educacao_infantil',2,false),
('fundamental_1','Ensino Fundamental I (1º ao 5º ano)','fundamental_i',3,false),
('fundamental_2','Ensino Fundamental II (6º ao 9º ano)','fundamental_ii',4,false),
('medio','Ensino Médio (1º ao 3º ano)','ensino_medio',5,false)
on conflict (codigo) do nothing;
insert into public.turnos(codigo,nome,ativo)
values
('matutino','Matutino (manhã)',false),
('vespertino','Vespertino (tarde)',false),
('integral','Integral',false)
on conflict (codigo) do nothing;

alter table public.series_escolares
  alter column codigo set not null;
alter table public.turnos
  alter column codigo set not null;

alter table public.series_escolares
  add constraint series_codigo_formato_v2 check (codigo ~ '^[a-z][a-z0-9_]*$');
alter table public.turnos
  add constraint turnos_codigo_formato_v2 check (codigo ~ '^[a-z][a-z0-9_]*$');

alter table public.leads
  add column if not exists versao_aviso_privacidade text;
alter table public.atendimentos
  add column if not exists primeira_resposta_em timestamptz,
  add column if not exists concluido_em timestamptz;

-- Base de conhecimento sem acesso publico direto; divulgacao via API Node.js.
create table if not exists public.base_conhecimento (
  id uuid primary key default gen_random_uuid(),
  pergunta text not null check (length(btrim(pergunta)) > 0),
  resposta text not null check (length(btrim(resposta)) > 0),
  categoria text not null default 'geral',
  fonte text,
  publico boolean not null default false,
  aprovado boolean not null default false,
  ativo boolean not null default true,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists base_conhecimento_consulta_idx
  on public.base_conhecimento(ativo,aprovado,publico,categoria);

-- Outbox: evita enviar notificacoes dentro da mesma transacao do cadastro.
-- Nao incluir dados sensiveis no payload.
create table if not exists public.eventos_integracao (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete set null,
  atendimento_id uuid references public.atendimentos(id) on delete set null,
  tipo text not null check (tipo ~ '^[a-z][a-z0-9_]*$'),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  status text not null default 'pendente'
    check (status in ('pendente','processando','enviado','erro')),
  tentativas integer not null default 0 check (tentativas >= 0),
  proxima_tentativa_em timestamptz,
  processado_em timestamptz,
  ultimo_erro text,
  chave_idempotencia text unique,
  criado_em timestamptz not null default now()
);
create index if not exists eventos_integracao_pendentes_idx
  on public.eventos_integracao(status,proxima_tentativa_em,criado_em)
  where status in ('pendente','erro');
create index if not exists eventos_integracao_lead_idx
  on public.eventos_integracao(lead_id);
create index if not exists eventos_integracao_atendimento_idx
  on public.eventos_integracao(atendimento_id);

alter table public.base_conhecimento enable row level security;
alter table public.eventos_integracao enable row level security;
revoke all on public.base_conhecimento,public.eventos_integracao from public,anon,authenticated;
grant all on public.base_conhecimento,public.eventos_integracao to service_role;

create or replace trigger base_conhecimento_atualizada
before update on public.base_conhecimento for each row
execute function private.atualizar_data();

comment on table public.base_conhecimento is 'Ensina Ai V2: respostas aprovadas para agentes de IA; acesso pela API';
comment on table public.eventos_integracao is 'Ensina Ai V2: outbox interna para futuras automacoes n8n';
;
