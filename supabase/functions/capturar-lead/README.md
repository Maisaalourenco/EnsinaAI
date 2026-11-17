# Edge Function `capturar-lead` — ENSINA AÍ

Endpoint público responsável por receber as manifestações de interesse da Landing Page (`index.html`) e gravá-las em `public.leads` no projeto Supabase oficial (`oypdtvqqvbnjulotrxgy`), disparando o fluxo de distribuição automática já existente no banco.

## Pré-requisitos no Supabase (`oypdtvqqvbnjulotrxgy`)

1. **Catálogos ativos:** certifique-se de que `public.series_escolares` (`infantil_1` a `medio`) e `public.turnos` (`matutino`, `vespertino`, `integral`) estejam com `ativo = true` após confirmação da escola.
2. **Segredos da Edge Function (automáticos no Supabase, ou via `supabase secrets set`):**
   - `SUPABASE_URL` (fornecido automaticamente pelo runtime)
   - `SUPABASE_SERVICE_ROLE_KEY` (fornecido automaticamente pelo runtime; nunca expor no frontend)
   - `ALLOWED_ORIGINS` (opcional, separado por vírgula, caso utilize domínio próprio além de `https://maisaalourenco.github.io`)
   - `TURNSTILE_SECRET_KEY` (opcional, caso ative verificação Cloudflare Turnstile)

## Deploy manual via Supabase CLI

```bash
supabase functions deploy capturar-lead \
  --project-ref oypdtvqqvbnjulotrxgy \
  --no-verify-jwt \
  --entrypoint ./supabase/functions/capturar-lead/index.js
```

> **Importante:** Caso o `supabase/config.toml` do repositório principal utilize a seção `[functions.capturar-lead]`, configure `verify_jwt = false` e `entrypoint = "./functions/capturar-lead/index.js"`. Nunca aponte para o projeto de testes `Liliancouto`.
