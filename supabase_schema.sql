-- Tabelas

CREATE TABLE categories (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  color text,
  is_essential boolean DEFAULT false,
  expected_amount numeric,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE category_rules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword text NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  ignore_in_reports boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE settings (
  id integer PRIMARY KEY DEFAULT 1,
  base_currency text DEFAULT 'EUR',
  user_id uuid REFERENCES auth.users(id) DEFAULT auth.uid() NOT NULL,
  UNIQUE(id, user_id)
);


-- Row Level Security (RLS)

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas para garantir que o usuário só veja e edite os PRÓPRIOS dados

CREATE POLICY "Users can manage their own categories" ON categories
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own rules" ON category_rules
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own transactions" ON transactions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings" ON settings
  FOR ALL USING (auth.uid() = user_id);

