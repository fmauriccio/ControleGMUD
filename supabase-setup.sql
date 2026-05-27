-- ============================================================
-- GMUD Manager - Supabase Setup
-- Execute este script no SQL Editor do Supabase
-- ============================================================

-- 1. Tabela principal de dados por usuário (key-value por usuário)
CREATE TABLE IF NOT EXISTS user_data (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  key         text NOT NULL,
  value       jsonb,
  updated_at  timestamptz DEFAULT now(),
  CONSTRAINT  user_data_user_key UNIQUE(user_id, key)
);

-- 2. Índice para buscas rápidas
CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON user_data(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_key     ON user_data(user_id, key);

-- 3. Ativar Row Level Security
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 4. Política: cada usuário só acessa seus próprios dados
CREATE POLICY "Usuário gerencia seus próprios dados"
  ON user_data
  FOR ALL
  TO authenticated
  USING     (auth.uid() = user_id)
  WITH CHECK(auth.uid() = user_id);

-- 5. Configurações de autenticação (execute separadamente no dashboard):
--    Authentication > Providers > Email:
--      - Enable Email provider: ON
--      - Confirm email: OFF (para facilitar testes)
--      - Minimum password length: 8
--    Authentication > Password Strength: Strong (recomendado)

-- 6. Verificar se tudo foi criado corretamente
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'user_data';
