-- V2: consentimento nao pode ser reescrito por operador comum.
revoke update (consentimento_contato,consentimento_em) on public.leads from authenticated;
comment on column public.leads.versao_aviso_privacidade is 'Versao do aviso de privacidade apresentada ao responsavel na captacao; preenchida pelo backend.';;
