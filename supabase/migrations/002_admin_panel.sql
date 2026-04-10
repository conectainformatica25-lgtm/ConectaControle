-- 002 — Colunas para painel admin e rastreamento de atividade
-- Executar no banco de produção antes de usar o painel admin

-- Adicionar colunas de assinatura na tabela companies (IF NOT EXISTS para idempotência)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='status') THEN
    ALTER TABLE companies ADD COLUMN status text NOT NULL DEFAULT 'trial';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='trial_ends_at') THEN
    ALTER TABLE companies ADD COLUMN trial_ends_at timestamptz NOT NULL DEFAULT (now() + interval '7 days');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='expires_at') THEN
    ALTER TABLE companies ADD COLUMN expires_at timestamptz;
  END IF;
  -- Flag para bloqueio manual pelo super admin (não é sobrescrito pelo pagamento)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='admin_blocked') THEN
    ALTER TABLE companies ADD COLUMN admin_blocked boolean NOT NULL DEFAULT false;
  END IF;
END $$;

-- Adicionar last_login_at na tabela users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_login_at') THEN
    ALTER TABLE users ADD COLUMN last_login_at timestamptz;
  END IF;
END $$;
