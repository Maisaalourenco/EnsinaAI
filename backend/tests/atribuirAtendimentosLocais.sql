
-- ENSINA AÍ
-- Somente para o banco local de testes.

BEGIN;

-- Habilitar temporariamente os atendentes
UPDATE public.perfis
SET disponivel = true
WHERE nome IN (
  'Atendente A Teste',
  'Atendente B Teste'
)
AND papel = 'atendente';

-- Atribuir cada atendimento ao funcionário correto
UPDATE public.atendimentos AS a
SET atendente_id = p.id
FROM public.leads AS l,
     public.perfis AS p
WHERE a.lead_id = l.id
  AND a.atendente_id IS NULL
  AND (
    (
      l.email = 'teste-a@example.invalid'
      AND p.nome = 'Atendente A Teste'
    )
    OR
    (
      l.email = 'teste-b@example.invalid'
      AND p.nome = 'Atendente B Teste'
    )
  )
RETURNING
  l.email,
  p.nome AS atendente,
  a.status;

-- Restaurar a indisponibilidade dos atendentes
UPDATE public.perfis
SET disponivel = false
WHERE nome IN (
  'Atendente A Teste',
  'Atendente B Teste'
);

COMMIT;
